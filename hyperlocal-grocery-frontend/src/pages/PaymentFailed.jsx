import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PaymentFailed() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const savedSummary = localStorage.getItem("cartSummary");
    if (savedSummary) {
      setSummary(JSON.parse(savedSummary));
    }
  }, []);

  const handleRetry = () => {
    // Navigate back to checkout to retry online payment
    navigate("/checkout");
  };

  const handleSwitchToCOD = () => {
    // Navigate back to checkout and signal COD preselection
    navigate("/checkout", { state: { preselectCOD: true } });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 text-left">
      <div className="bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 shadow-sm max-w-md w-full space-y-6">
        
        {/* Warning Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-650 text-3xl mb-1">
            ⚠️
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Payment Failed</h1>
          <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto">
            Your transaction was declined by the bank or cancelled. Don't worry, your cart is safe and no money was charged.
          </p>
        </div>

        {/* Order Amount details */}
        {summary && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Items Total:</span>
              <span className="text-gray-800">₹{summary.itemsTotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Grand Total:</span>
              <span className="text-red-600">₹{summary.grandTotal}</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleRetry}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3.5 rounded-2xl transition shadow-md text-xs"
          >
            🔄 Retry Payment
          </button>
          
          <button
            onClick={handleSwitchToCOD}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-250 font-extrabold py-3.5 rounded-2xl transition text-xs"
          >
            💵 Pay via Cash on Delivery (COD)
          </button>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => navigate("/cart")}
            className="text-xs font-bold text-gray-400 hover:text-green-600 transition"
          >
            ← Return to Cart
          </button>
        </div>

      </div>
    </div>
  );
}

export default PaymentFailed;
