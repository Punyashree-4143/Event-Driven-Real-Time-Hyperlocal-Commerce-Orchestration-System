import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedOrders =
      JSON.parse(localStorage.getItem("orders")) || [];
    const savedAddress =
      localStorage.getItem("deliveryAddress") || "";

    setOrders(savedOrders.reverse());
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

      {/* ORDER HISTORY */}
      <div className="profile-card">
        <h3>My Orders</h3>

        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.orderId}
              className="order-row"
            >
              <div>
                <strong>Order ID:</strong> {order.orderId}
              </div>
              <div>₹{order.total}</div>
              <div>{order.status}</div>

              <button
                onClick={() =>
                  navigate(`/tracking/${order.orderId}`)
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
