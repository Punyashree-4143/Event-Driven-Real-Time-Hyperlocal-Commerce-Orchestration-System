import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const rawOrders =
      JSON.parse(localStorage.getItem("orders")) || [];

    // ✅ NORMALIZE OLD + NEW ORDERS
    const normalizedOrders = rawOrders.map((order) => ({
      _id: order._id || order.orderId || "N/A",
      totalAmount:
        order.totalAmount || order.total || 0,
      status: order.status || "Placed",
      createdAt: order.createdAt || Date.now(),
    }));

    setOrders(normalizedOrders.reverse());

    const savedAddress =
      localStorage.getItem("deliveryAddress") || "";
    setAddress(savedAddress);
  }, []);

  return (
    <div className="profile-page">
      <h2>My Profile</h2>

      {/* ADDRESS */}
      <div className="profile-card">
        <h3>Saved Address</h3>
        <p>{address || "No address saved"}</p>
        <button onClick={() => navigate("/checkout")}>
          Edit Address
        </button>
      </div>

      {/* ORDERS */}
      <div className="profile-card">
        <h3>My Orders</h3>

        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="order-row">
              <div>
                <strong>Order ID:</strong> {order._id}
              </div>

              <div>
                <strong>Total:</strong> ₹{order.totalAmount}
              </div>

              <div>
                <strong>Status:</strong> {order.status}
              </div>

              <button
                onClick={() =>
                  navigate(`/tracking/${order._id}`)
                }
              >
                Track
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;
