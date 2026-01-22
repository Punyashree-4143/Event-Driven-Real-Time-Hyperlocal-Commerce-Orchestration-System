import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCart } from "../utils/cart";
import "../styles/checkout.css";

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

      // =====================
      // SAVE CURRENT ORDER
      // =====================
      localStorage.setItem(
        "currentOrder",
        JSON.stringify(data.order)
      );

      // =====================
      // SAVE ORDER HISTORY ✅
      // =====================
      const existingOrders =
        JSON.parse(localStorage.getItem("orders")) || [];

      existingOrders.push(data.order);

      localStorage.setItem(
        "orders",
        JSON.stringify(existingOrders)
      );

      // =====================
      // CLEAR CART
      // =====================
      localStorage.removeItem("cart");

      // =====================
      // REDIRECT TO TRACKING
      // =====================
      navigate(`/tracking/${data.order._id}`);
    } catch (err) {
      console.error("ORDER ERROR:", err);
      alert("Failed to place order");
    }
  };

  return (
    <>
      <header className="page-header">
        <h2>Checkout</h2>
      </header>

      <section className="checkout-section">
        <div className="checkout-box">
          {/* ADDRESS */}
          <h3>Delivery Address</h3>

          {isEditing ? (
            <>
              <textarea
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <button
                type="button"
                className="save-address-btn"
                onClick={saveAddress}
              >
                Save Address
              </button>
            </>
          ) : (
            <>
              <p className="saved-address">{address}</p>
              <button
                type="button"
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit / Change Address
              </button>
            </>
          )}

          <hr />

          {/* PAYMENT */}
          <h3>Payment Method</h3>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="COD">Cash on Delivery</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>

          <hr />

          <h3>Total Amount: ₹{totalAmount}</h3>

          <button
            type="button"
            className="place-order-btn"
            onClick={placeOrder}
          >
            Place Order
          </button>
        </div>
      </section>
    </>
  );
}

export default Checkout;
