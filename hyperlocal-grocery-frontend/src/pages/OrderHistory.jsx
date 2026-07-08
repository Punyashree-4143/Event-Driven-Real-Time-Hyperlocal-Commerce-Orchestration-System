import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");

  const API_BASE = API_BASE_URL;

  const fetchOrders = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/orders/my`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) {
      console.error("FETCH ORDERS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* =====================
     REORDER
     ===================== */
  const reorder = (order) => {
    localStorage.setItem(
      "cart",
      JSON.stringify(
        order.items.map((i) => ({
          _id: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          storeId: order.storeId,
        }))
      )
    );
    navigate("/cart");
  };

  /* =====================
     CANCEL ORDER
     ===================== */
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Order cancelled");
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("CANCEL ORDER ERROR:", err);
      alert("Failed to cancel order");
    }
  };

  /* =====================
     STATUS RESOLVER
     ===================== */
  const getOrderStatus = (order) => {
    if (order.deliveryStatus === "Delivered") {
      return "Delivered";
    }
    return order.status;
  };

  /* =====================
     STATUS BADGE
     ===================== */
  const statusBadge = (status) => {
    const styles = {
      Placed: "bg-yellow-100 text-yellow-700",
      Packed: "bg-blue-100 text-blue-700",
      "Out for Delivery": "bg-purple-100 text-purple-700",
      Delivered: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h2 className="text-2xl font-semibold mb-6">
        Your Orders
      </h2>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const finalStatus = getOrderStatus(order);

            return (
              <div
                key={order._id}
                className={`bg-white p-4 rounded-xl shadow space-y-2 ${
                  finalStatus === "Cancelled"
                    ? "border border-red-200 bg-red-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Order #{order._id.slice(-6)}
                  </p>
                  {statusBadge(finalStatus)}
                </div>

                <p className="text-lg font-bold">
                  ₹{order.totalAmount}
                </p>

                <div className="flex gap-3 mt-3 flex-wrap">
                  <button
                    onClick={() =>
                      navigate(`/tracking/${order._id}`)
                    }
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Track
                  </button>

                  <button
                    onClick={() => reorder(order)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Reorder
                  </button>

                  {order.status === "Placed" && (
                    <button
                      onClick={() =>
                        cancelOrder(order._id)
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
