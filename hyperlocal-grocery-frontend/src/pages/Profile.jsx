import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");
  const API_BASE = API_BASE_URL;

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
    fetchOrders();
    const list = JSON.parse(localStorage.getItem("userAddresses")) || [];
    setSavedAddresses(list);
  }, []);

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

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-gray-50 p-4 sm:p-6 text-left">
      <h2 className="text-2xl font-black text-gray-800 mb-6">My Profile</h2>

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
    </div>
  );
}

export default Profile;
