import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import MapPicker from "../components/MapPicker";
import { API_BASE_URL } from "../config/api";

function CreateStore() {
  const { store, loading, refetchStore } = useContext(StoreContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState(5);

  // Settings states
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [holidayMode, setHolidayMode] = useState(false);
  const [businessHours, setBusinessHours] = useState("9 AM - 9 PM");
  const [minOrder, setMinOrder] = useState(0);
  const [description, setDescription] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("30 mins");

  // Set form states if store exists
  useEffect(() => {
    if (store) {
      setName(store.name || "");
      setAddress(store.address || "");
      setDeliveryRadius(store.deliveryRadius || 5);
      setLat(store.location?.coordinates?.[1] || "");
      setLng(store.location?.coordinates?.[0] || "");
      setLogo(store.logo || "");
      setBanner(store.banner || "");
      setHolidayMode(store.holidayMode || false);
      setBusinessHours(store.businessHours || "9 AM - 9 PM");
      setMinOrder(store.minOrder || 0);
      setDescription(store.description || "");
      setDeliveryTime(store.deliveryTime || "30 mins");
    }
  }, [store]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-55 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const handleLocationSelect = ({ lat, lng }) => {
    setLat(lat);
    setLng(lng);
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();

    if (!lat || !lng) {
      alert("Please select a location on the map.");
      return;
    }

    const payload = {
      name,
      address,
      deliveryRadius: Number(deliveryRadius),
      logo,
      banner,
      holidayMode,
      businessHours,
      minOrder: Number(minOrder),
      rating: store?.rating || 4.5,
      description,
      deliveryTime
    };

    const url = store ? `${API_BASE}/stores/my` : `${API_BASE}/stores`;
    const method = store ? "PUT" : "POST";

    const bodyPayload = method === "POST" ? {
      ...payload,
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)]
      }
    } : payload;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) throw new Error("Failed to save store profile");

      await refetchStore();
      alert("Store configuration saved successfully!");
      if (method === "POST") navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="p-6 text-left bg-gray-55 min-h-screen space-y-6 font-sans">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
          {store ? "🏪 My Store Profile" : "🏪 Create Store"}
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase mt-1">
          {store ? `Manage operational preferences for ${store.name}` : "Initialize your shop coordinates"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: EDIT FORM */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleSaveStore} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Store Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Operational Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 9 AM - 9 PM"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Delivery Radius (km) *</label>
                <input
                  type="number"
                  value={deliveryRadius}
                  onChange={(e) => setDeliveryRadius(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Avg Delivery Time *</label>
                <input
                  type="text"
                  placeholder="e.g. 30 mins"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Store Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Store Description / Slogan</label>
              <textarea
                placeholder="Brief description of store specialties, quality guarantees, etc..."
                rows="2.5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Store Logo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Store Banner URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.png"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>
            </div>

            <div className="py-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={holidayMode}
                  onChange={(e) => setHolidayMode(e.target.checked)}
                  className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-xs font-bold text-gray-700 uppercase">Holiday Mode (Temporarily Closed)</span>
              </label>
            </div>

            {/* Map location picker */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Geographic Coordinates *</label>
              <div className="border rounded-2xl overflow-hidden h-64 mb-2 shadow-inner">
                <MapPicker 
                  initialLat={Number(lat) || 12.9716} 
                  initialLng={Number(lng) || 77.5946} 
                  deliveryRadius={Number(deliveryRadius) || 5}
                  onSelect={handleLocationSelect} 
                />
              </div>
            </div>

            {lat && lng && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-0.5">Latitude</label>
                  <input value={lat} readOnly placeholder="Latitude" className="w-full p-2.5 text-xs border rounded-xl bg-gray-150 font-bold" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 block mb-0.5 uppercase">Longitude</label>
                  <input value={lng} readOnly placeholder="Longitude" className="w-full p-2.5 text-xs border rounded-xl bg-gray-150 font-bold" />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-sm transition w-full uppercase tracking-wider"
            >
              Save Configuration Settings
            </button>

          </form>
        </div>

        {/* RIGHT COLUMN: BRAND PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-700">Live Preview</h3>
            
            <div className="border border-gray-150 rounded-2xl overflow-hidden text-left relative bg-white">
              <div className="h-28 w-full bg-gradient-to-r from-emerald-600 to-green-700 relative flex items-center justify-center overflow-hidden">
                {banner ? (
                  <img src={banner} alt="Store Banner" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-black opacity-30 uppercase tracking-widest">No Banner Image</span>
                )}
                {holidayMode && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                      Closed Today
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 relative">
                <div className="absolute -top-8 left-4 h-14 w-14 rounded-xl border-2 border-white bg-white overflow-hidden shadow">
                  {logo ? (
                    <img src={logo} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-lg">🏪</div>
                  )}
                </div>

                <div className="pt-6">
                  <h4 className="font-extrabold text-sm text-gray-800">{name || "My Store Name"}</h4>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{address || "Store Address Location"}</p>
                  
                  {description && (
                    <p className="text-[10px] text-gray-450 italic mt-2 leading-relaxed bg-gray-50 p-2.5 rounded-xl border">
                      "{description}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-[10px] font-bold text-gray-500">
                    <div>🕒 {businessHours}</div>
                    <div>🛵 Radius: {deliveryRadius} km</div>
                    <div>⏰ ETA: {deliveryTime}</div>
                    <div>💳 Min Order: ₹{minOrder}</div>
                    <div>⭐ Rating: {store?.rating || 4.5} ★</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default CreateStore;
