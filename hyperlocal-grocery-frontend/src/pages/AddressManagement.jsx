import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL } from "../config/api";

// Fix default marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
};


const MOCK_SUGGESTIONS = [
  { name: "Indiranagar, Bengaluru, Karnataka", lat: 12.9716, lng: 77.6412 },
  { name: "Koramangala, Bengaluru, Karnataka", lat: 12.9352, lng: 77.6245 },
  { name: "HSR Layout, Bengaluru, Karnataka", lat: 12.9141, lng: 77.6411 },
  { name: "Jayanagar, Bengaluru, Karnataka", lat: 12.9250, lng: 77.5938 },
  { name: "Whitefield, Bengaluru, Karnataka", lat: 12.9698, lng: 77.7499 },
  { name: "Malleshwaram, Bengaluru, Karnataka", lat: 12.9984, lng: 77.5702 }
];

const PREDEFINED_INSTRUCTIONS = [
  { id: "inst1", text: "🔕 Avoid ringing bell (Leave at door)", desc: "Quiet delivery" },
  { id: "inst2", text: "🚪 Leave at the gate", desc: "No contact delivery" },
  { id: "inst3", text: "🛡️ Leave with security", desc: "For apartments" },
  { id: "inst4", text: "📞 Call before delivering", desc: "Confirm presence" }
];

function AddressManagement() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [addressType, setAddressType] = useState("Home"); // Home, Work, Other
  const [searchQuery, setSearchQuery] = useState("");
  const [apartment, setApartment] = useState("");
  const [floor, setFloor] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedInstructionId, setSelectedInstructionId] = useState("");
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default Bengaluru

  // OpenStreetMap/Leaflet State
  const [suggestions, setSuggestions] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load saved addresses
  const loadAddresses = () => {
    const list = JSON.parse(localStorage.getItem("userAddresses")) || [];
    setAddresses(list);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Fetch nearby stores when coordinates change
  const fetchNearbyStores = async (lat, lng) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stores/nearby?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data && data.stores) {
        setNearbyStores(data.stores);
      }
    } catch (err) {
      console.error("Failed to fetch nearby stores:", err);
    }
  };

  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      fetchNearbyStores(coords.lat, coords.lng);
    }
  }, [coords]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setSearchQuery(data.display_name);
      }
    } catch (err) {
      console.error("Nominatim reverse geocode error:", err);
    }
  };

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (data) {
        setSuggestions(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        })));
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Nominatim search error:", err);
    }
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(loc);
        reverseGeocode(loc.lat, loc.lng);
      },
      (err) => {
        alert("Unable to fetch location. Please search manually.");
      }
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("Please specify a location or search for an address.");
      return;
    }
    if (!apartment.trim()) {
      alert("Please provide flat / house details.");
      return;
    }

    const newAddressObj = {
      id: editingId || `addr_${Date.now()}`,
      type: addressType,
      addressLine: searchQuery,
      apartment,
      floor,
      landmark,
      instructions: instructions || (selectedInstructionId ? PREDEFINED_INSTRUCTIONS.find(i => i.id === selectedInstructionId)?.text : ""),
      coords,
      isDefault: addresses.length === 0 ? true : false // set as default if first address
    };

    let updatedList = [];
    if (editingId) {
      updatedList = addresses.map((addr) => (addr.id === editingId ? newAddressObj : addr));
    } else {
      updatedList = [...addresses, newAddressObj];
    }

    // If it's the only address, set it as default in deliveryAddress localStorage
    if (newAddressObj.isDefault) {
      localStorage.setItem("deliveryAddress", `${apartment}, ${floor ? floor + ", " : ""}${searchQuery}`);
    }

    localStorage.setItem("userAddresses", JSON.stringify(updatedList));
    setAddresses(updatedList);
    resetForm();
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSearchQuery("");
    setApartment("");
    setFloor("");
    setLandmark("");
    setInstructions("");
    setSelectedInstructionId("");
    setAddressType("Home");
    setCoords({ lat: 12.9716, lng: 77.5946 });
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setAddressType(addr.type);
    setSearchQuery(addr.addressLine);
    setApartment(addr.apartment);
    setFloor(addr.floor || "");
    setLandmark(addr.landmark || "");
    setInstructions(addr.instructions || "");
    setCoords(addr.coords);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Remove this saved address?")) return;
    const filtered = addresses.filter((addr) => addr.id !== id);
    
    // Check if we deleted the default address
    const deleted = addresses.find((addr) => addr.id === id);
    if (deleted?.isDefault && filtered.length > 0) {
      filtered[0].isDefault = true;
      localStorage.setItem(
        "deliveryAddress",
        `${filtered[0].apartment}, ${filtered[0].floor ? filtered[0].floor + ", " : ""}${filtered[0].addressLine}`
      );
    } else if (filtered.length === 0) {
      localStorage.removeItem("deliveryAddress");
    }

    localStorage.setItem("userAddresses", JSON.stringify(filtered));
    setAddresses(filtered);
  };

  const handleSetDefault = (id) => {
    const updated = addresses.map((addr) => {
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
    setAddresses(updated);
  };

  const selectSuggestion = (s) => {
    setSearchQuery(s.name);
    setCoords({ lat: s.lat, lng: s.lng });
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-left">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-green-600 font-extrabold text-sm">
            ← Back
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Saved Addresses</h2>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="text-xs font-black text-green-600 hover:text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl"
          >
            + Add New
          </button>
        </div>
      </header>

      <section className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          
          {/* ADDRESS FORM MODAL / PANEL */}
          {isFormOpen && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-lg text-gray-800">
                  {editingId ? "✏️ Edit Address" : "📍 Add Delivery Address"}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                  Cancel
                </button>
              </div>

              {/* MAP BLOCK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fulfillment Coordinates</div>
                  
                  {/* Leaflet Map Canvas */}
                  <div className="relative rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 h-56 z-0">
                    <MapContainer
                      center={[coords.lat, coords.lng]}
                      zoom={14}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution="© OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {/* Draggable Customer Marker */}
                      <Marker
                        position={[coords.lat, coords.lng]}
                        icon={customerIcon}
                        draggable={true}
                        eventHandlers={{
                          dragend(e) {
                            const newPos = e.target.getLatLng();
                            setCoords({ lat: newPos.lat, lng: newPos.lng });
                            reverseGeocode(newPos.lat, newPos.lng);
                          }
                        }}
                      />

                      {/* Nearby Stores Markers */}
                      {nearbyStores.map((st) => (
                        <Marker
                          key={st._id}
                          position={[st.location.coordinates[1], st.location.coordinates[0]]}
                          icon={storeIcon}
                        >
                          <Popup>
                            <div className="text-xs font-bold">{st.name}</div>
                            <div className="text-[10px] text-gray-500">{st.address}</div>
                          </Popup>
                        </Marker>
                      ))}
                      
                      <RecenterMap lat={coords.lat} lng={coords.lng} />
                    </MapContainer>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="w-full bg-white hover:bg-gray-50 text-green-600 border border-green-200 font-extrabold text-xs py-2.5 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    🎯 Use Current Location
                  </button>
                </div>

                {/* FORM FIELDS */}
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Nominatim Search Input */}
                  <div className="relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Search Address / Location</label>
                    <input
                      type="text"
                      placeholder="Search street, locality, or sector..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-250 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium"
                    />
                    
                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {suggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => selectSuggestion(s)}
                            className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-green-50 cursor-pointer border-b last:border-0"
                          >
                            📍 {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Flat / House / Apt No.</label>
                      <input
                        type="text"
                        placeholder="House No. 302"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Floor (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 3rd Floor"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nearby Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Metro Pillar 12"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Delivery Instructions preset */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Delivery Instructions</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {PREDEFINED_INSTRUCTIONS.map((inst) => (
                        <div
                          key={inst.id}
                          onClick={() => {
                            setSelectedInstructionId(inst.id);
                            setInstructions(inst.text);
                          }}
                          className={`cursor-pointer border p-2 rounded-xl text-left transition ${
                            selectedInstructionId === inst.id
                              ? "bg-green-50 border-green-500 text-green-800"
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          <p className="font-extrabold text-[10px] truncate">{inst.text}</p>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add custom instruction details..."
                      value={instructions}
                      onChange={(e) => {
                        setInstructions(e.target.value);
                        setSelectedInstructionId("");
                      }}
                      className="w-full mt-2 px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Address Type Selection */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Address Label</label>
                    <div className="flex gap-2">
                      {["Home", "Work", "Other"].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setAddressType(label)}
                          className={`flex-1 py-2 text-xs font-bold border rounded-xl transition ${
                            addressType === label
                              ? "bg-green-600 text-white border-green-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-250 hover:bg-gray-50"
                          }`}
                        >
                          {label === "Home" ? "🏠 " : label === "Work" ? "💼 " : "📍 "}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 rounded-2xl transition shadow-md text-xs mt-6"
                  >
                    Save Address
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* LIST SAVED ADDRESSES */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800">Saved Addresses</h3>
            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center">
                <span className="text-4xl block mb-2">📍</span>
                <p className="text-gray-500 font-semibold">No addresses saved yet.</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-green-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  + Add Your First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-3xl border border-gray-150 p-5 shadow-sm flex flex-col justify-between hover:border-green-300 transition duration-150 text-left relative ${
                      addr.isDefault ? "border-green-500 ring-2 ring-green-50" : ""
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-4 right-4 bg-green-100 text-green-700 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Default
                      </span>
                    )}

                    <div className="space-y-1.5 pr-14">
                      <span className="text-xs font-black text-gray-800">
                        {addr.type === "Home" ? "🏠 Home" : addr.type === "Work" ? "💼 Work" : "📍 Other"}
                      </span>
                      <p className="font-extrabold text-sm text-gray-800">
                        {addr.apartment}
                      </p>
                      {addr.floor && <p className="text-xs font-bold text-gray-500">{addr.floor}</p>}
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        {addr.addressLine}
                      </p>
                      {addr.landmark && (
                        <p className="text-[10px] text-orange-600 font-bold">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                      {addr.instructions && (
                        <p className="text-[10px] text-green-700 font-bold bg-green-50 p-2 rounded-xl border border-green-100 mt-2">
                          🔔 Instruction: {addr.instructions}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2.5 border-t border-gray-100 pt-4 mt-5">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[11px] font-bold text-green-600 hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(addr)}
                        className="text-[11px] font-bold text-gray-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="text-[11px] font-bold text-red-500 hover:underline ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}

export default AddressManagement;
