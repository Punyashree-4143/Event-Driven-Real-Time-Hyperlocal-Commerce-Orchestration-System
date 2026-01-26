import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");

  const API_BASE = import.meta.env.VITE_API_URL;

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
      console.error("FETCH PROFILE ORDERS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    setAddress(localStorage.getItem("deliveryAddress") || "");
  }, []);

  /* =====================
     REORDER
     ===================== */
  const reorder = async (order) => {
    try {
      const res = await fetch(
        `${API_BASE}/orders/${order._id}/reorder-check`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      const data = await res.json();

      if (!data.canReorder) {
        alert(
          `Out of stock: ${data.unavailableItems.join(", ")}`
        );
        return;
      }

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
    } catch (err) {
      console.error("REORDER ERROR:", err);
      alert("Failed to reorder");
    }
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
  const getCustomerStatus = (order) => {
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
        My Profile
      </h2>

      {/* ADDRESS */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold mb-1">
          Saved Address
        </h3>
        <p className="text-gray-700">
          {address || "No address saved"}
        </p>
      </div>

      {/* ORDERS */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-4">
          My Orders
        </h3>

        {orders.length === 0 ? (
          <p className="text-gray-500">
            No orders yet
          </p>
        ) : (
          orders.map((order) => {
            const finalStatus =
              getCustomerStatus(order);

            return (
              <div
                key={order._id}
                className={`border rounded-lg p-3 mb-3 ${
                  finalStatus === "Cancelled"
                    ? "bg-red-50 border-red-200"
                    : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">
                    Order #{order._id.slice(-6)}
                  </p>
                  {statusBadge(finalStatus)}
                </div>

                <p className="font-semibold mb-2">
                  ₹{order.totalAmount}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      navigate(
                        `/tracking/${order._id}`
                      )
                    }
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Track
                  </button>

                  <button
                    onClick={() => reorder(order)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
                  >
                    Reorder
                  </button>

                  {order.status === "Placed" && (
                    <button
                      onClick={() =>
                        cancelOrder(order._id)
                      }
                      className="bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Profile;
