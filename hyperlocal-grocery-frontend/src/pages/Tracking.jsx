import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

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
              navigate("/orders");
            }, 2000);
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

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading order...
      </div>
    );
  }

  const steps = [
    "Placed",
    "Packed",
    "Out for Delivery",
    "Delivered",
  ];

  const isActive = (step) =>
    steps.indexOf(step) <= steps.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Order Tracking
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          <strong>Order ID:</strong> {order._id}
        </p>

        {/* 🚦 Tracking Steps */}
        <ul className="space-y-4">
          <li
            className={`flex items-center gap-3 ${
              isActive("Placed")
                ? "text-green-600 font-medium"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">📦</span> Order Placed
          </li>

          <li
            className={`flex items-center gap-3 ${
              isActive("Packed")
                ? "text-green-600 font-medium"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">🧺</span> Packed
          </li>

          <li
            className={`flex items-center gap-3 ${
              isActive("Out for Delivery")
                ? "text-green-600 font-medium"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">🚚</span> Out for Delivery
          </li>

          <li
            className={`flex items-center gap-3 ${
              order.status === "Delivered"
                ? "text-green-600 font-medium"
                : "text-gray-400"
            }`}
          >
            <span className="text-xl">✅</span> Delivered
          </li>
        </ul>

        {/* 📌 Status */}
        <div className="mt-6 text-lg font-semibold">
          Status:{" "}
          <span className="text-green-600">
            {order.status}
          </span>
        </div>

        {/* 🎉 Redirect Message */}
        {order.status === "Delivered" && (
          <p className="mt-4 text-green-600 text-sm">
            🎉 Order delivered! Redirecting to order history...
          </p>
        )}
      </div>
    </div>
  );
}

export default Tracking;
