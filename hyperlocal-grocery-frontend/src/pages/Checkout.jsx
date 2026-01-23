import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCart } from "../utils/cart";

function Checkout() {
  const navigate = useNavigate();

  // =====================
  // CART
  // =====================
  const cart = getCart() || [];

  const storeId =
    cart[0]?.storeId ||
    cart[0]?.store?._id ||
    cart[0]?.store ||
    null;

  // =====================
  // AUTH
  // =====================
  const userToken = localStorage.getItem("userToken");

  // =====================
  // ADDRESS
  // =====================
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // =====================
  // PAYMENT
  // =====================
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // =====================
  // LOAD SAVED ADDRESS
  // =====================
  useEffect(() => {
    const savedAddress = localStorage.getItem("deliveryAddress");
    if (savedAddress) {
      setAddress(savedAddress);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, []);

  // =====================
  // SAVE ADDRESS
  // =====================
  const saveAddress = () => {
    if (!address.trim()) {
      alert("Please enter a valid address");
      return;
    }
    localStorage.setItem("deliveryAddress", address);
    setIsEditing(false);
  };

  // =====================
  // TOTAL AMOUNT
  // =====================
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // =====================
  // PLACE ORDER
  // =====================
  const placeOrder = async () => {
    if (!userToken) {
      alert("Please login to place order");
      navigate("/login");
      return;
    }

    if (!storeId || cart.length === 0) {
      alert("Cart is empty or store missing");
      return;
    }

    if (!address.trim()) {
      alert("Please add delivery address");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          storeId,
          items: cart,
          address,
          totalAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Order failed");
        return;
      }

      // Save current order
      localStorage.setItem(
        "currentOrder",
        JSON.stringify(data.order)
      );

      // Save order history (temporary – backend later)
      const existingOrders =
        JSON.parse(localStorage.getItem("orders")) || [];
      existingOrders.push(data.order);
      localStorage.setItem(
        "orders",
        JSON.stringify(existingOrders)
      );

      // Clear cart
      localStorage.removeItem("cart");

      // Redirect
      navigate(`/tracking/${data.order._id}`);
    } catch (err) {
      console.error("ORDER ERROR:", err);
      alert("Failed to place order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔝 Header */}
      <header className="bg-white shadow p-4 sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">
          Checkout
        </h2>
      </header>

      {/* 🧾 Checkout Box */}
      <section className="p-4 flex justify-center">
        <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 space-y-6">
          {/* 📍 Address */}
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Delivery Address
            </h3>

            {isEditing ? (
              <>
                <textarea
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                />
                <button
                  onClick={saveAddress}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Save Address
                </button>
              </>
            ) : (
              <>
                <p className="bg-gray-100 p-3 rounded-lg">
                  {address}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-2 text-green-600 hover:underline text-sm"
                >
                  Edit / Change Address
                </button>
              </>
            )}
          </div>

          <hr />

          {/* 💳 Payment */}
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Payment Method
            </h3>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          <hr />

          {/* 💰 Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span className="text-green-600">
              ₹{totalAmount}
            </span>
          </div>

          {/* ✅ Place Order */}
          <button
            onClick={placeOrder}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition"
          >
            Place Order
          </button>
        </div>
      </section>
    </div>
  );
}

export default Checkout;
