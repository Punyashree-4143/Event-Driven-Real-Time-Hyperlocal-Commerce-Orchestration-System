import { useEffect, useState, useContext } from "react";
import { DeliveryAuthContext } from "../context/DeliveryAuthContext";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config/api";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// Socket instance (delivery only)
const socket = io(SOCKET_URL, {
  autoConnect: false,
});

function DeliveryOrderMap({ order, apiBase }) {
  const [storeCoords, setStoreCoords] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [riderCoords, setRiderCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [routePolyline, setRoutePolyline] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`${apiBase}/stores/${order.storeId}`);
        const data = await res.json();
        if (res.ok && data.store?.location?.coordinates) {
          setStoreCoords({
            lat: data.store.location.coordinates[1],
            lng: data.store.location.coordinates[0]
          });
        }
      } catch (err) {
        console.error("Fetch store coords error:", err);
      }
    };
    fetchStore();
  }, [order.storeId, apiBase]);

  useEffect(() => {
    const resolveCustomer = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.address)}&limit=1`);
        const data = await res.json();
        if (data && data[0]) {
          setCustomerCoords({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          });
        }
      } catch (err) {
        console.error("Resolve customer coords error:", err);
      }
    };
    resolveCustomer();
  }, [order.address]);

  useEffect(() => {
    socket.emit("joinOrder", order._id);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRiderCoords(coords);
        socket.emit("updateLocation", { orderId: order._id, lat: coords.lat, lng: coords.lng });
      },
      (err) => {
        console.warn("watchPosition error, using fallback coords:", err);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [order._id]);

  useEffect(() => {
    const fetchRoute = async () => {
      const destination = order.deliveryStatus === "Assigned" ? storeCoords : customerCoords;
      if (!destination || !riderCoords) return;

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${riderCoords.lng},${riderCoords.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoutePolyline(coords);
          setDistance(route.distance);
          setDuration(route.duration);
        }
      } catch (err) {
        console.error("OSRM Route Fetch Error:", err);
      }
    };
    fetchRoute();
  }, [riderCoords, storeCoords, customerCoords, order.deliveryStatus]);

  const center = riderCoords || storeCoords || { lat: 12.9716, lng: 77.5946 };

  return (
    <div className="mt-4 space-y-2 border-t pt-4 text-left">
      <div className="flex justify-between items-center text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border">
        <span>📍 Route: <span className="text-black">{order.deliveryStatus === "Assigned" ? "Rider to Store" : "Rider to Customer"}</span></span>
        {distance !== null && duration !== null && (
          <span className="text-emerald-750 font-extrabold">
            {(distance / 1000).toFixed(1)} km ({Math.round(duration / 60)} mins)
          </span>
        )}
      </div>

      <div className="h-44 rounded-xl border overflow-hidden z-0">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {riderCoords && (
            <Marker position={[riderCoords.lat, riderCoords.lng]} icon={riderIcon}>
              <Popup>You (Rider)</Popup>
            </Marker>
          )}

          {storeCoords && (
            <Marker position={[storeCoords.lat, storeCoords.lng]} icon={storeIcon}>
              <Popup>Store Location</Popup>
            </Marker>
          )}

          {customerCoords && (
            <Marker position={[customerCoords.lat, customerCoords.lng]} icon={customerIcon}>
              <Popup>Customer Address</Popup>
            </Marker>
          )}

          {routePolyline.length > 0 && (
            <Polyline positions={routePolyline} color="blue" weight={4} opacity={0.7} />
          )}

          <RecenterMap lat={center.lat} lng={center.lng} />
        </MapContainer>
      </div>
    </div>
  );
}

const API_BASE = API_BASE_URL;

function DeliveryOrders() {
  const { auth } = useContext(DeliveryAuthContext);
  const token = auth?.token;
  const [orders, setOrders] = useState([]);

  // SECTION 1: Available Pickups
  const availablePickups = orders.filter(
    o =>
      o.status === "Ready" &&
      (o.deliveryPartner === null ||
       o.deliveryPartner === undefined ||
       o.deliveryPartner === "")
  );

  // SECTION 2: My Deliveries (deliveryStatus != "Delivered")
  const myDeliveries = orders.filter(o => o.deliveryPartner && o.deliveryStatus !== "Delivered");

  // SECTION 3: Completed Deliveries (deliveryStatus = "Delivered")
  const completedDeliveries = orders.filter(o => o.deliveryPartner && o.deliveryStatus === "Delivered");

  const getGroupedCompleted = () => {
    const today = [];
    const yesterday = [];
    const earlier = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    completedDeliveries.forEach(o => {
      const orderDate = new Date(o.updatedAt || o.createdAt);
      const orderDateStr = orderDate.toDateString();

      if (orderDateStr === todayStr) {
        today.push(o);
      } else if (orderDateStr === yesterdayStr) {
        yesterday.push(o);
      } else {
        earlier.push(o);
      }
    });

    return { today, yesterday, earlier };
  };

  const grouped = getGroupedCompleted();

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/delivery/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const fetched = data.orders || [];
    console.log("===== FRONTEND FETCHED ORDERS =====");
    console.table(
      fetched.map(o => ({
        id: o._id,
        status: o.status,
        deliveryPartner: o.deliveryPartner,
        deliveryStatus: o.deliveryStatus
      }))
    );
    setOrders(fetched);
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    socket.connect();
    socket.emit("joinDelivery");

    socket.on("delivery:update", () => {
      console.log("[DELIVERY DEBUG] Socket received: delivery:update event!");
      fetchOrders();
    });

    return () => {
      socket.off("delivery:update");
      socket.disconnect();
    };
  }, [token]);

  const acceptOrder = async (orderId) => {
    console.log(`[DELIVERY DEBUG] Accept Order click: request accept order: ${orderId}`);
    await fetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders();
  };

  const updateStatus = async (orderId, deliveryStatus) => {
    console.log(`[DELIVERY DEBUG] Update Status click: order: ${orderId}, deliveryStatus: ${deliveryStatus}`);
    await fetch(`${API_BASE}/delivery/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deliveryStatus }),
    });
    fetchOrders();
  };

  const badge = (status) => {
    const map = {
      Assigned: "bg-blue-100 text-blue-700",
      "Picked Up": "bg-yellow-100 text-yellow-700",
      "On the Way": "bg-purple-100 text-purple-700",
      Delivered: "bg-green-100 text-green-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const renderCompletedCard = (o) => (
    <div
      key={o._id}
      className="relative bg-white rounded-2xl shadow hover:shadow-md transition overflow-hidden border border-gray-150 flex flex-col p-5 text-left opacity-90 hover:opacity-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">ORDER ID</p>
          <p className="font-extrabold text-xs tracking-wider text-gray-800">
            #{o._id.slice(-6)}
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-150">
          Delivered
        </span>
      </div>

      <div className="text-left mb-2">
        <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-wide">DELIVERY ADDRESS</p>
        <p className="text-xs font-semibold text-gray-700 leading-snug">
          📍 {o.address}
        </p>
      </div>

      <div className="pt-3 border-t flex justify-between items-center text-[10px] text-gray-400 font-bold">
        <span>Completed: {new Date(o.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="text-gray-800">₹{o.totalAmount || "0"}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      {/* HEADER */}
      <div className="mb-8 text-left">
        <h1 className="text-4xl font-extrabold tracking-tight">
          🚚 Delivery Partner Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Manage and complete your assigned deliveries in real-time
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* SECTION 1: Available Pickups */}
        <div className="space-y-5">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200 text-left">
            🔔 Available Pickups ({availablePickups.length})
          </h2>

          {availablePickups.length === 0 ? (
            <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow border border-dashed border-gray-300">
              <p className="text-sm font-semibold text-gray-500">No orders ready for pickup</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {availablePickups.map((o) => (
                <div
                  key={o._id}
                  className="relative bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden border border-gray-100 flex flex-col p-6 h-fit"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">ORDER ID</p>
                      <p className="font-extrabold text-xs tracking-wider text-gray-800">
                        #{o._id.slice(-6)}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      Ready
                    </span>
                  </div>

                  <div className="mb-5 text-left">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-wide">DELIVERY ADDRESS</p>
                    <p className="text-xs font-semibold text-gray-700 leading-snug">
                      📍 {o.address}
                    </p>
                  </div>

                  <button
                    onClick={() => acceptOrder(o._id)}
                    className="mt-auto bg-black text-white py-2.5 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition text-xs shadow-md"
                  >
                    🚀 Accept Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: My Deliveries */}
        <div className="space-y-5">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200 text-left">
            🛵 My Deliveries ({myDeliveries.length})
          </h2>

          {myDeliveries.length === 0 ? (
            <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow border border-dashed border-gray-300">
              <p className="text-sm font-semibold text-gray-500">No active deliveries assigned to you</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {myDeliveries.map((o) => (
                <div
                  key={o._id}
                  className="relative bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden border border-gray-150 flex flex-col p-6 h-fit"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">ORDER ID</p>
                      <p className="font-extrabold text-xs tracking-wider text-gray-800">
                        #{o._id.slice(-6)}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge(
                        o.deliveryStatus || "Assigned"
                      )}`}
                    >
                      {o.deliveryStatus || "Assigned"}
                    </span>
                  </div>

                  <div className="mb-5 text-left">
                    <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-wide">DELIVERY ADDRESS</p>
                    <p className="text-xs font-semibold text-gray-700 leading-snug">
                      📍 {o.address}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <DeliveryOrderMap order={o} apiBase={API_BASE} />

                    {o.deliveryStatus === "Assigned" && (
                      <button
                        onClick={() => updateStatus(o._id, "Picked Up")}
                        className="w-full bg-yellow-500 text-white py-2.5 rounded-xl font-bold hover:bg-yellow-600 transition text-xs shadow-md"
                      >
                        📦 Mark as Picked Up
                      </button>
                    )}

                    {o.deliveryStatus === "Picked Up" && (
                      <button
                        onClick={() => updateStatus(o._id, "On the Way")}
                        className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 transition text-xs shadow-md"
                      >
                        🛵 Start Delivery
                      </button>
                    )}

                    {o.deliveryStatus === "On the Way" && (
                      <button
                        onClick={() => updateStatus(o._id, "Delivered")}
                        className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 transition text-xs shadow-md"
                      >
                        ✅ Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Completed Deliveries */}
        <div className="space-y-5">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 border-b pb-3 border-gray-200 text-left">
            ✅ Completed Deliveries ({completedDeliveries.length})
          </h2>

          {completedDeliveries.length === 0 ? (
            <div className="bg-white/70 backdrop-blur rounded-2xl p-10 text-center shadow border border-dashed border-gray-300">
              <p className="text-sm font-semibold text-gray-500">No completed deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
              {/* TODAY */}
              {grouped.today.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Today</h3>
                  <div className="space-y-4">
                    {grouped.today.map(renderCompletedCard)}
                  </div>
                </div>
              )}

              {/* YESTERDAY */}
              {grouped.yesterday.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Yesterday</h3>
                  <div className="space-y-4">
                    {grouped.yesterday.map(renderCompletedCard)}
                  </div>
                </div>
              )}

              {/* EARLIER */}
              {grouped.earlier.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Earlier</h3>
                  <div className="space-y-4">
                    {grouped.earlier.map(renderCompletedCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryOrders;
