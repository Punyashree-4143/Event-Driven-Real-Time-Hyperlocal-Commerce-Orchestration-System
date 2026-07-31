import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StoreContext } from "../context/StoreContext";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config";

const socket = io(SOCKET_URL, {
  autoConnect: false
});

function VendorOrders() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { store } = useContext(StoreContext);
  const token = auth?.token;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Active Kanban Tab: Pending, Accepted, Preparing, Packed, Ready, Out For Delivery, Delivered, Cancelled
  const [activeTab, setActiveTab] = useState("Pending");

  // Selected Order for Invoice Overlay
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const joinedStoreRef = useRef(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/vendor`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error loading vendor orders:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on("connect", async () => {
      if (joinedStoreRef.current) return;
      try {
        const res = await fetch(`${API_BASE_URL}/stores/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.store?._id) {
          socket.emit("joinStore", data.store._id);
          joinedStoreRef.current = true;
        }
      } catch (err) {
        console.error("Store join failed:", err.message);
      }
    });

    socket.on("order:update", () => {
      console.log("[VENDOR] Socket received order:update event!");
      fetchOrders();
    });
    socket.on("delivery:update", () => {
      console.log("[VENDOR] Socket received delivery:update event!");
      fetchOrders();
    });

    pollRef.current = setInterval(fetchOrders, 10000);
    fetchOrders();

    return () => {
      socket.off("connect");
      socket.off("order:update");
      socket.off("delivery:update");
      clearInterval(pollRef.current);
      socket.disconnect();
    };
  }, [token]);

  const updateStatus = async (orderId, status) => {
    try {
      console.log(`[VENDOR] Requesting order ${orderId} status change to ${status}`);
      setUpdatingId(orderId);
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update order status");
      }
      
      console.log(`[VENDOR] Order ${orderId} status successfully updated to ${status}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Map database states into active status tabs
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "Pending") {
      return o.status === "Placed";
    }
    if (activeTab === "Accepted") {
      return o.status === "Accepted";
    }
    if (activeTab === "Preparing") {
      return o.status === "Preparing";
    }
    if (activeTab === "Packed") {
      return o.status === "Packed" && o.deliveryStatus !== "Assigned" && o.deliveryStatus !== "Picked Up" && o.deliveryStatus !== "On the Way" && o.deliveryStatus !== "Delivered";
    }
    if (activeTab === "Ready") {
      return o.status === "Ready" && o.deliveryStatus !== "Assigned" && o.deliveryStatus !== "Picked Up" && o.deliveryStatus !== "On the Way" && o.deliveryStatus !== "Delivered";
    }
    if (activeTab === "Out For Delivery") {
      return o.status !== "Cancelled" && ["Assigned", "Picked Up", "On the Way"].includes(o.deliveryStatus);
    }
    if (activeTab === "Delivered") {
      return o.status === "Delivered" || o.deliveryStatus === "Delivered";
    }
    if (activeTab === "Cancelled") {
      return o.status === "Cancelled";
    }
    return true;
  });

  const getCountForTab = (tabName) => {
    return orders.filter((o) => {
      if (tabName === "Pending") return o.status === "Placed";
      if (tabName === "Accepted") return o.status === "Accepted";
      if (tabName === "Preparing") return o.status === "Preparing";
      if (tabName === "Packed") return o.status === "Packed" && !["Assigned", "Picked Up", "On the Way", "Delivered"].includes(o.deliveryStatus);
      if (tabName === "Ready") return o.status === "Ready" && !["Assigned", "Picked Up", "On the Way", "Delivered"].includes(o.deliveryStatus);
      if (tabName === "Out For Delivery") return o.status !== "Cancelled" && ["Assigned", "Picked Up", "On the Way"].includes(o.deliveryStatus);
      if (tabName === "Delivered") return o.status === "Delivered" || o.deliveryStatus === "Delivered";
      if (tabName === "Cancelled") return o.status === "Cancelled";
      return false;
    }).length;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-55 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-left bg-gray-55 min-h-screen space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Order dispatch center</h1>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Hyperlocal delivery logistics board</p>
        </div>
      </div>

      {/* KANBAN STATUS TABS */}
      <div className="flex flex-wrap gap-2 border-b pb-4 border-gray-200">
        {[
          { key: "Pending", label: "📥 Pending" },
          { key: "Accepted", label: "🤝 Accepted" },
          { key: "Preparing", label: "🍳 Preparing" },
          { key: "Packed", label: "📦 Packed" },
          { key: "Ready", label: "🔔 Ready" },
          { key: "Out For Delivery", label: "🛵 Out For Delivery" },
          { key: "Delivered", label: "✓ Delivered" },
          { key: "Cancelled", label: "❌ Cancelled" }
        ].map((tab) => {
          const count = getCountForTab(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase border transition flex items-center gap-2 ${
                activeTab === tab.key 
                  ? "bg-green-600 text-white border-green-600 shadow-sm" 
                  : "bg-white text-gray-650 hover:bg-gray-150 border-gray-250"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ORDERS GRID */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 font-bold text-xs border border-gray-200 shadow-sm">
          No orders registered in this status.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((o) => {
            const customerName = o.userId?.name || "Guest customer";
            const customerPhone = o.userId?.phone || "N/A";
            const customerEmail = o.userId?.email || "";

            // Payment calculations
            const isCOD = (o.paymentMethod || "").toUpperCase() === "COD";
            const paymentText = isCOD ? "COD - Collect Cash" : "Paid Online";

            return (
              <div 
                key={o._id} 
                className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-gray-300 transition"
              >
                
                {/* Header Info */}
                <div className="flex justify-between items-start border-b pb-3 border-gray-100">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase">Order Ref</span>
                    <h3 className="font-extrabold text-sm text-gray-800">#{o._id.slice(-8).toUpperCase()}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      o.status === "Cancelled" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : o.deliveryStatus === "Delivered" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-yellow-50 text-yellow-750 border-yellow-250 animate-pulse"
                    }`}>
                      {o.deliveryStatus === "Delivered" ? "Delivered" : o.status}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs">
                  <p className="font-black text-gray-800">👤 {customerName}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">📞 {customerPhone} {customerEmail && `• 📧 ${customerEmail}`}</p>
                  <p className="text-[11px] text-gray-550 mt-1.5 leading-snug">📍 {o.address}</p>
                </div>

                {/* Items List */}
                <div className="bg-gray-55 p-3 rounded-2xl border space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Items list ({o.items.length})</span>
                  <div className="space-y-1.5 text-[11px] max-h-32 overflow-y-auto pr-1">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-700 font-bold">
                        <span>{it.name} <span className="text-gray-400">x{it.qty}</span></span>
                        <span>₹{it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Breakdown & ETA */}
                <div className="flex justify-between items-baseline pt-2 border-t text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Payment Status</span>
                    <span className={`text-[10px] font-black mt-0.5 ${isCOD ? "text-orange-600" : "text-green-600"}`}>
                      {paymentText} (₹{o.totalAmount})
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-450 font-bold">🕒 ETA: {o.deliveryTime || store?.deliveryTime || "30 mins"}</span>
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t flex gap-2">
                  
                  {/* View Invoice Button */}
                  <button
                    onClick={() => setInvoiceOrder(o)}
                    className="bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-gray-250 transition"
                  >
                    Invoice
                  </button>

                  <div className="flex-1">
                    {updatingId === o._id ? (
                      <div className="text-center text-xs font-bold py-2.5 text-gray-400">Updating...</div>
                    ) : o.status === "Placed" ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => updateStatus(o._id, "Accepted")}
                          className="flex-1 bg-green-650 hover:bg-green-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition uppercase tracking-wider text-center"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(o._id, "Cancelled")}
                          className="bg-red-50 hover:bg-red-100 text-red-650 font-bold text-xs px-4 py-2.5 rounded-xl border border-red-200 transition uppercase tracking-wider"
                        >
                          Reject
                        </button>
                      </div>
                    ) : o.status === "Accepted" ? (
                      <button
                        onClick={() => updateStatus(o._id, "Preparing")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2.5 rounded-xl transition uppercase tracking-wider"
                      >
                        Prepare Order
                      </button>
                    ) : o.status === "Preparing" ? (
                      <button
                        onClick={() => updateStatus(o._id, "Packed")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition uppercase tracking-wider"
                      >
                        Pack Order
                      </button>
                    ) : o.status === "Packed" ? (
                      <button
                        onClick={() => updateStatus(o._id, "Ready")}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition uppercase tracking-wider"
                      >
                        Mark as Ready
                      </button>
                    ) : o.status === "Ready" ? (
                      <div className="text-center text-indigo-700 font-bold text-[10px] uppercase bg-indigo-50 p-2 rounded-xl border border-indigo-150 animate-pulse w-full">
                        📦 Ready for pickup
                      </div>
                    ) : o.status === "Cancelled" ? (
                      <div className="text-center text-red-650 font-bold text-[10px] uppercase bg-red-50 p-2 rounded-xl border border-red-100 w-full">
                        🚫 Order Cancelled
                      </div>
                    ) : (
                      <div className="text-center text-green-650 font-bold text-[10px] uppercase bg-green-50 p-2 rounded-xl border border-green-150 w-full">
                        ✓ Completed
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PRINT-READY INVOICE MODAL OVERLAY */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border shadow-xl flex flex-col justify-between max-h-[90vh]">
            
            {/* INVOICE DETAILS SHEET */}
            <div id="invoicePrintArea" className="space-y-4 overflow-y-auto pr-1 text-xs">
              
              <div className="flex justify-between items-start border-b pb-3 border-gray-200">
                <div>
                  <h2 className="text-base font-black text-gray-800 uppercase tracking-tight">{store?.name || "Merchant Store"}</h2>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{store?.address || "Store Address"}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wider">INVOICE</h3>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">Order #{invoiceOrder._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {/* Customer Segment */}
              <div className="grid grid-cols-2 gap-4 bg-gray-55 p-3 rounded-2xl border border-gray-150">
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Billed To:</span>
                  <p className="font-black text-gray-800 mt-1">{invoiceOrder.userId?.name || "Guest Customer"}</p>
                  <p className="text-gray-500 font-medium mt-0.5">Phone: {invoiceOrder.userId?.phone || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Deliver To:</span>
                  <p className="font-medium text-gray-600 mt-1 leading-snug">{invoiceOrder.address}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-black uppercase text-[9px] tracking-wider">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center w-12">Qty</th>
                    <th className="py-2 text-right w-20">Price</th>
                    <th className="py-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold">
                  {invoiceOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 text-gray-800">{it.name}</td>
                      <td className="py-2.5 text-center text-gray-500">{it.qty}</td>
                      <td className="py-2.5 text-right text-gray-500">₹{it.price}</td>
                      <td className="py-2.5 text-right text-gray-800">₹{it.price * it.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bill Totals Summary */}
              <div className="border-t pt-3 space-y-1.5 font-bold text-right text-[10px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>₹{invoiceOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee:</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-gray-800 text-sm font-black pt-1.5 border-t">
                  <span>Grand Total:</span>
                  <span>₹{invoiceOrder.totalAmount}</span>
                </div>
              </div>

              {/* Payment Type */}
              <p className="text-[10px] text-gray-400 font-bold uppercase text-center pt-2">
                Payment Mode: {invoiceOrder.paymentMethod || "COD"} • Thank you for shopping with us!
              </p>

            </div>

            {/* CONTROL ROW */}
            <div className="flex gap-3 pt-4 border-t mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-green-650 hover:bg-green-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-sm transition uppercase tracking-wider text-center"
              >
                Print Invoice
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs px-6 py-3 rounded-2xl border border-gray-250 transition uppercase tracking-wider"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default VendorOrders;
