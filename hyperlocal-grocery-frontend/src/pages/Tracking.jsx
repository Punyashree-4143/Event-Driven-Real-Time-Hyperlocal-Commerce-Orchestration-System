import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/tracking.css";

function Tracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("confirmed");

  useEffect(() => {
    const steps = [
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered"
    ];
    let index = 0;

    const interval = setInterval(() => {
      index++;
      if (index < steps.length) {
        setStatus(steps[index]);
      } else {
        clearInterval(interval);

        // ✅ Redirect after delivery
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const labelMap = {
    confirmed: "✅ Order Confirmed",
    preparing: "🍳 Preparing your order",
    out_for_delivery: "🚚 Out for delivery",
    delivered: "📦 Delivered"
  };

  return (
    <div className="tracking-page">
      <h2>Order Tracking</h2>
      <p>Order ID: {orderId}</p>
      <h3>{labelMap[status]}</h3>
      {status === "delivered" && (
        <p>Redirecting to order history...</p>
      )}
    </div>
  );
}

export default Tracking;
