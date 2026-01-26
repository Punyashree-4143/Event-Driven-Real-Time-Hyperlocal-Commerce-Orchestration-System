import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config";

// 🔌 Shared socket instance
const socket = io(SOCKET_URL, {
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
        `${API_BASE_URL}/api/orders/vendor`,
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
          `${API_BASE_URL}/api/stores/my-store`,
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
        console.error("Store join failed:", err.message);
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
      socket.disconnect();
    };
  }, [token]);

  /* =====================
     UPDATE STATUS
     ===================== */
  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);

      const res = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/status`,
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
     ACTION BUTTON
     ===================== */
  const getNextAction = (order) => {
    if (order.status === "Cancelled") {
      return (
        <div className="mt-3 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
          🚫 Order cancelled by customer
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
          className="w-full py-2 rounded-lg bg-black text-white font-semibold"
        >
          {updatingId === order._id ? "Updating..." : "Mark as Packed"}
        </button>
      );
    }

    if (order.status === "Packed") {
      return (
        <div className="text-sm font-medium text-blue-600">
          📦 Waiting for delivery partner
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
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold animate-pulse">
          Loading store orders...
        </p>
      </div>
    );
  }

  /* =====================
     UI
     ===================== */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold mb-6">📦 Store Orders</h2>

      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-5 rounded-xl shadow"
            >
              <div className="flex justify-between mb-3">
                <span className="text-xs text-gray-500">
                  ORDER #{order._id.slice(-6)}
                </span>
                {getStatusBadge(order)}
              </div>

              <p className="text-sm mb-2">📍 {order.address}</p>
              <p className="text-xl font-bold mb-4">
                ₹{order.totalAmount}
              </p>

              {getNextAction(order)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VendorOrders;
