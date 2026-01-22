import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/tracking.css";

function Tracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const userToken = localStorage.getItem("userToken");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `http://localhost:5001/api/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        const data = await res.json();

        if (res.ok) {
          setOrder(data.order);

          // 🔥 REDIRECT AFTER DELIVERY
          if (data.order.status === "Delivered") {
            setTimeout(() => {
              navigate("/orders"); // order history page
            }, 2000); // 2 sec delay for UX
          }
        }
      } catch (err) {
        console.error("TRACKING ERROR:", err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // poll every 5s

    return () => clearInterval(interval);
  }, [orderId, userToken, navigate]);

  if (!order) return <p>Loading order...</p>;

  return (
    <div className="tracking-page">
      <h2>Order Tracking</h2>

      <p>
        <strong>Order ID:</strong> {order._id}
      </p>

      <ul className="tracking-steps">
        <li className={["Placed","Packed","Out for Delivery","Delivered"].includes(order.status) ? "active" : ""}>
          📦 Order Placed
        </li>

        <li className={["Packed","Out for Delivery","Delivered"].includes(order.status) ? "active" : ""}>
          🧺 Packed
        </li>

        <li className={["Out for Delivery","Delivered"].includes(order.status) ? "active" : ""}>
          🚚 Out for Delivery
        </li>

        <li className={order.status === "Delivered" ? "active" : ""}>
          ✅ Delivered
        </li>
      </ul>

      <h3>Status: {order.status}</h3>

      {order.status === "Delivered" && (
        <p className="redirect-msg">
          🎉 Order delivered! Redirecting to order history...
        </p>
      )}
    </div>
  );
}

export default Tracking;
