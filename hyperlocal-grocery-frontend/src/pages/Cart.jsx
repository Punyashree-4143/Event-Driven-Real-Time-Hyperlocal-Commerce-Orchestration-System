import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  increaseQty,
  decreaseQty
} from "../utils/cart";
import "../styles/cart.css";

function Cart() {
  const [cart, setCart] = useState(getCart());
  const navigate = useNavigate();

  const refreshCart = () => {
    setCart(getCart());
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <>
      <header className="page-header">
        <h2>Your Cart</h2>
      </header>

      <section className="cart-section">
        <div className="cart-box">
          {cart.length === 0 && <p>Your cart is empty</p>}

          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <span className="item-name">{item.name}</span>

              <div className="qty-controls">
                <button
                  onClick={() => {
                    decreaseQty(item._id);
                    refreshCart();
                  }}
                >
                  −
                </button>

                <span>{item.qty}</span>

                <button
                  onClick={() => {
                    increaseQty(item._id);
                    refreshCart();
                  }}
                >
                  +
                </button>
              </div>

              <span className="item-price">
                ₹{item.price * item.qty}
              </span>

              <button
                className="remove-btn"
                onClick={() => {
                  removeFromCart(item._id);
                  refreshCart();
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              <h3>Total: ₹{total}</h3>
              <button
                className="checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default Cart;
