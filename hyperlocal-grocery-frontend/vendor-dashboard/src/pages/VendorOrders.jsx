import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

// 🔌 Shared socket instance
const socket = io("http://localhost:5001", {
  autoConnect: false,
});

function VendorOrders() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const token = auth?.token;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const joinedStoreRef = useRef(false);
  const pollRef = useRef(null);

  /* =====================
     AUTH GUARD
     ===================== */
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  /* =====================
     FETCH ORDERS
     ===================== */
  const fetchOrders = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/orders/vendor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error("❌ Vendor fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     SOCKET + POLLING
     ===================== */
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on("connect", async () => {
      if (joinedStoreRef.current) return;

      try {
        const res = await fetch(
          "http://localhost:5001/api/stores/my-store",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();

        if (data.store?._id) {
          socket.emit("joinStore", data.store._id);
          joinedStoreRef.current = true;
        }
      } catch (err) {
        console.error("Store join failed", err.message);
      }
    });

    socket.on("order:update", fetchOrders);
    socket.on("delivery:update", fetchOrders);

    pollRef.current = setInterval(fetchOrders, 12000);
    fetchOrders();

    return () => {
      socket.off("connect");
      socket.off("order:update");
      socket.off("delivery:update");
      clearInterval(pollRef.current);
    };
  }, [token]);

  /* =====================
     UPDATE STATUS
     ===================== */
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const res = await fetch(
        `http://localhost:5001/api/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("❌ Status update error:", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  /* =====================
     STATUS BADGE
     ===================== */
  const getStatusBadge = (order) => {
    if (order.status === "Cancelled") {
      return (
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
          ❌ Cancelled
        </span>
      );
    }

    if (order.deliveryStatus === "Delivered") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          Delivered
        </span>
      );
    }

    const styles = {
      Placed: "bg-yellow-100 text-yellow-700",
      Packed: "bg-blue-100 text-blue-700",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${
          styles[order.status]
        }`}
      >
        {order.status}
      </span>
    );
  };

  /* =====================
     ACTION TEXT
     ===================== */
  const getNextAction = (order) => {
    if (order.status === "Cancelled") {
      return (
        <div className="mt-3 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
          🚫 Order cancelled by customer
          <p className="text-xs text-red-500 mt-1">
            No further action required
          </p>
        </div>
      );
    }

    if (order.deliveryStatus === "Delivered") {
      return (
        <p className="text-sm font-semibold text-green-600">
          ✅ Delivered successfully
        </p>
      );
    }

    if (order.status === "Placed") {
      return (
        <button
          disabled={updatingId === order._id}
          onClick={() => updateStatus(order._id, "Packed")}
          className="w-full py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 active:scale-95 transition"
        >
          {updatingId === order._id ? "Updating..." : "Mark as Packed"}
        </button>
      );
    }

    if (order.status === "Packed") {
      return (
        <div className="text-sm font-medium text-blue-600 flex items-center gap-2">
          <span className="animate-pulse">📦</span>
          Handed over to delivery partner
        </div>
      );
    }

    return null;
  };

  /* =====================
     LOADING
     ===================== */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-semibold animate-pulse text-gray-600">
          Loading store orders...
        </p>
      </div>
    );
  }

  /* =====================
     UI
     ===================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-extrabold mb-8 text-gray-800">
          📦 Store Orders
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center">
            <p className="text-xl font-medium text-gray-600">
              No orders yet
            </p>
            <p className="text-sm text-gray-400 mt-1">
              New customer orders will appear here
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`relative rounded-2xl shadow transition overflow-hidden ${
                  order.status === "Cancelled"
                    ? "bg-red-50 border border-red-200 opacity-90"
                    : "bg-white hover:shadow-xl"
                }`}
              >
                {/* CANCELLED WATERMARK */}
                {order.status === "Cancelled" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-5xl font-extrabold text-red-100 rotate-[-20deg]">
                      CANCELLED
                    </span>
                  </div>
                )}

                {/* TOP STRIP */}
                <div className="h-1 bg-gradient-to-r from-black to-gray-600" />

                <div className="p-5 flex flex-col h-full relative">
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-medium text-gray-500">
                      ORDER #{order._id.slice(-6)}
                    </span>
                    {getStatusBadge(order)}
                  </div>

                  {/* ADDRESS */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">
                      DELIVERY ADDRESS
                    </p>
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      📍 {order.address}
                    </p>
                  </div>

                  {/* PRICE */}
                  <p
                    className={`text-2xl font-bold mb-4 ${
                      order.status === "Cancelled"
                        ? "line-through text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    ₹{order.totalAmount}
                  </p>

                  {/* ACTION */}
                  <div className="mt-auto">
                    {getNextAction(order)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorOrders;
