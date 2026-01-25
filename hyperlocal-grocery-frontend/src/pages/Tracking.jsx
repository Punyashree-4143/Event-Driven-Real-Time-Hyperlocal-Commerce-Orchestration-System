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

          // ✅ Redirect after delivery
          if (data.order.deliveryStatus === "Delivered") {
            setTimeout(() => {
              navigate("/orders");
            }, 2500);
          }
        }
      } catch (err) {
        console.error("TRACKING ERROR:", err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [orderId, userToken, navigate]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading order...
      </div>
    );
  }

  /* =====================
     STATUS RESOLUTION
     ===================== */
  const getCustomerStatus = () => {
    if (order.deliveryStatus === "Delivered") return "Delivered";
    if (order.deliveryStatus) return order.deliveryStatus;
    return order.status;
  };

  const customerStatus = getCustomerStatus();

  const steps = [
    "Placed",
    "Packed",
    "Assigned",
    "Picked Up",
    "On the Way",
    "Delivered",
  ];

  const isCompleted = (step) =>
    steps.indexOf(step) <
    steps.indexOf(customerStatus);

  const isActive = (step) =>
    step === customerStatus;

  /* =====================
     CANCELLED
     ===================== */
  if (order.status === "Cancelled") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-3xl font-bold text-red-600 mb-2">
          ❌ Order Cancelled
        </h2>
        <p className="text-gray-600 mb-6">
          This order was cancelled by you
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-black text-white px-6 py-2 rounded-lg"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          🚚 Order Tracking
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Order #{order._id.slice(-6)}
        </p>

        {/* 🚦 Timeline */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step} className="flex gap-4 items-start">
              {/* DOT + LINE */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full ${
                    isCompleted(step)
                      ? "bg-green-600"
                      : isActive(step)
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                />
                {index !== steps.length - 1 && (
                  <div
                    className={`w-1 h-8 ${
                      isCompleted(step)
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>

              {/* LABEL */}
              <div>
                <p
                  className={`font-medium ${
                    isCompleted(step) || isActive(step)
                      ? "text-green-700"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </p>

                {isActive(step) && (
                  <p className="text-xs text-gray-500">
                    In progress
                  </p>
                )}

                {isCompleted(step) && (
                  <p className="text-xs text-gray-400">
                    Completed
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* STATUS */}
        <div className="mt-6 text-lg font-semibold">
          Status:{" "}
          <span className="text-green-600">
            {customerStatus}
          </span>
        </div>

        {/* REDIRECT MESSAGE */}
        {customerStatus === "Delivered" && (
          <p className="mt-4 text-green-600 text-sm">
            🎉 Order delivered! Redirecting to order history...
          </p>
        )}
      </div>
    </div>
  );
}

export default Tracking;
