import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [orders, setOrders] = useState([]);
  const [address, setAddress] = useState("");
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
    setAddress(localStorage.getItem("deliveryAddress") || "");
  }, []);

  const reorder = async (order) => {
    const res = await fetch(
      `http://localhost:5001/api/orders/${order._id}/reorder-check`,
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
  };

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
        My Profile
      </h2>

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="font-semibold">Saved Address</h3>
        <p>{address || "No address saved"}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold mb-4">My Orders</h3>

        {orders.map((order) => (
          <div
            key={order._id}
            className="border rounded-lg p-3 mb-3"
          >
            <p><strong>ID:</strong> {order._id}</p>
            <p><strong>Status:</strong> {order.status}</p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() =>
                  navigate(`/tracking/${order._id}`)
                }
                className="bg-green-600 text-white px-3 py-1.5 rounded"
              >
                Track
              </button>

              <button
                onClick={() => reorder(order)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded"
              >
                Reorder
              </button>

              {order.status === "Placed" && (
                <button
                  onClick={() =>
                    cancelOrder(order._id)
                  }
                  className="bg-red-600 text-white px-3 py-1.5 rounded"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;
