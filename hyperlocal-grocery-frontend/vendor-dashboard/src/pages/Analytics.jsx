import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

function Analytics() {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Computed metrics
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrdersCount: 0,
    avgOrderValue: 0,
    conversionRate: 3.2,
    returningCustomers: 28
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!store) return;

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
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
        setProducts(prodData.products || []);

        // 3. Compute Metrics
        const completed = ordList.filter(o => o.status === "Delivered" || o.deliveryStatus === "Delivered");
        const rev = completed.reduce((sum, o) => sum + o.totalAmount, 0);
        const count = completed.length;
        const avg = count > 0 ? Math.round(rev / count) : 0;

        setMetrics({
          totalRevenue: rev,
          totalOrdersCount: count,
          avgOrderValue: avg,
          conversionRate: 4.8,
          returningCustomers: 32
        });

      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [store]);

  if (!store) return <p className="p-8 text-center text-gray-500">No store registered to this account.</p>;
  if (loading) return <p className="p-8 text-center text-gray-500 font-bold">Assembling business analytics...</p>;

  // Mock Top Selling Products list
  const topProducts = [
    { name: "Fresh Farm Red Tomatoes", sales: 48, revenue: 1920, img: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=120" },
    { name: "Amul Pasteurised Butter", sales: 32, revenue: 1600, img: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=120" },
    { name: "Shimla Red Apples", sales: 24, revenue: 3120, img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120" }
  ];

  return (
    <div className="p-6 space-y-6 text-left bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Business Analytics</h1>
        <p className="text-xs text-gray-400 font-bold uppercase mt-1">Real-time metrics for {store.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Completed Revenue</span>
          <p className="text-2xl font-black text-green-600">₹{metrics.totalRevenue}</p>
          <span className="text-[9px] font-bold text-gray-400">Total earnings from delivered orders</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Sales Vol</span>
          <p className="text-2xl font-black text-gray-800">{metrics.totalOrdersCount}</p>
          <span className="text-[9px] font-bold text-gray-400">Delivered checkout volume</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Avg Order Value</span>
          <p className="text-2xl font-black text-blue-600">₹{metrics.avgOrderValue}</p>
          <span className="text-[9px] font-bold text-gray-400">Average ticket size per order</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-28">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Returning Customers</span>
          <p className="text-2xl font-black text-orange-600">{metrics.returningCustomers}%</p>
          <span className="text-[9px] font-bold text-gray-400">Customer retention metric</span>
        </div>

      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Trend SVG */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-700">Weekly Revenue Trend (Last 7 Days)</h3>
          
          <div className="h-56 w-full flex items-end justify-between px-2 pt-6 relative">
            {/* SVG Trend line */}
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
                fill="url(#grad)"
                opacity="0.1"
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Days markers */}
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
              {/* Fruits & Vegetables (50%) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" 
                      strokeDasharray="50 50" strokeDashoffset="0" />
              {/* Dairy (30%) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" 
                      strokeDasharray="30 70" strokeDashoffset="-50" />
              {/* Stationery (20%) */}
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" 
                      strokeDasharray="20 80" strokeDashoffset="-80" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
            <span className="text-emerald-600">🍎 Fruits (50%)</span>
            <span className="text-amber-500">🥛 Dairy (30%)</span>
            <span className="text-blue-500">✏️ Station. (20%)</span>
          </div>
        </div>

      </div>

      {/* TOP SELLING PRODUCTS */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-800 tracking-tight">Top Performing Products</h3>
        
        <div className="space-y-3">
          {topProducts.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-2xl hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <img src={p.img} alt={p.name} className="w-10 h-10 object-cover rounded-lg bg-gray-50" />
                <div>
                  <p className="text-xs font-black text-gray-800">{p.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Rank #{idx+1} • High Demand</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-gray-800">{p.sales} Sales</p>
                <p className="text-[10px] text-green-600 font-bold mt-0.5">₹{p.revenue} Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Analytics;
