import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
} from "../utils/cart";
const LOCAL_PLACEHOLDER = "/placeholder.svg";

const MOCK_RECOMMENDATIONS = [
  { _id: "rec1", name: "Fresh Coriander / Dhania", price: 15, mrp: 20, image: "https://images.unsplash.com/photo-1588879460618-924b52479e00", variant: "100 g" },
  { _id: "rec2", name: "Lemons / Nimboo (Local)", price: 20, mrp: 25, image: "https://images.unsplash.com/photo-1590502593747-42a996133562", variant: "250 g" },
  { _id: "rec3", name: "Fresh Ginger / Adrak", price: 30, mrp: 40, image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a", variant: "250 g" }
];

const AVAILABLE_COUPONS = [
  { code: "FRESH20", discountPercent: 20, desc: "20% off on your cart total" },
  { code: "SUPER50", discountPercent: 50, desc: "50% off on your cart total" },
  { code: "FREEFULFILL", discountPercent: 100, maxDiscount: 40, desc: "Save up to ₹40 on groceries" }
];

function Cart() {
  const [cart, setCart] = useState(getCart());
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const refreshCart = () => {
    setCart(getCart());
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const handleApplyCoupon = (e) => {
    e?.preventDefault();
    setCouponError("");
    const found = AVAILABLE_COUPONS.find(
      (c) => c.code.toUpperCase() === couponInput.trim().toUpperCase()
    );

    if (found) {
      setActiveCoupon(found);
      setCouponInput("");
    } else {
      setCouponError("Invalid coupon code. Try FRESH20 or SUPER50.");
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
  };

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  
  // Calculate savings (MRP - Selling Price)
  const mockMrpTotal = cart.reduce((sum, item) => sum + (item.price + 15) * item.qty, 0);
  const itemSavings = mockMrpTotal - itemsTotal;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountPercent) {
      couponDiscount = Math.round((itemsTotal * activeCoupon.discountPercent) / 100);
    }
    if (activeCoupon.maxDiscount && couponDiscount > activeCoupon.maxDiscount) {
      couponDiscount = activeCoupon.maxDiscount;
    }
  }

  // Fees
  const platformFee = itemsTotal > 0 ? 2 : 0;
  const handlingFee = itemsTotal > 0 ? 4 : 0;
  const deliveryFee = itemsTotal > 199 || itemsTotal === 0 ? 0 : 15;

  const grandTotal = Math.max(
    0,
    itemsTotal + platformFee + handlingFee + deliveryFee - couponDiscount
  );

  const totalSavings = itemSavings + couponDiscount;

  const handleProceedToCheckout = () => {
    const summary = {
      itemsTotal,
      platformFee,
      handlingFee,
      deliveryFee,
      couponDiscount,
      couponCode: activeCoupon ? activeCoupon.code : "",
      grandTotal,
      totalSavings
    };
    localStorage.setItem("cartSummary", JSON.stringify(summary));
    navigate("/checkout");
  };

  const handleQuickAdd = (item) => {
    const productItem = {
      _id: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      availableWeights: [item.variant],
      unit: "packet"
    };
    // Fetch nearest store context
    const storeId = localStorage.getItem("currentStoreId") || "6a4e8b0ab8a458d3337cb932";
    addToCart(productItem, storeId, item.variant);
    refreshCart();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-left">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-500 hover:text-green-600 font-extrabold text-sm"
          >
            ← Back
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Checkout Cart ({cart.length})</h2>
          <div className="w-10"></div>
        </div>
      </header>

      <section className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* ITEMS & RECOMMENDATIONS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* SAVINGS BADGE */}
            {itemsTotal > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-2xl flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <div className="text-xs">
                  <p className="font-extrabold">You are saving ₹{totalSavings} on this order!</p>
                  <p className="opacity-95 font-medium mt-0.5">Fulfillment orchestrating fresh farm prices.</p>
                </div>
              </div>
            )}

            {/* CART ITEMS CARD */}
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-2">🛒</span>
                  <p className="text-gray-500 font-semibold">Your cart is empty.</p>
                  <button 
                    onClick={() => navigate("/stores")}
                    className="mt-4 bg-green-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-green-700 transition shadow-sm"
                  >
                    Browse Grocery Stores
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item._id}-${item.variant}`}
                    className="flex justify-between items-center border-b border-gray-50 py-4 gap-4"
                  >
                    <img 
                      src={item.image || LOCAL_PLACEHOLDER} 
                      alt={item.name} 
                      className="w-12 h-12 object-cover rounded-xl bg-gray-55 border"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = LOCAL_PLACEHOLDER;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase mt-0.5">{item.variant}</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-gray-50 border rounded-xl overflow-hidden font-extrabold text-xs">
                      <button
                        onClick={() => {
                          decreaseQty(item._id, item.variant);
                          refreshCart();
                        }}
                        className="px-3 py-1.5 hover:bg-gray-100 text-gray-500"
                      >
                        −
                      </button>
                      <span className="px-1">{item.qty}</span>
                      <button
                        onClick={() => {
                          increaseQty(item._id, item.variant);
                          refreshCart();
                        }}
                        className="px-3 py-1.5 hover:bg-gray-100 text-gray-500"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-16 text-right font-black text-gray-800 text-sm">
                      ₹{item.price * item.qty}
                    </span>

                    <button
                      onClick={() => {
                        removeFromCart(item._id, item.variant);
                        refreshCart();
                      }}
                      className="text-red-400 hover:text-red-600 transition text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* RECOMMENDATIONS */}
            {cart.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-base text-gray-800 tracking-tight">Frequently Added Together</h3>
                <div className="grid grid-cols-3 gap-3">
                  {MOCK_RECOMMENDATIONS.map((item) => (
                    <div 
                      key={item._id}
                      className="bg-white p-3 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between"
                    >
                      <img 
                        src={item.image || LOCAL_PLACEHOLDER} 
                        alt={item.name} 
                        className="h-16 w-full object-cover rounded-xl mb-1.5"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = LOCAL_PLACEHOLDER;
                        }}
                      />
                      <div>
                        <p className="font-bold text-xs text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.variant}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-black text-gray-800">₹{item.price}</span>
                        <button
                          onClick={() => handleQuickAdd(item)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-green-200 transition"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* BILL DETAILS & COUPONS */}
          {cart.length > 0 && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* COUPONS CARD */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Apply Promo Code</h3>
                
                {activeCoupon ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold">Applied: {activeCoupon.code}</p>
                      <p className="opacity-90">{activeCoupon.desc}</p>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-red-500 font-black hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Coupon (e.g. FRESH20)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && <p className="text-[10px] font-bold text-red-500">{couponError}</p>}

                {/* Available Coupons list */}
                <div className="space-y-2 border-t pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Suggested Coupons</p>
                  {AVAILABLE_COUPONS.map((c) => (
                    <div 
                      key={c.code}
                      onClick={() => {
                        setActiveCoupon(c);
                        setCouponError("");
                      }}
                      className="cursor-pointer border border-dashed border-gray-250 p-2.5 rounded-xl hover:bg-gray-50 flex justify-between items-center text-xs text-left"
                    >
                      <div>
                        <span className="font-extrabold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[10px]">{c.code}</span>
                        <p className="text-[11px] text-gray-500 mt-1">{c.desc}</p>
                      </div>
                      <span className="text-green-600 font-bold">Apply</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BILL DETAILS */}
              <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Bill Summary</h3>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Items Subtotal</span>
                    <span className="text-gray-800 font-bold">₹{itemsTotal}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Promo Discount</span>
                      <span>− ₹{couponDiscount}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Platform Fee</span>
                    <span className="text-gray-800 font-bold">₹{platformFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Handling Charges</span>
                    <span className="text-gray-800 font-bold">₹{handlingFee}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-semibold">Delivery Fee</span>
                    <span className="text-gray-800 font-bold">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-bold">FREE Delivery</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <hr className="border-gray-100 my-2" />

                  <div className="flex justify-between text-sm font-black">
                    <span className="text-gray-800">Grand Total</span>
                    <span className="text-green-600">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md flex justify-between px-5 items-center mt-6"
                >
                  <div className="text-left leading-none">
                    <span className="text-[10px] uppercase font-bold opacity-80">Payable Total</span>
                    <p className="text-base font-extrabold mt-0.5">₹{grandTotal}</p>
                  </div>
                  <span className="font-extrabold text-sm">Proceed to Checkout →</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* 🧺 STICKY FOOTER CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center shadow-lg z-20 md:hidden">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Price</span>
            <p className="text-lg font-black text-green-600">₹{grandTotal}</p>
          </div>
          <button
            onClick={handleProceedToCheckout}
            className="bg-green-600 hover:bg-green-700 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm flex items-center gap-1"
          >
            Checkout <span>→</span>
          </button>
        </div>
      )}

    </div>
  );
}

export default Cart;
