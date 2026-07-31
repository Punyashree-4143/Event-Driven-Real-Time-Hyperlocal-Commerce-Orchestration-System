import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

const socket = io(SOCKET_URL);

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

const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
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


const STEPS = [
  { id: "Placed", label: "Order Placed", desc: "We have received your order", icon: "🛍️" },
  { id: "Accepted", label: "Accepted", desc: "Store has accepted your order", icon: "✅" },
  { id: "Preparing", label: "Preparing", desc: "Store is preparing your items", icon: "🍳" },
  { id: "Packed", label: "Packed", desc: "Your order has been packed", icon: "📦" },
  { id: "Ready", label: "Ready for Pickup", desc: "Order is ready at the store", icon: "🔔" },
  { id: "Assigned", label: "Rider Assigned", desc: "Rider is moving to the store", icon: "🚚" },
  { id: "Picked Up", label: "Picked Up", desc: "Rider has picked up your order", icon: "🛍️" },
  { id: "Out for Delivery", label: "Out for Delivery", desc: "Rider is delivering your order", icon: "🛵" },
  { id: "Delivered", label: "Delivered", desc: "Delivered! Enjoy your groceries", icon: "🎉" }
];

const getActiveStepIndex = (status) => {
  const ids = STEPS.map(s => s.id);
  return ids.indexOf(status);
};

const MOCK_RIDER_RESPONSES = [
  "Sure, I will leave it with security! 👍",
  "Got it. Arriving in a few minutes.",
  "I am near your building. Coming up now! 🛵",
  "Acknowledged. Thanks!"
];

function Tracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const API_BASE = API_BASE_URL;
  const userToken = localStorage.getItem("userToken");

  const [order, setOrder] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentStatus = order?.status ?? "Placed";
  const activeIndex = getActiveStepIndex(currentStatus);
  console.log("[CUSTOMER] Timeline status:", currentStatus);
  console.log("[CUSTOMER] Timeline current step:", activeIndex !== -1 && STEPS[activeIndex] ? STEPS[activeIndex].label : "Unknown");

  // OpenStreetMap/Leaflet State
  const [riderCoords, setRiderCoords] = useState(null);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [osrmDistance, setOsrmDistance] = useState(null);
  const [osrmDuration, setOsrmDuration] = useState(null);

  // Chat Simulation States
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "rider", text: "Hello! I am assigned to your delivery. Let me know if you have instructions.", time: "Just now" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Collapsible summary state
  const [showSummary, setShowSummary] = useState(false);

  const fetchOrderAndStore = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch order");

      setOrder(data.order);
      console.log("[CUSTOMER] Fetched order status:", data.order.status);

      // Fetch Store details for invoice/map
      if (data.order.storeId && !store) {
        const storeRes = await fetch(`${API_BASE}/stores/${data.order.storeId}`);
        const storeData = await storeRes.json();
        if (storeRes.ok) setStore(storeData.store);
      }
    } catch (err) {
      console.error("Tracking Page Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and socket listeners
  useEffect(() => {
    if (!orderId) return;

    fetchOrderAndStore();

    // Establish Socket connection
    socket.emit("joinOrder", orderId);

    socket.on("order:update", (updatedOrder) => {
      console.log("[CUSTOMER] Socket received live order update:", updatedOrder);
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
        console.log("[CUSTOMER] Fetched order status:", updatedOrder.status);
      }
    });

    // Socket listener for live rider location updates
    socket.on("locationUpdate", (data) => {
      console.log("Rider location update via socket:", data);
      setRiderCoords({ lat: data.lat, lng: data.lng });
    });

    // Polling backup
    const interval = setInterval(fetchOrderAndStore, 5000);

    return () => {
      clearInterval(interval);
      socket.off("order:update");
      socket.off("locationUpdate");
    };
  }, [orderId]);

  const storeCoords = store?.location?.coordinates
    ? { lat: store.location.coordinates[1], lng: store.location.coordinates[0] }
    : { lat: 12.9716, lng: 77.6412 }; // default Indiranagar

  const savedAddrs = JSON.parse(localStorage.getItem("userAddresses")) || [];
  const matchingAddr = savedAddrs.find(a => order?.address?.includes(a.addressLine)) || savedAddrs[0];
  const customerCoords = matchingAddr?.coords || { lat: 12.9250, lng: 77.5938 }; // default Jayanagar

  const currentRiderPos = riderCoords || (
    currentStatus === "Placed" || currentStatus === "Packed" || currentStatus === "Assigned"
      ? storeCoords
      : currentStatus === "Delivered"
      ? customerCoords
      : { lat: (storeCoords.lat + customerCoords.lat) / 2, lng: (storeCoords.lng + customerCoords.lng) / 2 } // Midpoint fallback
  );

  const fetchOSRMRoute = async (start, end) => {
    if (!start || !end) return;
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        setRoutePolyline(coords);
        setOsrmDistance(route.distance);
        setOsrmDuration(route.duration);
      }
    } catch (err) {
      console.error("OSRM Route Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (currentStatus === "Assigned") {
      fetchOSRMRoute(currentRiderPos, storeCoords);
    } else if (currentStatus === "Picked Up" || currentStatus === "On the Way") {
      fetchOSRMRoute(currentRiderPos, customerCoords);
    } else {
      setRoutePolyline([]);
      setOsrmDistance(null);
      setOsrmDuration(null);
    }
  }, [riderCoords, store, order?.status, order?.deliveryStatus]);

  // Redirect delivered orders after a brief delay
  useEffect(() => {
    if (order && order.status === "Delivered") {
      const timer = setTimeout(() => {
        navigate("/orders");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [order]);





  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: "customer", text: chatInput, time: "Just now" };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");

    // Simulate rider typing & response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const randomResponse = MOCK_RIDER_RESPONSES[Math.floor(Math.random() * MOCK_RIDER_RESPONSES.length)];
      setChatMessages((prev) => [...prev, { sender: "rider", text: randomResponse, time: "Just now" }]);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl max-w-md w-full">
          <p className="font-extrabold text-lg mb-2">⚠️ Tracking Offline</p>
          <p className="text-sm opacity-90 mb-6">{error || "The tracking context is unavailable."}</p>
          <button onClick={() => navigate("/")} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
            Back to Home
          </button>
        </div>
      </div>
    );
  }




  if (order.status === "Cancelled") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-3xl font-black text-red-600 mb-2">❌ Order Cancelled</h2>
        <p className="text-gray-500 font-semibold mb-6">This order was cancelled and refunded.</p>
        <button onClick={() => navigate("/orders")} className="bg-gray-800 hover:bg-gray-900 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition">
          View Order History
        </button>
      </div>
    );
  }

  // Deterministic OTP based on order ID
  const deliveryOtp = order?._id ? (parseInt(order._id.slice(-4), 16) % 9000 + 1000) : "";

  // Dynamic ETA display
  const getEtaString = () => {
    if (currentStatus === "Placed") return "15-20 Mins";
    if (currentStatus === "Accepted") return "12-15 Mins";
    if (currentStatus === "Preparing") return "10-12 Mins";
    if (currentStatus === "Packed") return "8-10 Mins";
    if (currentStatus === "Ready") return "5 Mins";
    if (currentStatus === "Out for Delivery") return "3-5 Mins";
    return "Delivered";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* LEFT COLUMN: MAP & STEPS */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* MAP CANVAS CARD */}
          <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Fulfillment Node</span>
                <h3 className="font-extrabold text-lg text-gray-800">Fulfillment Transit Route</h3>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide block">Estimated Arrival</span>
                <p className="text-green-600 font-black text-lg leading-none">
                  {osrmDuration !== null ? `${Math.round(osrmDuration / 60)} mins` : getEtaString()}
                </p>
                {osrmDistance !== null && (
                  <span className="text-[10px] font-bold text-gray-405 block mt-0.5">
                    Distance: {(osrmDistance / 1000).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="relative rounded-2xl border border-gray-150 overflow-hidden bg-gray-55 h-64 z-0">
              <MapContainer
                center={[storeCoords.lat, storeCoords.lng]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="© OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Store Marker */}
                <Marker position={[storeCoords.lat, storeCoords.lng]} icon={storeIcon}>
                  <Popup>
                    <div className="text-xs font-bold">{store?.name || "Store"}</div>
                    <div className="text-[10px] text-gray-500">{store?.address}</div>
                  </Popup>
                </Marker>

                {/* Customer Marker */}
                <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon}>
                  <Popup>
                    <div className="text-xs font-bold">Your Home</div>
                    <div className="text-[10px] text-gray-500">{order.address}</div>
                  </Popup>
                </Marker>

                {/* Rider Marker */}
                <Marker position={[currentRiderPos.lat, currentRiderPos.lng]} icon={riderIcon}>
                  <Popup>
                    <div className="text-xs font-bold">Delivery Partner</div>
                    <div className="text-[10px] text-gray-500">Status: {currentStatus}</div>
                  </Popup>
                </Marker>

                {/* OSRM Route Polyline */}
                {routePolyline.length > 0 && (
                  <Polyline positions={routePolyline} color="blue" weight={4} opacity={0.7} />
                )}

                <RecenterMap lat={currentRiderPos.lat} lng={currentRiderPos.lng} />
              </MapContainer>
            </div>
          </div>

          {/* RIDER INFO CARD (shown if Rider is Assigned, Picked Up, On the Way, or Delivered) */}
          {(currentStatus === "Assigned" || currentStatus === "Picked Up" || currentStatus === "On the Way" || currentStatus === "Delivered") && (
            <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Delivery Agent details</span>
                <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-extrabold px-3 py-1 rounded-full">
                  SHARE OTP: <span className="font-black tracking-widest text-xs ml-0.5">{deliveryOtp}</span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                  alt="Delivery Agent" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-green-200"
                />

                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-gray-800">{order.deliveryPartner?.name || "Rohan Sharma"}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Honda Activa • KA 05 JM 9823</p>
                  <p className="text-xs text-green-600 font-bold mt-1">
                    {currentStatus === "Delivered" ? "✓ Delivered your groceries" : "⚡ Swift fulfillment agent"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open("tel:+919876543210")}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-base"
                  >
                    📞
                  </button>
                  <button 
                    onClick={() => setShowChat(true)}
                    className="p-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-base shadow-sm"
                  >
                    💬
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: TIMELINE & DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEPPER TIMELINE */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-wider">Tracking Timeline</h4>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Order ID: #{orderId.slice(-6)}</span>
            </div>

            <div className="space-y-4">
              {STEPS.map((step, idx) => {
                const isCompleted = idx <= activeIndex;
                const isActive = idx === activeIndex;

                return (
                  <div key={step.id} className="flex gap-3 items-start relative">
                    {/* Stepper Dot & Line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border transition ${
                          isCompleted 
                            ? "bg-green-600 text-white border-green-600" 
                            : isActive 
                            ? "bg-green-50 border-green-500 text-green-700 font-bold ring-2 ring-green-50 animate-pulse" 
                            : "bg-white border-gray-200 text-gray-450"
                        }`}
                      >
                        {isCompleted ? "✓" : step.icon}
                      </div>
                      
                      {idx !== STEPS.length - 1 && (
                        <div 
                          className={`w-0.5 h-10 my-0.5 transition ${
                            idx < activeIndex ? "bg-green-600" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Stepper Label & Desc */}
                    <div className="text-left pt-0.5">
                      <p className={`text-xs font-black transition ${
                        isCompleted || isActive ? "text-gray-800" : "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase leading-none">
                        {step.desc}
                      </p>
                      {isActive && (
                        <span className="text-[9px] font-black text-green-700 bg-green-50 border border-green-150 px-1.5 py-0.5 rounded mt-1.5 inline-block animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ITEM SUMMARY COLLAPSIBLE */}
          <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
            <div 
              onClick={() => setShowSummary(!showSummary)}
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 border-b border-gray-100"
            >
              <h4 className="font-extrabold text-sm text-gray-700">Order Itemized Summary</h4>
              <span className="text-gray-400 text-xs font-black">{showSummary ? "▴" : "▾"}</span>
            </div>

            {showSummary && (
              <div className="p-5 space-y-3.5 text-xs text-gray-700 border-t border-gray-50 bg-gray-50/20">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-gray-650">
                    <span>{item.name} (x{item.qty})</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
                <hr className="border-gray-100" />
                <div className="flex justify-between font-black text-sm text-gray-800">
                  <span>Grand Total</span>
                  <span className="text-green-700">₹{order.totalAmount}</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 💬 CHAT SIMULATION DRAWER OVERLAY */}
      {showChat && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[500px]">
            
            {/* Chat Header */}
            <div className="bg-green-600 text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                  alt="Rider Avatar" 
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="font-extrabold text-sm">{order.deliveryPartner?.name || "Rohan Sharma"}</h4>
                  <p className="text-[10px] text-green-200 font-bold uppercase tracking-wide">Fulfillment Rider</p>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(false)}
                className="text-white font-extrabold text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Chat Message Logs */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col ${
                    msg.sender === "customer" ? "items-end" : "items-start"
                  }`}
                >
                  <div 
                    className={`max-w-[75%] p-3 rounded-2xl text-xs font-bold ${
                      msg.sender === "customer" 
                        ? "bg-green-600 text-white rounded-tr-none" 
                        : "bg-white border text-gray-700 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 px-1 font-bold">{msg.time}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1 bg-white border p-2 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-wide w-28 shadow-sm">
                  <span className="animate-ping rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  Rider is typing...
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Send message to rider..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Send
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Tracking;
