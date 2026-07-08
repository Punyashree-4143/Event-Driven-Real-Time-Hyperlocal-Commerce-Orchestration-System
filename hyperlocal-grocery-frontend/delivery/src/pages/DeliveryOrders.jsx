import { useEffect, useState, useContext } from "react";
import { DeliveryAuthContext } from "../context/DeliveryAuthContext";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

// 🔑 Backend base URLs
const API_BASE = API_BASE_URL;

// 🔌 Socket instance (delivery only)
const socket = io(SOCKET_URL, {
  autoConnect: false,
});

function DeliveryOrders() {
  const { auth } = useContext(DeliveryAuthContext);
  const token = auth?.token;
  const [orders, setOrders] = useState([]);

  // =====================
  // FETCH DELIVERY ORDERS
  // =====================
  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/delivery/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data.orders || []);
  };

  // Initial fetch (REST fallback)
  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  // =====================
  // SOCKET INTEGRATION
  // =====================
  useEffect(() => {
    if (!token) return;

    socket.connect();

    // 🚚 Join delivery room
    socket.emit("joinDelivery");

    // 🔄 Listen for updates
    socket.on("delivery:update", () => {
      fetchOrders();
    });

    return () => {
      socket.off("delivery:update");
      socket.disconnect();
    };
  }, [token]);

  // =====================
  // ACCEPT ORDER
  // =====================
  const acceptOrder = async (orderId) => {
    await fetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchOrders();
  };

  // =====================
  // UPDATE STATUS
  // =====================
  const updateStatus = async (orderId, deliveryStatus) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">
          🚚 Delivery Partner
        </h1>
        <p className="text-gray-600 mt-1">
          Manage and complete your assigned deliveries
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white/70 backdrop-blur rounded-xl p-10 text-center shadow">
          <p className="text-lg text-gray-600">
            No orders available right now
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => (
            <div
              key={o._id}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden"
            >
              <div className="h-1 bg-gradient-to-r from-black to-gray-600" />

              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500">ORDER ID</p>
                    <p className="font-bold tracking-wider">
                      #{o._id.slice(-6)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${badge(
                      o.deliveryStatus || "Pending"
                    )}`}
                  >
                    {o.deliveryStatus || "Pending"}
                  </span>
                </div>

                <div className="mb-5">
                  <p className="text-xs text-gray-500 mb-1">
                    DELIVERY ADDRESS
                  </p>
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    📍 {o.address}
                  </p>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mb-6">
                  <span>Assigned</span>
                  <span>Picked</span>
                  <span>On Way</span>
                  <span>Done</span>
                </div>

                {!o.deliveryPartner && (
                  <button
                    onClick={() => acceptOrder(o._id)}
                    className="mt-auto bg-black text-white py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition"
                  >
                    🚀 Accept Order
                  </button>
                )}

                {o.deliveryPartner &&
                  o.deliveryStatus !== "Delivered" && (
                    <div className="mt-auto">
                      {o.deliveryStatus === "Assigned" && (
                        <button
                          onClick={() =>
                            updateStatus(o._id, "Picked Up")
                          }
                          className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition"
                        >
                          📦 Mark as Picked Up
                        </button>
                      )}

                      {o.deliveryStatus === "Picked Up" && (
                        <button
                          onClick={() =>
                            updateStatus(o._id, "On the Way")
                          }
                          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                        >
                          🛵 Start Delivery
                        </button>
                      )}

                      {o.deliveryStatus === "On the Way" && (
                        <button
                          onClick={() =>
                            updateStatus(o._id, "Delivered")
                          }
                          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                        >
                          ✅ Mark as Delivered
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeliveryOrders;
