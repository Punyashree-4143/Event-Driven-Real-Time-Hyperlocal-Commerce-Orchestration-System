import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

// 🔌 Socket (do NOT auto connect)
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

  // 🔒 ensure joinStore runs only once
  const joinedStoreRef = useRef(false);

  // =====================
  // AUTH GUARD (VENDOR)
  // =====================
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // =====================
  // FETCH VENDOR ORDERS
  // =====================
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:5001/api/orders/vendor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Access denied");
      }

      setOrders(data.orders || []);

      // ✅ JOIN STORE ROOM ONLY ONCE
      if (
        !joinedStoreRef.current &&
        data.orders &&
        data.orders.length > 0
      ) {
        socket.emit("joinStore", data.orders[0].storeId);
        joinedStoreRef.current = true;
      }
    } catch (err) {
      console.error(
        "❌ Vendor order fetch error:",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // SOCKET + INITIAL LOAD
  // =====================
  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    fetchOrders();

    // 🔔 ORDER UPDATE (place / cancel / status change)
    socket.on("order:update", () => {
      fetchOrders();
    });

    return () => {
      socket.off("order:update");
      socket.disconnect();
      joinedStoreRef.current = false;
    };
  }, [token]);

  // =====================
  // UPDATE ORDER STATUS
  // =====================
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      fetchOrders();
    } catch (err) {
      console.error(
        "❌ Status update error:",
        err.message
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // =====================
  // STATUS BADGE
  // =====================
  const getStatusBadge = (status) => {
    const styles = {
      Placed: "bg-yellow-100 text-yellow-700",
      Packed: "bg-blue-100 text-blue-700",
      "Out for Delivery":
        "bg-purple-100 text-purple-700",
      Delivered: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${
          styles[status] ||
          "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  // =====================
  // ACTION BUTTONS
  // =====================
  const getNextAction = (order) => {
    if (order.status === "Cancelled") {
      return (
        <p className="text-red-600 font-semibold text-sm">
          ❌ Cancelled by customer
        </p>
      );
    }

    const disabled = updatingId === order._id;

    if (order.status === "Placed") {
      return (
        <button
          disabled={disabled}
          onClick={() =>
            updateStatus(order._id, "Packed")
          }
          className="btn-primary"
        >
          {disabled
            ? "Updating..."
            : "Mark as Packed"}
        </button>
      );
    }

    if (order.status === "Packed") {
      return (
        <button
          disabled={disabled}
          onClick={() =>
            updateStatus(
              order._id,
              "Out for Delivery"
            )
          }
          className="btn-primary"
        >
          {disabled
            ? "Updating..."
            : "Out for Delivery"}
        </button>
      );
    }

    if (order.status === "Out for Delivery") {
      return (
        <button
          disabled={disabled}
          onClick={() =>
            updateStatus(order._id, "Delivered")
          }
          className="btn-success"
        >
          {disabled
            ? "Updating..."
            : "Mark as Delivered"}
        </button>
      );
    }

    return (
      <span className="text-green-600 font-semibold">
        ✅ Completed
      </span>
    );
  };

  // =====================
  // LOADING
  // =====================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold animate-pulse">
          Loading store orders...
        </p>
      </div>
    );
  }

  // =====================
  // UI (UNCHANGED)
  // =====================
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          📦 Store Orders
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow text-center">
            <p className="text-xl text-gray-600">
              No orders received yet
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Orders will appear once customers place
              them
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`rounded-xl shadow-md p-5 transition ${
                  order.status === "Cancelled"
                    ? "bg-red-50"
                    : "bg-white hover:shadow-lg"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-500">
                    Order #{order._id.slice(-6)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Address:</strong>{" "}
                    {order.address}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    ₹{order.totalAmount}
                  </p>
                </div>

                <div className="mt-4">
                  {getNextAction(order)}
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
