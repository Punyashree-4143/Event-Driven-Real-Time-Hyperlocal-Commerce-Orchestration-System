import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const API_BASE = API_BASE_URL;
  const userToken = localStorage.getItem("userToken");

  const [order, setOrder] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderAndStore = async () => {
      try {
        setLoading(true);
        // 1. Fetch Order Details
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch order details");
        setOrder(data.order);

        // 2. Fetch Store Details
        const storeId = data.order.storeId;
        if (storeId) {
          const storeRes = await fetch(`${API_BASE}/stores/${storeId}`);
          const storeData = await storeRes.json();
          if (storeRes.ok) setStore(storeData.store);
        }
      } catch (err) {
        console.error("Order Success Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndStore();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="text-3xl">🎉</div>
          <p className="text-gray-500 font-bold text-xs">Generating Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl max-w-md w-full text-center">
          <p className="font-extrabold text-lg mb-2">⚠️ Order Details Unavailable</p>
          <p className="text-sm opacity-90 mb-6">{error || "Could not retrieve transaction details."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate taxes and item totals
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const platformFee = 2;
  const handlingFee = 4;
  const deliveryFee = subtotal > 199 ? 0 : 15;
  const discount = Math.max(0, subtotal + platformFee + handlingFee + deliveryFee - order.totalAmount);
  
  // Calculate mock GST (18% inclusive of price)
  const gstAmount = Math.round(subtotal * 0.18);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-left print:bg-white print:pb-0">
      
      {/* 🧾 PRINT-ONLY CSS RULES */}
      <style>{`
        @media print {
          nav, header, footer, .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* CONFIRMATION HEADER (no-print) */}
      <header className="bg-white border-b border-gray-100 p-6 shadow-sm no-print mb-6">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-4xl mb-1">
            ✓
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Order Confirmed!</h1>
          <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto">
            Your items are being packed at <span className="text-green-600">{store?.name || "the local warehouse"}</span>. Rapid delivery arriving in 12-15 mins!
          </p>

          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => navigate(`/tracking/${orderId}`)}
              className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Track Live Delivery
            </button>
            <button
              onClick={handlePrint}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              🖨️ Save Invoice
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </header>

      {/* TAX INVOICE CONTAINER */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="print-container bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* INVOICE HEADER */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-5">
            <div>
              <span className="text-xl font-black tracking-tighter text-green-700 uppercase">
                ⚡ greenmart
              </span>
              <p className="text-[10px] text-gray-400 font-bold mt-1">
                Hyperlocal Commerce Orchestrator Private Limited
              </p>
              <p className="text-[10px] text-gray-400 font-bold">CIN: U72200KA2026PTC123456</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Tax Invoice</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">Invoice ID: #{orderId.slice(-8).toUpperCase()}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* STORE & CUSTOMER DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-5">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Seller Details</p>
              <p className="font-extrabold text-gray-800">{store?.name || "Local Partner Store"}</p>
              <p className="text-gray-500 leading-relaxed font-semibold">{store?.address || "Hyperlocal Delivery hub"}</p>
              <p className="text-gray-400 font-bold">FSSAI Lic No: 10026043000987</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Shipped To / Delivery Address</p>
              <p className="font-extrabold text-gray-800">Customer Delivery Node</p>
              <p className="text-gray-500 leading-relaxed font-semibold">{order.address}</p>
              <p className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded inline-block">Fulfillment Node: Active</p>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ordered Items</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-left">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Rate</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="font-semibold text-gray-700">
                      <td className="py-3">
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400">Category: Grocery</p>
                      </td>
                      <td className="py-3 text-center font-bold">{item.qty}</td>
                      <td className="py-3 text-right">₹{item.price}</td>
                      <td className="py-3 text-right font-bold text-gray-800">₹{item.price * item.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BILL DETAILS BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs">
            
            {/* PAYMENT TRANSACTION DETAILS */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Transaction Summary</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5 font-bold text-gray-600">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span className="text-gray-800 uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 uppercase">Paid / Success</span>
                </div>
                <div className="flex justify-between">
                  <span>Txn Ref ID:</span>
                  <span className="text-gray-800 font-mono text-[10px]">
                    {order.paymentMethod.toLowerCase().includes("razorpay") 
                      ? order.paymentMethod.split("-")[1] || "pay_rzp_test_90871"
                      : "pay_cod_node_" + orderId.slice(12)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST 18%):</span>
                  <span className="text-gray-800">₹{gstAmount} (Included)</span>
                </div>
              </div>
            </div>

            {/* BILL CALCULATION */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-right">Fulfillment Charges</p>
              <div className="space-y-2 font-bold text-gray-650">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Code Applied</span>
                    <span>− ₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>

                <div className="flex justify-between">
                  <span>Handling Charges</span>
                  <span>₹{handlingFee}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>

                <hr className="border-gray-100" />

                <div className="flex justify-between text-sm font-black text-gray-800 pt-1">
                  <span>Grand Total Paid</span>
                  <span className="text-green-700">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* INVOICE DECLARATION */}
          <div className="border-t border-gray-100 pt-5 text-center text-[10px] text-gray-400 font-bold space-y-1">
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
            <p>Thank you for shopping with greenmart! For queries, reach us at support@greenmart.com</p>
          </div>

        </div>
      </main>

    </div>
  );
}

export default OrderSuccess;
