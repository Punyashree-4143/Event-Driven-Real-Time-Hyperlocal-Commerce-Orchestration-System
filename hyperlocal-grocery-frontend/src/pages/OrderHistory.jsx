import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/orderHistory.css";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedOrders =
      JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(savedOrders.reverse()); // latest first
  }, []);

  return (
    <div className="order-history-page">
      {/* BACK */}
      <button
        className="back-btn"
        onClick={() => navigate("/stores")}
      >
        ← Back to Stores
      </button>

      <h2>Your Orders</h2>

      {orders.length === 0 ? (
        <p>No orders placed yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            <p>
              <strong>Order ID:</strong> {order._id}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>

            <p>
              <strong>Total:</strong> ₹{order.totalAmount}
            </p>

            <p>
              <strong>Status:</strong> {order.status}
            </p>

            <button
              onClick={() =>
                navigate(`/tracking/${order._id}`)
              }
            >
              Track Order
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;
