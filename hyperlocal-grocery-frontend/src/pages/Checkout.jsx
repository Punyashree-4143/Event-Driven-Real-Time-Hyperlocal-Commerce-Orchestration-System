import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCart } from "../utils/cart";
import "../styles/checkout.css";

function Checkout() {
  const cart = getCart();
  const navigate = useNavigate();

  // All items belong to one store
  const storeId = cart.length > 0 ? cart[0].storeId : null;

  // Address
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: ""
  });

  useEffect(() => {
    const savedAddress = localStorage.getItem("deliveryAddress");
    if (savedAddress) {
      setAddress(savedAddress);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const saveAddress = () => {
    if (!address.trim()) {
      alert("Please enter a valid address");
      return;
    }
    localStorage.setItem("deliveryAddress", address);
    setIsEditing(false);
  };

  const validatePayment = () => {
    if (paymentMethod === "UPI" && !upiId.trim()) {
      alert("Please enter UPI ID");
      return false;
    }
    if (paymentMethod === "CARD") {
      const { number, name, expiry, cvv } = cardDetails;
      if (!number || !name || !expiry || !cvv) {
        alert("Please fill all card details");
        return false;
      }
    }
    return true;
  };

  // 🔥 PLACE ORDER (VITE PROXY)
  const placeOrder = async () => {
    if (!storeId) {
      alert("Invalid cart. Please add products again.");
      return;
    }

    if (!address.trim()) {
      alert("Please add a delivery address");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!validatePayment()) return;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storeId,
          items: cart,
          address,
          total,
          paymentMethod
        })
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

      // Save order history
      const existingOrders =
        JSON.parse(localStorage.getItem("orders")) || [];
      existingOrders.push(data.order);
      localStorage.setItem(
        "orders",
        JSON.stringify(existingOrders)
      );

      // Clear cart
      localStorage.removeItem("cart");

      // Redirect to tracking page
      navigate(`/tracking/${data.order._id}`);
    } catch (err) {
      console.error("ORDER ERROR:", err);
      alert("Failed to place order. Please try again.");
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
              <button type="button" onClick={saveAddress}>
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
            <option value="CARD">Credit / Debit Card</option>
          </select>

          {paymentMethod === "UPI" && (
            <input
              type="text"
              placeholder="UPI ID"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          )}

          {paymentMethod === "CARD" && (
            <div className="card-inputs">
              <input
                placeholder="Card Number"
                value={cardDetails.number}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    number: e.target.value
                  })
                }
              />
              <input
                placeholder="Card Holder Name"
                value={cardDetails.name}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    name: e.target.value
                  })
                }
              />
              <input
                placeholder="Expiry (MM/YY)"
                value={cardDetails.expiry}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    expiry: e.target.value
                  })
                }
              />
              <input
                type="password"
                placeholder="CVV"
                value={cardDetails.cvv}
                onChange={(e) =>
                  setCardDetails({
                    ...cardDetails,
                    cvv: e.target.value
                  })
                }
              />
            </div>
          )}

          <hr />

          <h3>Total Amount: ₹{total}</h3>

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
