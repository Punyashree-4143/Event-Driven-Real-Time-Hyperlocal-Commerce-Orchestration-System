import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { AuthContext } from "../context/AuthContext";
import { addToCart } from "../utils/cart";

const LOCAL_PLACEHOLDER = "/placeholder.svg";

const CATEGORIES_DATA = [
  { name: "Fruits & Vegetables", emoji: "🍎🥦", gradient: "from-green-50 to-emerald-100 border-green-200", text: "text-green-800" },
  { name: "Dairy & Breakfast", emoji: "🥛🥞", gradient: "from-yellow-50 to-amber-100 border-yellow-250", text: "text-amber-800" },
  { name: "Snacks & Beverages", emoji: "🍿🥤", gradient: "from-red-50 to-orange-100 border-red-200", text: "text-red-900" },
  { name: "Frozen Foods", emoji: "❄️🍟", gradient: "from-blue-50 to-indigo-100 border-blue-200", text: "text-blue-900" },
  { name: "Bakery", emoji: "🍞🧁", gradient: "from-amber-50 to-orange-100 border-amber-200", text: "text-orange-950" },
  { name: "Personal Care", emoji: "🧴🧼", gradient: "from-pink-50 to-rose-100 border-pink-200", text: "text-pink-900" },
  { name: "Household Essentials", emoji: "🕯️🔋", gradient: "from-indigo-50 to-purple-100 border-indigo-200", text: "text-indigo-900" },
  { name: "Cleaning Supplies", emoji: "🧹🧼", gradient: "from-blue-50 to-sky-100 border-blue-200", text: "text-blue-955" }
];

const BANNERS = [
  { id: 1, title: "Super Savings Week", desc: "Get up to 50% off on fresh greens", code: "FRESH50", bg: "from-green-600 to-emerald-800 text-white" },
  { id: 2, title: "Breakfast Deals", desc: "Flat 20% off on bread, milk & butter", code: "MILK20", bg: "from-amber-500 to-orange-600 text-white" },
  { id: 3, title: "Midnight Cravings", desc: "Ice creams & chips in 10 minutes", code: "CRUSH30", bg: "from-purple-600 to-indigo-800 text-white" }
];

function Home() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [stores, setStores] = useState([]);
  const [nearestStore, setNearestStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Banner rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation and store fetching
  useEffect(() => {
    // Recent Orders from MongoDB
    const fetchRecentOrders = async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.orders) {
          setRecentOrders(data.orders.slice(0, 2));
        }
      } catch (err) {
        console.error("Error loading recent orders:", err);
      }
    };
    fetchRecentOrders();

    const cachedLoc = localStorage.getItem("userLocation");
    if (cachedLoc) {
      const parsed = JSON.parse(cachedLoc);
      setUserLocation(parsed);
      fetchStores(parsed.lat, parsed.lng);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem("userLocation", JSON.stringify(loc));
          fetchStores(loc.lat, loc.lng);
        },
        (err) => {
          // Fallback to default Bangalore location
          const fallback = { lat: 12.9264, lng: 77.5830 };
          setUserLocation(fallback);
          localStorage.setItem("userLocation", JSON.stringify(fallback));
          fetchStores(fallback.lat, fallback.lng);
        }
      );
    }
  }, []);

  const fetchStores = async (lat, lng) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/stores/nearby?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      const nearbyStores = data.stores || [];
      setStores(nearbyStores);

      if (nearbyStores.length > 0) {
        // Find nearest deliverable store
        const deliverable = nearbyStores.find(s => s.canDeliver) || nearbyStores[0];
        setNearestStore(deliverable);
        fetchFeaturedProducts(deliverable._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading stores:", err);
      setLoading(false);
    }
  };

  const fetchFeaturedProducts = async (storeId) => {
    try {
      setProductsLoading(true);
      const res = await fetch(`${API_BASE_URL}/products/${storeId}`);
      const data = await res.json();
      setProducts((data.products || []).slice(0, 8));
    } catch (err) {
      console.error("Error loading featured products:", err);
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  };

  const handleCategoryClick = (catName) => {
    const activeStoreId = nearestStore?._id || localStorage.getItem("currentStoreId");
    if (activeStoreId) {
      navigate(`/category/${encodeURIComponent(catName)}?storeId=${activeStoreId}`);
    } else {
      alert("Please select a store to browse categories.");
      const storeSection = document.getElementById("stores-list");
      if (storeSection) storeSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* 🚀 BANNER CAROUSEL & DYNAMIC CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CAROUSEL */}
        <div className={`col-span-1 lg:col-span-2 rounded-2xl p-6 md:p-8 bg-gradient-to-r ${BANNERS[currentBanner].bg} shadow-md flex flex-col justify-between h-56 transition-all duration-500 relative overflow-hidden`}>
          <div className="space-y-2">
            <span className="bg-white/20 border border-white/30 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
              Limited Offer
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{BANNERS[currentBanner].title}</h2>
            <p className="opacity-90 text-sm md:text-base font-medium">{BANNERS[currentBanner].desc}</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-lg text-xs md:text-sm font-black tracking-wide uppercase">
              Code: {BANNERS[currentBanner].code}
            </div>
            <button 
              onClick={() => {
                if (nearestStore) navigate(`/store/${nearestStore._id}`);
                else navigate("/stores");
              }}
              className="bg-white text-gray-900 font-bold px-4 py-2 rounded-xl text-xs md:text-sm hover:scale-105 transition-transform"
            >
              Shop Now →
            </button>
          </div>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {BANNERS.map((_, idx) => (
              <span 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition ${currentBanner === idx ? "bg-white scale-125" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* CURRENT LOCATION / QUICK LAUNCH */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-150 flex flex-col justify-between h-56">
          <div className="space-y-2 text-left">
            <span className="text-green-600 font-black text-xs uppercase tracking-wider flex items-center gap-1">
              <span className="animate-ping rounded-full h-1.5 w-1.5 bg-green-500 inline-block mr-1"></span>
              Orchestrating Hyperlocal Delivery
            </span>
            <h3 className="font-extrabold text-xl text-gray-800">Your Shopping Session</h3>
            {nearestStore ? (
              <p className="text-gray-500 text-sm">
                Connected to <span className="text-green-600 font-bold">{nearestStore.name}</span> ({(nearestStore.distance / 1000).toFixed(1)} km away). Delivering in <span className="font-semibold text-gray-800">{nearestStore.deliveryRadius * 2 + 10} mins</span>!
              </p>
            ) : (
              <p className="text-gray-500 text-sm">Finding nearest stores for rapid fulfillment...</p>
            )}
          </div>
          
          <div className="flex gap-3">
            {nearestStore && (
              <button 
                onClick={() => navigate(`/store/${nearestStore._id}`)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs transition duration-150"
              >
                Fulfill Items
              </button>
            )}
            <button 
              onClick={() => navigate("/stores")}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition duration-150"
            >
              Browse Stores
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* 🏷️ CATEGORY GRID */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight text-left">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {CATEGORIES_DATA.map((cat) => (
              <div
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`cursor-pointer transform hover:-translate-y-1 hover:shadow-md transition-all duration-200 rounded-2xl p-4 bg-gradient-to-br ${cat.gradient} border flex flex-col items-center justify-center text-center h-28`}
              >
                <span className="text-3xl mb-1">{cat.emoji}</span>
                <span className={`font-bold text-xs leading-tight tracking-wide ${cat.text}`}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 🛍️ RECENTLY ORDERED */}
        {recentOrders.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight text-left">Recently Ordered</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentOrders.map((order) => (
                <div 
                  key={order._id}
                  onClick={() => navigate(`/tracking/${order._id}`)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-150 flex items-center justify-between cursor-pointer hover:border-green-300 transition duration-150 text-left"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order ID: #{order._id.substring(18)}</p>
                    <p className="font-bold text-sm text-gray-800 truncate max-w-[250px] sm:max-w-[350px]">
                      {order.items.map(i => `${i.name} (${i.qty})`).join(", ")}
                    </p>
                    <p className="text-xs text-green-600 font-bold">Total: ₹{order.totalAmount} • Status: {order.status}</p>
                  </div>
                  <span className="text-xl">⚡</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 🏪 NEARBY STORES */}
        <section id="stores-list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight text-left">Nearby Stores</h2>
            <button 
              onClick={() => navigate("/stores")}
              className="text-sm font-bold text-green-600 hover:text-green-700 transition"
            >
              See All Stores
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-5 space-y-4 animate-pulse h-40" />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-150">
              <p className="text-gray-500 font-medium">No nearby stores found in your delivery range.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store._id}
                  onClick={() => store.canDeliver && navigate(`/store/${store._id}`)}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-150 p-5 flex flex-col justify-between hover:shadow-md hover:border-green-300 transition duration-150 text-left ${
                    store.canDeliver ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-extrabold text-lg text-gray-800 truncate max-w-[200px]">{store.name}</h3>
                      <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        4.5 ★
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{store.address}</p>
                    <p className="text-xs font-semibold text-gray-600 mt-2">
                      📍 {(store.distance / 1000).toFixed(1)} km • 🚚 {store.deliveryRadius} km delivery radius
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-4">
                    <span className="text-xs font-black text-gray-700">
                      ⚡ {store.canDeliver ? `${store.deliveryRadius * 2 + 10} mins` : "Out of Range"}
                    </span>
                    {store.canDeliver ? (
                      <span className="text-xs font-bold text-green-600 flex items-center gap-0.5">
                        Shop Now <span className="text-sm">→</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-500">Unserviceable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🍎 BEST SELLERS & FEATURED PRODUCTS */}
        {nearestStore && products.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight text-left">Best Sellers in {nearestStore.name}</h2>
              <button 
                onClick={() => navigate(`/store/${nearestStore._id}`)}
                className="text-sm font-bold text-green-600 hover:text-green-700 transition"
              >
                View Store
              </button>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-150 p-4 h-64 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const disc = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                  return (
                    <div
                      key={p._id}
                      onClick={() => navigate(`/product/${p._id}`)}
                      className="bg-white rounded-2xl border border-gray-150 p-4 flex flex-col justify-between hover:shadow-md transition duration-150 cursor-pointer relative text-left"
                    >
                      {/* Discount Badge */}
                      {disc > 0 && (
                        <span className="absolute top-3 left-3 bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
                          {disc}% OFF
                        </span>
                      )}

                      {/* Image */}
                      <div className="h-32 w-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 mb-3">
                        <img
                          src={p.image || LOCAL_PLACEHOLDER}
                          alt={p.name}
                          className="h-full w-full object-cover transform hover:scale-105 transition duration-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = LOCAL_PLACEHOLDER;
                          }}
                        />
                      </div>

                      {/* Brand & Name */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{p.brand || "Generic"}</span>
                        <h4 className="font-extrabold text-sm text-gray-800 line-clamp-2 mt-0.5 h-10">{p.name}</h4>
                        <p className="text-[11px] font-bold text-gray-500 mt-1">{p.availableWeights?.[0] || "1 kg"}</p>
                      </div>

                      {/* Price & Add */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-col">
                          <span className="text-green-600 font-extrabold text-base leading-none">₹{p.price}</span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-xs text-gray-400 line-through mt-0.5">₹{p.mrp}</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, nearestStore._id, p.availableWeights?.[0] || "1 kg");
                            alert(`Added ${p.name} to cart!`);
                          }}
                          className="bg-white hover:bg-green-50 text-green-600 border border-green-200 hover:border-green-300 font-extrabold text-xs px-4 py-2 rounded-xl transition duration-100 shadow-sm"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

export default Home;
