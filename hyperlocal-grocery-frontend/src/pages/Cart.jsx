import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  increaseQty,
  decreaseQty
} from "../utils/cart";

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
    <div className="min-h-screen bg-gray-50">
      {/* 🔝 Header */}
      <header className="bg-white shadow p-4 sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-800">
          Your Cart
        </h2>
      </header>

      {/* 🛒 Cart Section */}
      <section className="p-4 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4">
          {cart.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              Your cart is empty
            </p>
          )}

          {cart.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between border-b py-3 gap-3"
            >
              {/* 🏷 Item Name */}
              <span className="font-medium text-gray-800 flex-1">
                {item.name}
              </span>

              {/* ➖➕ Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    decreaseQty(item._id);
                    refreshCart();
                  }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  −
                </button>

                <span className="min-w-[24px] text-center">
                  {item.qty}
                </span>

                <button
                  onClick={() => {
                    increaseQty(item._id);
                    refreshCart();
                  }}
                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                >
                  +
                </button>
              </div>

              {/* 💰 Price */}
              <span className="font-semibold text-gray-700 w-20 text-right">
                ₹{item.price * item.qty}
              </span>

              {/* ❌ Remove */}
              <button
                onClick={() => {
                  removeFromCart(item._id);
                  refreshCart();
                }}
                className="text-red-500 hover:text-red-700 text-lg"
              >
                ✕
              </button>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              {/* 🧾 Total */}
              <div className="flex justify-between items-center mt-4">
                <h3 className="text-lg font-semibold">
                  Total
                </h3>
                <h3 className="text-lg font-bold text-green-600">
                  ₹{total}
                </h3>
              </div>

              {/* ✅ Checkout */}
              <button
                onClick={() => navigate("/checkout")}
                className="mt-5 w-full bg-green-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition"
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
