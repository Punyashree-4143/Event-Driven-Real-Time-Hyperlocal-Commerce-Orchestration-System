import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [address, setAddress] = useState("Select Location...");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [searchVal, setSearchVal] = useState("");

  const updateNavbarState = () => {
    // Saved addresses
    const list = JSON.parse(localStorage.getItem("userAddresses")) || [];
    setSavedAddresses(list);

    // Active Delivery Address
    const savedAddress = localStorage.getItem("deliveryAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    } else {
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) {
        setAddress(`${defaultAddr.apartment}, ${defaultAddr.addressLine}`);
        localStorage.setItem("deliveryAddress", `${defaultAddr.apartment}, ${defaultAddr.floor ? defaultAddr.floor + ", " : ""}${defaultAddr.addressLine}`);
      } else {
        setAddress("Select Location (Bangalore)...");
      }
    }

    // Cart
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    setCartCount(count);
    setCartTotal(total);
  };

  useEffect(() => {
    updateNavbarState();
    window.addEventListener("storage", updateNavbarState);
    return () => window.removeEventListener("storage", updateNavbarState);
  }, [location]);

  useEffect(() => {
    const interval = setInterval(updateNavbarState, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDefaultAddress = (id) => {
    const updated = savedAddresses.map((addr) => {
      const isCurrent = addr.id === id;
      if (isCurrent) {
        localStorage.setItem(
          "deliveryAddress",
          `${addr.apartment}, ${addr.floor ? addr.floor + ", " : ""}${addr.addressLine}`
        );
      }
      return { ...addr, isDefault: isCurrent };
    });
    localStorage.setItem("userAddresses", JSON.stringify(updated));
    setSavedAddresses(updated);
    setShowAddressDropdown(false);
    updateNavbarState();
    window.location.reload(); // Refresh the page to re-fetch nearby stores according to new address
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    
    const storeId = localStorage.getItem("currentStoreId");
    if (storeId) {
      navigate(`/store/${storeId}?search=${encodeURIComponent(searchVal)}`);
    } else {
      navigate(`/stores?search=${encodeURIComponent(searchVal)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* LOGO & LOCATION SELECTOR */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div 
            onClick={() => navigate("/")} 
            className="cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-yellow-500 to-green-600 bg-clip-text text-transparent uppercase">
              ⚡ greenmart
            </span>
          </div>

          {/* Location dropdown trigger */}
          <div className="relative">
            <div 
              onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              className="flex flex-col text-left cursor-pointer border-l pl-4 border-gray-200 max-w-[160px] sm:max-w-[250px]"
            >
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-0.5">
                Delivering to ▾
              </span>
              <span className="text-xs font-extrabold text-gray-800 truncate">
                📍 {address}
              </span>
            </div>

            {showAddressDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowAddressDropdown(false)}
                />
                <div 
                  className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-lg p-3.5 z-50 text-left space-y-2.5 text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1">Choose Location</p>
                  
                  {savedAddresses.length === 0 ? (
                    <div className="p-2 text-xs font-semibold text-gray-500">
                      No saved addresses.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectDefaultAddress(addr.id)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer hover:bg-green-50 transition border text-left ${
                            addr.isDefault 
                              ? "border-green-400 bg-green-50/20 font-black text-green-800" 
                              : "border-transparent text-gray-700"
                          }`}
                        >
                          <p className="truncate">
                            {addr.type === "Home" ? "🏠" : addr.type === "Work" ? "💼" : "📍"} {addr.apartment}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{addr.addressLine}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowAddressDropdown(false);
                      navigate("/addresses");
                    }}
                    className="w-full text-center bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 font-extrabold text-[11px] py-2 rounded-xl transition"
                  >
                    + Manage Saved Addresses
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SEARCH BAR */}
        <form 
          onSubmit={handleSearchSubmit} 
          className="flex-1 max-w-xl mx-0 md:mx-6 relative"
        >
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder='Search "milk", "onion", or nearby grocery stores...'
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition duration-150 text-gray-700"
            />
          </div>
        </form>

        {/* NAVIGATION & CART */}
        <div className="flex items-center justify-between md:justify-end gap-5">
          <button 
            onClick={() => navigate("/stores")}
            className="text-sm font-semibold text-gray-600 hover:text-green-600 transition"
          >
            Stores
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/profile")}
                className="text-sm font-bold text-gray-700 hover:text-green-600 transition"
              >
                Profile
              </button>
              <button 
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate("/login")}
              className="text-sm font-bold text-green-600 hover:text-green-700 transition"
            >
              Login
            </button>
          )}

          {/* 🔥 ADMIN ONLY */}
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin/stores")}
              className="text-xs font-bold text-white bg-red-500 px-3 py-1 rounded-lg hover:bg-red-600 transition"
            >
              Admin
            </button>
          )}

          {/* CART BUTTON */}
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl transition duration-150 shadow-sm"
          >
            <span className="text-base">🛒</span>
            {cartCount > 0 ? (
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                <span className="text-xs font-extrabold">₹{cartTotal}</span>
              </div>
            ) : (
              <span className="text-xs">My Cart</span>
            )}
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
