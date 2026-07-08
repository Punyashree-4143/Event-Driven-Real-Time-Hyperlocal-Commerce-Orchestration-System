import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../services/api";
import { addToCart } from "../utils/cart";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

// 🔑 API & SOCKET BASE
const API_BASE = API_BASE_URL;

// 🔌 SOCKET (single instance)
const socket = io(SOCKET_URL);

const CATEGORIES_DATA = [
  { name: "Fruits & Vegetables", emoji: "🍎🥦", gradient: "from-green-50 to-emerald-100 border-green-200", text: "text-green-800" },
  { name: "Dairy & Breakfast", emoji: "🥛🥞", gradient: "from-yellow-50 to-amber-100 border-yellow-200", text: "text-amber-800" },
  { name: "Snacks & Beverages", emoji: "🍿🥤", gradient: "from-red-50 to-orange-100 border-red-200", text: "text-red-900" },
  { name: "Stationery", emoji: "✏️📓", gradient: "from-slate-50 to-slate-100 border-slate-200", text: "text-slate-900" },
  { name: "Household Essentials", emoji: "🕯️🔋", gradient: "from-indigo-50 to-purple-100 border-indigo-200", text: "text-indigo-900" },
  { name: "Cleaning Supplies", emoji: "🧹🧼", gradient: "from-blue-50 to-sky-100 border-blue-200", text: "text-blue-950" },
  { name: "Personal Care", emoji: "🧴🧼", gradient: "from-pink-50 to-rose-100 border-pink-200", text: "text-pink-900" },
  { name: "Baby Care", emoji: "👶🍼", gradient: "from-purple-50 to-pink-100 border-purple-200", text: "text-purple-900" },
  { name: "Pet Care", emoji: "🐶🐱", gradient: "from-rose-50 to-red-100 border-rose-200", text: "text-rose-900" },
  { name: "Frozen Foods", emoji: "❄️🍟", gradient: "from-blue-50 to-indigo-100 border-blue-200", text: "text-blue-900" },
  { name: "Bakery", emoji: "🍞🧁", gradient: "from-amber-50 to-orange-100 border-amber-200", text: "text-orange-900" },
  { name: "Meat & Seafood", emoji: "🥩🐟", gradient: "from-red-50 to-rose-100 border-red-300", text: "text-red-955" },
  { name: "Electronics", emoji: "🔌🔋", gradient: "from-gray-50 to-gray-150 border-gray-200", text: "text-gray-900" },
  { name: "Home & Kitchen", emoji: "🍳🏺", gradient: "from-yellow-50 to-amber-100 border-yellow-250", text: "text-yellow-950" },
  { name: "Others", emoji: "📦🛒", gradient: "from-emerald-50 to-teal-100 border-emerald-200", text: "text-teal-955" },
];

const isValidObjectId = (id) => {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
};

const safeJsonParse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      if (contentType.includes("application/json")) {
        const errData = await res.json();
        errMessage = errData.message || errMessage;
      } else {
        const text = await res.text();
        errMessage = text.substring(0, 100) || errMessage;
      }
    } catch (_) {}
    throw new Error(errMessage);
  }
  if (!contentType.includes("application/json")) {
    throw new Error("Expected JSON response, but received HTML.");
  }
  return res.json();
};

function Products() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);

  // 🔥 variant state PER PRODUCT
  const [variants, setVariants] = useState({});

  /* =========================
     CART STATE
     ========================= */
  const refreshCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(cart);
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const isInCart = (productId, variant) =>
    cartItems.some(
      (i) => i._id === productId && i.variant === variant
    );

  /* =========================
     FETCH PRODUCTS & STORE DETAILS
     ========================= */
  useEffect(() => {
    if (!isValidObjectId(storeId)) {
      setError("Invalid Store ID");
      setLoading(false);
      return;
    }
    localStorage.setItem("currentStoreId", storeId);
    setLoading(true);
    setError(null);

    // Fetch store
    fetch(`${API_BASE}/stores/${storeId}`)
      .then(safeJsonParse)
      .then((data) => setStore(data.store))
      .catch((err) => {
        console.error("STORE FETCH ERROR:", err);
        setError(err.message);
      });

    // Fetch products
    getProductsByStore(storeId)
      .then((data) => {
        setProducts(data.products || []);

        // default variant = 1 kg or first available weight
        const initial = {};
        data.products?.forEach((p) => {
          initial[p._id] = p.availableWeights?.[0] || "1 kg";
        });
        setVariants(initial);
      })
      .catch((err) => {
        console.error("PRODUCT FETCH ERROR:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  /* =========================
     REAL-TIME INVENTORY
     ========================= */
  useEffect(() => {
    if (!isValidObjectId(storeId)) return;

    socket.emit("joinStore", storeId);

    socket.on("inventory:update", ({ productId, newStock }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, stock: newStock }
            : p
        )
      );
    });

    return () => socket.off("inventory:update");
  }, [storeId]);

  /* =========================
     HELPERS
     ========================= */
  const getDisplayPrice = (price, variant) => {
    if (variant === "250 g") return Math.round(price * 0.25);
    if (variant === "500 g") return Math.round(price * 0.5);
    return price; // 1 kg
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product) => {
    const variant = variants[product._id];
    addToCart(product, storeId, variant);
    refreshCart();
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl text-center shadow-sm max-w-md w-full">
          <p className="font-semibold text-lg mb-2">⚠️ Failed to load store products</p>
          <p className="text-sm opacity-90 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/stores")}
              className="bg-gray-250 hover:bg-gray-300 text-gray-700 font-medium text-xs px-4 py-2 rounded-lg transition border"
            >
              Back to Stores
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-700 font-medium">Loading store products...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 🏪 Store Header/Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{store?.name || "Loading Store..."}</h1>
            <p className="text-green-100 text-sm mt-1">{store?.address || "Hyperlocal Grocery Partner"}</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-green-500/30 text-white border border-green-400 px-3 py-1 rounded-full text-xs font-semibold">
              ⚡ Open
            </span>
            <span className="bg-green-500/30 text-white border border-green-400 px-3 py-1 rounded-full text-xs font-semibold">
              📍 Nearby
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* 🔝 Sticky Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
          <input
            type="text"
            placeholder="Search products in this store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-gray-700"
          />
        </div>

        {/* If Search Active, show products. Else, show categories */}
        {searchTerm ? (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Search Results ({filteredProducts.length})
            </h2>

            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 p-8 text-center bg-white rounded-xl shadow-sm">
                No matching products found.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => {
                  const selectedVariant = variants[p._id];
                  const added = isInCart(p._id, selectedVariant);

                  return (
                    <div
                      key={p._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-150 p-4 flex flex-col hover:shadow-md transition duration-150"
                    >
                      {/* 🖼 Image */}
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-32 w-full object-cover rounded-lg mb-2"
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/150")
                        }
                      />

                      {/* 📦 Name & Brand */}
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{p.brand || "Generic"}</span>
                      <h3 className="font-semibold text-gray-800 text-sm mt-0.5">{p.name}</h3>

                      {/* ⚖ Variant Selector */}
                      <div className="flex flex-wrap gap-1 my-2">
                        {(p.availableWeights || ["250 g", "500 g", "1 kg"]).map((v) => (
                          <button
                            key={v}
                            onClick={() =>
                              setVariants((prev) => ({
                                ...prev,
                                [p._id]: v,
                              }))
                            }
                            className={`px-2 py-0.5 text-xs rounded border transition duration-100 ${
                              selectedVariant === v
                                ? "bg-green-600 text-white border-green-600"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      {/* 💰 Price */}
                      <div className="mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600 font-bold text-base">
                            ₹{getDisplayPrice(p.price, selectedVariant)}
                          </span>
                          {p.mrp && p.mrp > p.price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{getDisplayPrice(p.mrp, selectedVariant)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          ₹{p.price} / {p.unit || "kg"}
                        </p>
                      </div>

                      {/* 📊 Stock */}
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        {p.stock > 0 ? `Only ${p.stock} left` : "Out of stock"}
                      </p>

                      {/* 🛒 Add */}
                      <button
                        disabled={p.stock === 0 || added}
                        onClick={() => handleAddToCart(p)}
                        className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition duration-150 ${
                          added
                            ? "bg-gray-150 text-gray-400 cursor-not-allowed border"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {added ? "✓ Added" : "Add to Cart"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {CATEGORIES_DATA.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}?storeId=${storeId}`)}
                  className={`cursor-pointer transform hover:-translate-y-1 hover:shadow-md transition-all duration-200 rounded-2xl p-4 bg-gradient-to-br ${cat.gradient} border flex flex-col items-center justify-center text-center h-28`}
                >
                  <span className="text-3xl mb-1">{cat.emoji}</span>
                  <span className={`font-semibold text-xs sm:text-sm tracking-wide ${cat.text}`}>
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 🧺 Sticky Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg border-t border-gray-800 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <span className="font-semibold text-sm">
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
            </span>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="bg-green-500 hover:bg-green-600 px-5 py-2 rounded-lg font-semibold text-sm transition duration-150 shadow"
          >
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}

export default Products;
