import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

function Dashboard() {
  const { store, loading: storeLoading } = useContext(StoreContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    catalogCount: 0,
    categoriesCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  const fetchDashboardData = async () => {
    if (!store) return;
    try {
      setLoadingMetrics(true);
      // 1. Fetch Orders
      const ordRes = await fetch(`${API_BASE}/orders/vendor`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const ordData = await ordRes.json();
      const ordList = ordData.orders || [];
      setOrders(ordList);

      // 2. Fetch Products
      const prodRes = await fetch(`${API_BASE}/products/${store._id}`);
      const prodData = await prodRes.json();
      const prodList = prodData.products || [];
      setProducts(prodList);

      // 3. Compute Metrics
      const todayString = new Date().toDateString();
      
      const todayOrders = ordList.filter(o => new Date(o.createdAt).toDateString() === todayString);
      const todayOrdersCount = todayOrders.length;
      
      const todayCompleted = todayOrders.filter(o => o.status === "Delivered" || o.deliveryStatus === "Delivered");
      const todayRevSum = todayCompleted.reduce((sum, o) => sum + o.totalAmount, 0);

      const pendingStatuses = ["Placed", "Accepted", "Preparing", "Packed", "Ready"];
      const pendingOrdersCount = ordList.filter(o => pendingStatuses.includes(o.status)).length;

      const lowStock = prodList.filter(p => p.stock > 0 && p.stock <= 5).length;
      const outOfStock = prodList.filter(p => p.stock === 0).length;
      const uniqueCats = new Set(prodList.map(p => p.category).filter(Boolean)).size;

      setMetrics({
        todayRevenue: todayRevSum,
        todayOrdersCount,
        pendingOrdersCount,
        catalogCount: prodList.length,
        categoriesCount: uniqueCats,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock
      });
    } catch (err) {
      console.error("Dashboard calculation error:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (store) {
      fetchDashboardData();
    }
  }, [store]);

  if (storeLoading || (store && loadingMetrics)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-left bg-gray-55 min-h-screen font-sans">
      
      {/* HEADER & STORE SUMMARY CARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Merchant Dashboard</h1>
          {store ? (
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">
              Store status:{" "}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ml-1 ${
                store.status === "approved" 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-yellow-50 text-yellow-750 border-yellow-250 animate-pulse"
              }`}>
                {store.status}
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Awaiting store configuration</p>
          )}
        </div>

        {store?.status === "approved" && (
          <div className="flex gap-2">
            <Link
              to="/products/add"
              className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              + Add Product
            </Link>
            <Link
              to="/orders"
              className="bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
            >
              Check Orders
            </Link>
          </div>
        )}
      </div>

      {/* NO STORE SETUP */}
      {!store && (
        <div className="bg-white p-8 rounded-3xl border border-gray-150 shadow-sm max-w-md">
          <span className="text-4xl block mb-3">🏪</span>
          <h3 className="font-extrabold text-lg text-gray-850 mb-2">Configure Your Store</h3>
          <p className="text-xs text-gray-455 leading-relaxed mb-6 font-semibold">
            To start listing products and receiving hyperlocal orders, setup your merchant store details (hours, radius, location).
          </p>
          <Link
            to="/store"
            className="bg-green-650 hover:bg-green-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-sm transition inline-block"
          >
            Setup Store Profile
          </Link>
        </div>
      )}

      {/* STORE UNDER REVIEW */}
      {store && store.status === "pending" && (
        <div className="bg-amber-50/50 border border-amber-200 p-6 rounded-3xl max-w-md shadow-sm">
          <span className="text-3xl block mb-2">⏳</span>
          <p className="font-extrabold text-sm text-amber-900">Your store is under verification review</p>
          <p className="text-xs text-amber-700 leading-relaxed font-semibold mt-1.5">
            Admin validation usually takes 2-4 hours. You will receive an alert once approved to begin adding inventory.
          </p>
        </div>
      )}

      {/* STORE LIVE / METRICS & CHARTS */}
      {store && store.status === "approved" && (
        <div className="space-y-6">
          
          {/* Store Summary Block */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl shadow-sm border border-emerald-100">🏪</div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-800">{store.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{store.address}</p>
              </div>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l sm:border-r border-gray-150 px-4 py-2 sm:py-0">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Operational Profile</span>
              <p className="text-xs font-bold text-gray-600 mt-1">🕒 {store.businessHours} | 🛵 Radius: {store.deliveryRadius} km</p>
            </div>
            <div className="px-4">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Delivery ETA</span>
              <p className="text-xs font-bold text-gray-600 mt-1">⏰ {store.deliveryTime || "30 mins"}</p>
            </div>
          </div>
          
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Today's Revenue</span>
              <p className="text-xl font-black text-green-600">₹{metrics.todayRevenue}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Today's Orders</span>
              <p className="text-xl font-black text-gray-800">{metrics.todayOrdersCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Pending Orders</span>
              <p className={`text-xl font-black ${metrics.pendingOrdersCount > 0 ? "text-orange-500 font-black animate-pulse" : "text-gray-800"}`}>
                {metrics.pendingOrdersCount}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products Count</span>
              <p className="text-xl font-black text-gray-800">{metrics.catalogCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Categories Count</span>
              <p className="text-xl font-black text-gray-800">{metrics.categoriesCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Low Stock Products</span>
              <p className={`text-xl font-black ${metrics.lowStockCount > 0 ? "text-orange-500 font-black" : "text-gray-800"}`}>
                {metrics.lowStockCount}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Out of Stock</span>
              <p className={`text-xl font-black ${metrics.outOfStockCount > 0 ? "text-red-500 font-black" : "text-gray-800"}`}>
                {metrics.outOfStockCount}
              </p>
            </div>

          </div>

          {/* SVG CHARTS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly Revenue Trend SVG */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-700">Weekly Revenue Trend (Last 7 Days)</h3>
              
              <div className="h-56 w-full flex items-end justify-between px-2 pt-6 relative">
                <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <path
                    d="M 5,45 Q 20,25 35,35 T 65,15 T 95,5"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 5,45 Q 20,25 35,35 T 65,15 T 95,5 L 95,50 L 5,50 Z"
                    fill="url(#dashboardGrad)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="dashboardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#16a34a" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                  <span key={idx} className="text-[9px] font-black text-gray-400 uppercase tracking-wider z-10 w-1/7 text-center">
                    {day}
                  </span>
                ))}
              </div>
            </div>

            {/* Categories Split Donut SVG */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
              <h3 className="font-extrabold text-sm text-gray-700">Sales Split by Category</h3>
              
              <div className="flex justify-center items-center h-40">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4.5" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" strokeDasharray="50 50" strokeDashoffset="0" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="30 70" strokeDashoffset="-50" />
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-80" />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                <span className="text-emerald-600">🍎 Fruits (50%)</span>
                <span className="text-amber-500">🥛 Dairy (30%)</span>
                <span className="text-blue-500">✏️ Station. (20%)</span>
              </div>
            </div>

          </div>

          {/* LOWER GRID: RECENT ORDERS & ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders List */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-gray-800 tracking-tight">Recent Orders</h3>
              
              {orders.length === 0 ? (
                <p className="text-gray-500 text-xs font-semibold py-4">No orders placed yet.</p>
              ) : (
                <div className="space-y-3.5">
                  {orders.slice(0, 5).map((o) => (
                    <div 
                      key={o._id}
                      onClick={() => navigate("/orders")}
                      className="cursor-pointer flex items-center justify-between p-3.5 border rounded-2xl hover:bg-gray-50 transition"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase">ORDER #{o._id.slice(-6)}</span>
                        <p className="text-xs font-black text-gray-800">Total: ₹{o.totalAmount} • {o.items.length} {o.items.length === 1 ? "item" : "items"}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide border ${
                        o.status === "Cancelled" 
                          ? "bg-red-50 text-red-700 border-red-150" 
                          : o.deliveryStatus === "Delivered" 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-750 border-yellow-250 animate-pulse"
                      }`}>
                        {o.deliveryStatus === "Delivered" ? "Delivered" : o.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Alerts & Quick Actions */}
            <div className="space-y-6">
              
              {/* Quick Action Cards */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-gray-700">Quick Shortcuts</h3>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-black uppercase tracking-wider">
                  <Link to="/products/add" className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border transition">
                    + Add Product
                  </Link>
                  <Link to="/products/manage" className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border transition">
                    ✏️ Bulk Editor
                  </Link>
                  <Link to="/store" className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border transition">
                    🏪 Store Config
                  </Link>
                  <Link to="/products/list" className="bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border transition">
                    📋 Product List
                  </Link>
                </div>
              </div>

              {/* Alerts Panel */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="font-extrabold text-sm text-gray-700">Inventory Alerts</h3>
                {metrics.lowStockCount === 0 && metrics.outOfStockCount === 0 ? (
                  <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                    ✓ All inventory stocks look healthy!
                  </p>
                ) : (
                  <div className="space-y-2 text-xs font-bold">
                    {metrics.outOfStockCount > 0 && (
                      <div 
                        onClick={() => navigate("/products/manage")}
                        className="cursor-pointer bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 hover:bg-red-100/50 transition"
                      >
                        ⚠️ {metrics.outOfStockCount} items are Out of Stock!
                      </div>
                    )}
                    {metrics.lowStockCount > 0 && (
                      <div 
                        onClick={() => navigate("/products/list")}
                        className="cursor-pointer bg-orange-50/50 text-orange-850 p-3 rounded-xl border border-orange-200 hover:bg-orange-100/30 transition"
                      >
                        ⚠️ {metrics.lowStockCount} items are running low!
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Dashboard;
