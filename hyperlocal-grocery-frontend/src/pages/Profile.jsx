import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { AuthContext } from "../context/AuthContext";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");
  const API_BASE = API_BASE_URL;

  const { user: authUser, login: updateAuthUser } = useContext(AuthContext);

  // Edit Profile Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    profileImage: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4000);
  };

  const fetchProfile = async () => {
    if (!userToken) return;
    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_BASE}/users/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProfileData(data);
      } else {
        setProfileError(data.message || "Failed to load profile details");
      }
    } catch (err) {
      console.error("FETCH PROFILE ERROR:", err);
      setProfileError("Network error fetching profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/my`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error("FETCH PROFILE ORDERS ERROR:", err);
    }
  };

  useEffect(() => {
    if (!userToken) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchOrders();
    const list = JSON.parse(localStorage.getItem("userAddresses")) || [];
    setSavedAddresses(list);
  }, [userToken]);

  useEffect(() => {
    if (profileData) {
      setEditForm({
        name: profileData.name || "",
        phone: profileData.phone || "",
        profileImage: profileData.profileImage || profileData.profilePhotoUrl || "",
      });
    }
  }, [profileData]);

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
    if (editErrors[e.target.name]) {
      setEditErrors({
        ...editErrors,
        [e.target.name]: "",
      });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!editForm.name.trim()) {
      errors.name = "Name is required";
    }

    if (editForm.phone.trim()) {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(editForm.phone.trim())) {
        errors.phone = "Invalid phone number format (use 10-15 digits)";
      }
    }

    if (editForm.profileImage.trim()) {
      try {
        new URL(editForm.profileImage.trim());
      } catch (_) {
        errors.profileImage = "Invalid URL format";
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (res.ok) {
        setProfileData(data);
        updateAuthUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        setIsEditModalOpen(false);
        showToast("Profile updated successfully!", "success");
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("SAVE PROFILE ERROR:", err);
      showToast("Network error saving profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const reorder = async (order) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${order._id}/reorder-check`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (!data.canReorder) {
        alert(`Out of stock: ${data.unavailableItems.join(", ")}`);
        return;
      }

      localStorage.setItem(
        "cart",
        JSON.stringify(
          order.items.map((i) => ({
            _id: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            storeId: order.storeId,
          }))
        )
      );
      navigate("/cart");
    } catch (err) {
      console.error("REORDER ERROR:", err);
      alert("Failed to reorder");
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order cancelled");
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("CANCEL ORDER ERROR:", err);
      alert("Failed to cancel order");
    }
  };

  const getCustomerStatus = (order) => {
    if (order.deliveryStatus === "Delivered") return "Delivered";
    return order.status;
  };

  const statusBadge = (status) => {
    const styles = {
      Placed: "bg-yellow-150 text-yellow-800 border-yellow-200",
      Packed: "bg-blue-50 text-blue-700 border-blue-100",
      "Out for Delivery": "bg-purple-50 text-purple-700 border-purple-100",
      Delivered: "bg-green-50 text-green-700 border-green-200",
      Cancelled: "bg-red-50 text-red-700 border-red-150",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-150"}`}>
        {status}
      </span>
    );
  };

  const defaultAddr = savedAddresses.find((addr) => addr.isDefault);
  const shortAddress = defaultAddr
    ? `${defaultAddr.apartment}, ${defaultAddr.addressLine}`
    : "No default address saved";

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-gray-50 p-4 sm:p-6 text-left relative">
      <h2 className="text-2xl font-black text-gray-800 mb-6">My Profile</h2>

      {/* 👤 PERSONAL INFORMATION CARD */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm mb-6 relative">
        <div className="flex justify-between items-start sm:items-center mb-5">
          <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-1.5">
            <span>👤</span> Personal Information
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-black text-green-600 hover:text-green-700 transition underline"
            >
              Edit Profile
            </button>
            <div className="relative group">
              <button
                disabled
                className="text-xs font-black text-gray-400 cursor-not-allowed transition flex items-center gap-1"
              >
                Change Password
                <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1 py-0.5 rounded tracking-wide uppercase">Coming Soon</span>
              </button>
            </div>
          </div>
        </div>

        {loadingProfile ? (
          <div className="py-6 text-center text-xs font-bold text-gray-400">Loading details...</div>
        ) : profileError ? (
          <div className="py-6 text-center text-xs font-bold text-red-500">{profileError}</div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex flex-col items-center shrink-0">
                {(profileData?.profileImage || profileData?.profilePhotoUrl) ? (
                  <img
                    src={profileData.profileImage || profileData.profilePhotoUrl}
                    alt={profileData.name}
                    className="w-20 h-20 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-sm uppercase">
                    {profileData?.name ? profileData.name.charAt(0) : "U"}
                  </div>
                )}
                <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-2.5 border border-gray-200">
                  {profileData?.role ? profileData.role.toUpperCase() === "ADMIN" ? "Admin" : "Customer" : "Customer"}
                </span>
              </div>

              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Full Name</span>
                  <p className="text-gray-800 font-extrabold text-sm">{profileData?.name || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email Address</span>
                  <p className="text-gray-800 font-extrabold text-sm">{profileData?.email || "N/A"}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Mobile Number</span>
                  <p className="text-gray-800 font-extrabold text-sm">{profileData?.phone || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Member Since</span>
                  <p className="text-gray-800 font-extrabold text-sm">
                    {profileData?.createdAt
                      ? new Date(profileData.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Default Delivery Address</span>
                  <p className="text-gray-800 font-extrabold text-xs truncate max-w-full" title={shortAddress}>
                    {shortAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Wallet Balance</span>
                  <p className="text-green-600 font-extrabold text-sm">₹0</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                ✔ Verified Account
              </span>
              {defaultAddr && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  📍 Default Address Saved
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                🛒 {orders.length} {orders.length === 1 ? "Order" : "Orders"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-yellow-55 bg-yellow-50 text-yellow-805 text-yellow-800 border border-yellow-200">
                ⭐ Loyalty Level (Starter)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ADDRESSES MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-base text-gray-800">
            📍 Saved Addresses ({savedAddresses.length})
          </h3>
          <button
            onClick={() => navigate("/addresses")}
            className="text-xs font-black text-green-600 hover:underline"
          >
            Manage Addresses
          </button>
        </div>

        {savedAddresses.length === 0 ? (
          <p className="text-gray-500 text-xs font-semibold">No addresses saved. Add one to orchestrate delivery.</p>
        ) : (
          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <div 
                key={addr.id} 
                onClick={() => navigate("/addresses")}
                className="p-3.5 border rounded-xl flex items-center justify-between text-xs hover:bg-gray-50 cursor-pointer transition"
              >
                <div>
                  <span className="font-black text-gray-800">
                    {addr.type === "Home" ? "🏠 Home" : addr.type === "Work" ? "💼 Work" : "📍 Other"}
                  </span>
                  <p className="font-bold text-gray-700 mt-1">{addr.apartment}, {addr.addressLine}</p>
                  {addr.isDefault && <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider bg-green-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">Default Address</span>}
                </div>
                <span className="text-gray-400">→</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDERS LIST */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
        <h3 className="font-extrabold text-base text-gray-800 mb-4">My Orders</h3>

        {orders.length === 0 ? (
          <p className="text-gray-500 text-xs font-semibold">No orders placed yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const finalStatus = getCustomerStatus(order);
              return (
                <div
                  key={order._id}
                  className={`border rounded-2xl p-4 transition duration-150 hover:shadow-sm ${
                    finalStatus === "Cancelled" ? "bg-red-50/30 border-red-150" : "bg-white border-gray-150"
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Order #{order._id.slice(-6)}
                    </p>
                    {statusBadge(finalStatus)}
                  </div>

                  <p className="font-black text-lg text-gray-850 mb-4">₹{order.totalAmount}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/tracking/${order._id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Track Order
                    </button>

                    <button
                      onClick={() => reorder(order)}
                      className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl transition"
                    >
                      Reorder
                    </button>

                    {order.status === "Placed" && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="bg-red-50 border border-red-200 text-red-650 hover:bg-red-100 font-bold text-xs px-4 py-2 rounded-xl transition ml-auto"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-150 text-left">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditErrors({});
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 text-lg font-bold transition-all duration-150"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-gray-800 mb-4">✏️ Edit Personal Information</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                    editErrors.name ? "border-red-500 focus:ring-red-400" : "border-gray-200"
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {editErrors.name && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">{editErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                    editErrors.phone ? "border-red-500 focus:ring-red-400" : "border-gray-200"
                  }`}
                  placeholder="Enter mobile number"
                />
                {editErrors.phone && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">{editErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="text"
                  name="profileImage"
                  value={editForm.profileImage}
                  onChange={handleEditChange}
                  className={`w-full px-3.5 py-2 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                    editErrors.profileImage ? "border-red-500 focus:ring-red-400" : "border-gray-200"
                  }`}
                  placeholder="Enter profile image URL"
                />
                {editErrors.profileImage && (
                  <p className="text-red-500 text-[10px] font-bold mt-1">{editErrors.profileImage}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1 opacity-70">
                  Email (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData?.email || ""}
                  className="w-full px-3.5 py-2 border border-gray-200 bg-gray-50 rounded-xl text-xs font-bold text-gray-405 cursor-not-allowed text-gray-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1 opacity-70">
                  Role (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData?.role ? profileData.role.toUpperCase() === "ADMIN" ? "ADMIN" : "CUSTOMER" : "CUSTOMER"}
                  className="w-full px-3.5 py-2 border border-gray-200 bg-gray-50 rounded-xl text-xs font-bold text-gray-405 cursor-not-allowed text-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditErrors({});
                  }}
                  className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all duration-300 transform translate-y-0 ${
          toast.type === "success" 
            ? "bg-green-50 text-green-800 border-green-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </div>
  );
}

export default Profile;
