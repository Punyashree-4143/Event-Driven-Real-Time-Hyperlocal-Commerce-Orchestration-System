import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const userToken = localStorage.getItem("userToken");

  const fetchOrders = async () => {
    const res = await fetch(
      "http://localhost:5001/api/orders/my",
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    const data = await res.json();
    if (res.ok) setOrders(data.orders || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔁 REORDER
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

  // ❌ CANCEL ORDER
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;

    const res = await fetch(
      `http://localhost:5001/api/orders/${orderId}/cancel`,
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
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-xl shadow space-y-2"
            >
              <p><strong>ID:</strong> {order._id}</p>
              <p><strong>Total:</strong> ₹{order.totalAmount}</p>
              <p><strong>Status:</strong> {order.status}</p>

              <div className="flex gap-3 mt-2">
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
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
