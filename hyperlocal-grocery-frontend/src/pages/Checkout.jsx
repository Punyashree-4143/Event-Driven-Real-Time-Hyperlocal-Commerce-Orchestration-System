import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { getCart } from "../utils/cart";

const SLOTS = [
  { id: "slot1", title: "Instant Delivery", time: "10-15 mins", tag: "⚡ FASTEST", fee: 0 },
  { id: "slot2", title: "Today Evening", time: "5 PM - 8 PM", tag: "SCHEDULED", fee: 0 },
  { id: "slot3", title: "Tomorrow Morning", time: "8 AM - 11 AM", tag: "SCHEDULED", fee: 0 }
];

const PAYMENT_METHODS = [
  { id: "COD", title: "Cash on Delivery", desc: "Pay with cash at your doorstep", icon: "💵" },
  { id: "UPI", title: "Instant UPI Pay", desc: "Google Pay, PhonePe, Paytm supported", icon: "📱" },
  { id: "CARD", title: "Credit / Debit Cards", desc: "Visa, MasterCard, RuPay supported", icon: "💳" },
  { id: "NETBANKING", title: "Net Banking", desc: "All major Indian banks supported", icon: "🏦" },
  { id: "WALLET", title: "Wallets", desc: "Pay using Mobikwik, Freecharge, etc.", icon: "👛" }
];

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = API_BASE_URL;
  const userToken = localStorage.getItem("userToken");
  const cart = getCart() || [];

  const storeId = cart[0]?.storeId || cart[0]?.store?._id || cart[0]?.store || null;

  // =====================
  // ADDRESSES
  // =====================
  const [address, setAddress] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // =====================
  // PAYMENT
  // =====================
  const [selectedSlot, setSelectedSlot] = useState("slot1");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    itemsTotal: 0,
    platformFee: 2,
    handlingFee: 4,
    deliveryFee: 15,
    couponDiscount: 0,
    couponCode: "",
    grandTotal: 0,
    totalSavings: 0
  });

  // =====================
  // LOAD SAVED ADDRESSES & RAZORPAY SDK
  // =====================
  useEffect(() => {
    // 1. Script loading for Razorpay
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // 2. COD Preselect recovery check
    if (location.state?.preselectCOD) {
      setPaymentMethod("COD");
    }

    const list = JSON.parse(localStorage.getItem("userAddresses")) || [];
    setSavedAddresses(list);

    const defaultAddr = list.find((a) => a.isDefault) || list[0];
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
      setAddress(`${defaultAddr.apartment}, ${defaultAddr.floor ? defaultAddr.floor + ", " : ""}${defaultAddr.addressLine}`);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }

    const savedSummary = localStorage.getItem("cartSummary");
    if (savedSummary) {
      setSummary(JSON.parse(savedSummary));
    } else {
      const itemsSum = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      setSummary({
        itemsTotal: itemsSum,
        platformFee: itemsSum > 0 ? 2 : 0,
        handlingFee: itemsSum > 0 ? 4 : 0,
        deliveryFee: itemsSum > 199 || itemsSum === 0 ? 0 : 15,
        couponDiscount: 0,
        couponCode: "",
        grandTotal: itemsSum + (itemsSum > 0 ? 6 : 0) + (itemsSum > 199 || itemsSum === 0 ? 0 : 15),
        totalSavings: 0
      });
    }

    return () => {
      document.body.removeChild(script);
    };
  }, [location.state]);

  const saveAddress = () => {
    if (!address.trim()) {
      alert("Please enter a valid delivery address");
      return;
    }
    localStorage.setItem("deliveryAddress", address);
    setIsEditing(false);
  };

  const completeOrderCreation = async (razorpayPaymentId = null) => {
    setLoading(true);
    try {
      const finalPaymentMethod = razorpayPaymentId
        ? `Razorpay - ${paymentMethod} (${razorpayPaymentId})`
        : paymentMethod;

      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          storeId,
          items: cart,
          address,
          totalAmount: summary.grandTotal, // send grandTotal with fees
          paymentMethod: finalPaymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Fulfillment Orchestration Failed");
        return;
      }

      // Clear local storage cart

      // Clean local storage cart
      localStorage.removeItem("cart");
      localStorage.removeItem("cartSummary");

      // Navigate to premium OrderSuccess invoice page
      navigate(`/order-success/${data.order._id}`);
    } catch (err) {
      console.error("Order processing error:", err);
      alert("Failed to place order. Connection error.");
      navigate("/payment-failed");
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!userToken) {
      alert("Please login to complete your order");
      navigate("/login");
      return;
    }

    if (!storeId || cart.length === 0) {
      alert("Your cart is empty. Please select items first.");
      return;
    }

    if (!address.trim()) {
      alert("Please save your delivery address before placing the order");
      return;
    }

    // Cash on Delivery direct flow
    if (paymentMethod === "COD") {
      await completeOrderCreation();
      return;
    }

    // Razorpay Test Mode trigger
    if (!window.Razorpay) {
      alert("Razorpay payment gateway failed to load. Please check your network.");
      return;
    }

    setLoading(true);

    const options = {
      key: "rzp_test_groceryAppKey0", // Test key
      amount: Math.round(summary.grandTotal * 100), // in paise
      currency: "INR",
      name: "greenmart",
      description: `Hyperlocal Grocery Payment (${paymentMethod})`,
      image: window.location.origin + "/placeholder.svg",
      prefill: {
        name: "Test Customer",
        email: "customer@greenmart.com",
        contact: "9999999999"
      },
      handler: async function (response) {
        if (response.razorpay_payment_id) {
          await completeOrderCreation(response.razorpay_payment_id);
        } else {
          navigate("/payment-failed");
        }
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          navigate("/payment-failed");
        }
      },
      theme: {
        color: "#16a34a"
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay failure response:", response.error);
        setLoading(false);
        navigate("/payment-failed");
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay launch error:", err);
      setLoading(false);
      navigate("/payment-failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-left">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-500 hover:text-green-600 font-extrabold text-sm"
          >
            ← Cart
          </button>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Order Checkout</h2>
          <div className="w-10"></div>
        </div>
      </header>

      <section className="p-4 sm:p-6 flex justify-center">
        <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          
          {/* FULFILLMENT INPUTS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* ADDRESS BOX */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-base text-gray-800 tracking-tight">📍 Select Delivery Address</h3>
                <button
                  onClick={() => navigate("/addresses")}
                  className="text-xs font-black text-green-600 hover:underline"
                >
                  Manage Addresses
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-2xl">
                  <p className="text-xs text-gray-500 font-semibold mb-3">No saved addresses found.</p>
                  <button
                    onClick={() => navigate("/addresses")}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    + Add Delivery Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`cursor-pointer border p-4 rounded-2xl flex items-center justify-between transition ${
                        selectedAddressId === addr.id
                          ? "bg-green-50 border-green-500 shadow-sm"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="text-left space-y-1">
                        <span className="text-[10px] font-black text-gray-800 bg-gray-150 px-2 py-0.5 rounded uppercase tracking-wider">
                          {addr.type === "Home" ? "🏠 Home" : addr.type === "Work" ? "💼 Work" : "📍 Other"}
                        </span>
                        <p className="text-xs text-gray-700 font-bold mt-1.5">{addr.apartment}</p>
                        <p className="text-[11px] text-gray-400 font-semibold">{addr.addressLine}</p>
                        {addr.instructions && (
                          <p className="text-[9px] text-green-700 font-bold bg-green-50/50 p-1 px-2 rounded-lg border border-green-150/40 inline-block">
                            🔔 {addr.instructions}
                          </p>
                        )}
                      </div>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedAddressId === addr.id ? "border-green-600 bg-green-600" : "border-gray-300"
                      }`}>
                        {selectedAddressId === addr.id && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DELIVERY SLOT SELECTOR */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-gray-800 tracking-tight">⏱️ Choose Delivery Slot</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`cursor-pointer border p-3.5 rounded-2xl flex flex-col justify-between h-24 transition duration-150 hover:border-green-300 ${
                      selectedSlot === slot.id
                        ? "bg-green-50 border-green-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black text-green-700 uppercase tracking-widest bg-green-100/50 px-1.5 py-0.5 rounded">
                        {slot.tag}
                      </span>
                    </div>
                    <div className="mt-2 text-left">
                      <p className="font-extrabold text-xs text-gray-800">{slot.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{slot.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT SELECTOR */}
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-gray-800 tracking-tight">💳 Payment Method</h3>
              
              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`cursor-pointer border p-4 rounded-2xl flex items-center justify-between transition duration-150 hover:border-green-300 ${
                      paymentMethod === pm.id
                        ? "bg-green-50 border-green-500 shadow-sm"
                        : "bg-white border-gray-250"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="text-left">
                        <p className="font-extrabold text-xs text-gray-800">{pm.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{pm.desc}</p>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === pm.id ? "border-green-600 bg-green-600" : "border-gray-300"
                    }`}>
                      {paymentMethod === pm.id && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* BILL DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Bill Summary</h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Items Subtotal</span>
                  <span className="text-gray-800 font-bold">₹{summary.itemsTotal}</span>
                </div>
                
                {summary.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Promo Code ({summary.couponCode})</span>
                    <span>− ₹{summary.couponDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Platform Fee</span>
                  <span className="text-gray-800 font-bold">₹{summary.platformFee}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Handling Charges</span>
                  <span className="text-gray-800 font-bold">₹{summary.handlingFee}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-semibold">Delivery Fee</span>
                  <span className="text-gray-800 font-bold">
                    {summary.deliveryFee === 0 ? (
                      <span className="text-green-600 font-bold">FREE Delivery</span>
                    ) : (
                      `₹${summary.deliveryFee}`
                    )}
                  </span>
                </div>

                <hr className="border-gray-100 my-2" />

                <div className="flex justify-between text-sm font-black">
                  <span className="text-gray-800">Grand Total</span>
                  <span className="text-green-600">₹{summary.grandTotal}</span>
                </div>

                {summary.totalSavings > 0 && (
                  <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-green-800 text-[10px] font-black text-center uppercase tracking-wider mt-3">
                    💰 Total Savings: ₹{summary.totalSavings}
                  </div>
                )}
              </div>

              {/* PLACE ORDER BUTTON */}
              <button
                disabled={loading}
                onClick={placeOrder}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-extrabold py-3.5 rounded-2xl transition shadow-md mt-6 text-sm flex justify-center items-center"
              >
                {loading ? "Fulfilling Order Orchestration..." : `PAY & PLACE ORDER • ₹${summary.grandTotal}`}
              </button>
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

export default Checkout;
