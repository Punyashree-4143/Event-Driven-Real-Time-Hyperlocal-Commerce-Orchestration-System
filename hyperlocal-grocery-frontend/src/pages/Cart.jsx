import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
} from "../utils/cart";

function Cart() {
  const [cart, setCart] = useState(getCart());
  const navigate = useNavigate();

  const refreshCart = () => setCart(getCart());

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 sticky top-0">
        <h2 className="text-xl font-semibold">Your Cart</h2>
      </header>

      <section className="p-4 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
          {cart.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              Your cart is empty
            </p>
          )}

          {cart.map((item) => (
            <div
              key={`${item._id}-${item.variant}`}
              className="flex justify-between items-center border-b py-4 gap-3"
            >
              {/* PRODUCT INFO */}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.variant}
                </p>
              </div>

              {/* QUANTITY */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    decreaseQty(item._id, item.variant);
                    refreshCart();
                  }}
                  className="w-8 h-8 border rounded-full"
                >
                  −
                </button>

                <span>{item.qty}</span>

                <button
                  onClick={() => {
                    increaseQty(item._id, item.variant);
                    refreshCart();
                  }}
                  className="w-8 h-8 border rounded-full"
                >
                  +
                </button>
              </div>

              {/* PRICE */}
              <span className="w-20 text-right font-semibold">
                ₹{item.price * item.qty}
              </span>

              {/* REMOVE */}
              <button
                onClick={() => {
                  removeFromCart(item._id, item.variant);
                  refreshCart();
                }}
                className="text-red-500"
              >
                ✕
              </button>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              <div className="flex justify-between mt-4 font-semibold">
                <span>Total</span>
                <span className="text-green-600">₹{total}</span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="mt-5 w-full bg-green-600 text-white py-3 rounded-lg"
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Cart;
