import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addToCart, increaseQty, decreaseQty, getCart } from "../utils/cart";
import { API_BASE_URL, SOCKET_URL } from "../config/api";
import { io } from "socket.io-client";

const API_BASE = API_BASE_URL;
const LOCAL_PLACEHOLDER = "/placeholder.svg";
const socket = io(SOCKET_URL);

const safeJsonParse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let errMessage = `Error ${res.status}: ${res.statusText}`;
    try {
      if (contentType.includes("application/json")) {
        const errData = await res.json();
        errMessage = errData.message || errMessage;
      }
    } catch (_) {}
    throw new Error(errMessage);
  }
  return res.json();
};

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState("1 kg");
  const [cartItems, setCartItems] = useState([]);

  const refreshCart = () => {
    setCartItems(getCart());
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("storage", refreshCart);
    return () => window.removeEventListener("storage", refreshCart);
  }, []);

  // Fetch product detail & related products
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/products/detail/${productId}`)
      .then(safeJsonParse)
      .then((data) => {
        const p = data.product;
        setProduct(p);
        setSelectedVariant(p.availableWeights?.[0] || "1 kg");
        
        // Fetch other products in the same store for related products
        if (p.storeId?._id) {
          fetch(`${API_BASE}/products/${p.storeId._id}`)
            .then(safeJsonParse)
            .then((storeData) => {
              // filter out current product
              const others = (storeData.products || []).filter(item => item._id !== p._id);
              setStoreProducts(others.slice(0, 4));
            })
            .catch(console.error);
        }
      })
      .catch((err) => {
        console.error("Error loading product detail:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Real-time stock sync
  useEffect(() => {
    if (!product || !product.storeId?._id) return;
    socket.emit("joinStore", product.storeId._id);

    socket.on("inventory:update", ({ productId: pId, newStock }) => {
      if (pId === productId) {
        setProduct(prev => prev ? { ...prev, stock: newStock } : null);
      }
    });

    return () => socket.off("inventory:update");
  }, [product, productId]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, product.storeId._id, selectedVariant);
    refreshCart();
  };

  const handleIncrease = () => {
    if (!product) return;
    increaseQty(product._id, selectedVariant);
    refreshCart();
  };

  const handleDecrease = () => {
    if (!product) return;
    decreaseQty(product._id, selectedVariant);
    refreshCart();
  };

  const getVariantPrice = (price, variant) => {
    if (variant === "250 g" || variant === "250 ml") return Math.round(price * 0.25);
    if (variant === "500 g" || variant === "500 ml") return Math.round(price * 0.5);
    return price; // 1 kg
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-3 text-center animate-pulse">
          <div className="h-10 w-10 bg-green-200 rounded-full mx-auto"></div>
          <p className="text-gray-500 font-bold text-xs">Fetching nutritional details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl max-w-md w-full text-center">
          <p className="font-extrabold text-lg mb-2">⚠️ Product Not Found</p>
          <p className="text-sm opacity-90 mb-6">{error || "The requested item is unavailable."}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const basePrice = product.price;
  const displayPrice = getVariantPrice(basePrice, selectedVariant);
  const displayMrp = product.mrp ? getVariantPrice(product.mrp, selectedVariant) : displayPrice;
  const discount = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

  // Cart item checks
  const cartItem = cartItems.find((i) => i._id === product._id && i.variant === selectedVariant);
  const qtyInCart = cartItem ? cartItem.qty : 0;

  // Mock specifications
  const specs = [
    { name: "Brand", value: product.brand || "Generic" },
    { name: "Unit", value: product.unit || "kg" },
    { name: "Fulfillment Store", value: product.storeId?.name || "Local Partner" },
    { name: "Shelf Life", value: product.category === "Fruits & Vegetables" ? "2-3 Days" : "6 Months" },
    { name: "Country of Origin", value: "India" }
  ];

  // Mock nutrition details based on category
  const nutrition = product.category === "Fruits & Vegetables" 
    ? [
        { name: "Energy", value: "45 kcal" },
        { name: "Carbohydrates", value: "10 g" },
        { name: "Dietary Fiber", value: "2.4 g" },
        { name: "Vitamin C", value: "15% DV" }
      ]
    : [
        { name: "Energy", value: "320 kcal" },
        { name: "Protein", value: "8.5 g" },
        { name: "Carbohydrates", value: "48 g" },
        { name: "Calcium", value: "12% DV" }
      ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-left">
      
      {/* breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <span className="cursor-pointer hover:underline" onClick={() => navigate("/")}>Home</span>
        <span>&gt;</span>
        <span className="cursor-pointer hover:underline" onClick={() => navigate(`/store/${product.storeId?._id}`)}>{product.storeId?.name || "Store"}</span>
        <span>&gt;</span>
        <span>{product.category}</span>
        <span>&gt;</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Gallery / Product Image Card */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm sticky top-24">
          <div className="aspect-square w-full rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden relative">
            <img
              src={product.image ? `${product.image}${product.image.includes("?") ? "&" : "?"}t=${new Date(product.updatedAt || Date.now()).getTime()}` : LOCAL_PLACEHOLDER}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = LOCAL_PLACEHOLDER;
              }}
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                {discount}% OFF
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            *Product images shown are for representation purposes only.
          </p>
        </div>

        {/* Product Details Section */}
        <div className="space-y-6">
          
          {/* Main Info */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{product.brand || "Generic"}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                4.3 ★
              </span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">120 Ratings</span>
            </div>

            {/* Weights Selector */}
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Unit/Weight</p>
              <div className="flex flex-wrap gap-2">
                {(product.availableWeights || ["250 g", "500 g", "1 kg"]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedVariant(w)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition ${
                      selectedVariant === w
                        ? "bg-green-600 text-white border-green-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Cart CTA */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
              <div className="flex flex-col">
                <div className="flex items-end gap-2">
                  <span className="text-green-600 font-black text-2xl leading-none">₹{displayPrice}</span>
                  {displayMrp > displayPrice && (
                    <span className="text-sm text-gray-400 line-through">₹{displayMrp}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Inclusive of all taxes</span>
              </div>

              <div>
                {product.stock === 0 ? (
                  <span className="bg-red-50 text-red-500 border border-red-200 px-6 py-2.5 rounded-xl font-bold text-sm">
                    Out of Stock
                  </span>
                ) : qtyInCart > 0 ? (
                  <div className="flex items-center bg-green-600 text-white font-extrabold text-sm rounded-xl shadow-md overflow-hidden">
                    <button onClick={handleDecrease} className="px-4 py-2.5 hover:bg-green-700 transition">
                      −
                    </button>
                    <span className="px-2 text-xs">{qtyInCart}</span>
                    <button onClick={handleIncrease} className="px-4 py-2.5 hover:bg-green-700 transition">
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm px-8 py-3 rounded-xl transition shadow-md"
                  >
                    ADD TO CART
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rapid Delivery Info */}
          <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-sm grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <span className="text-2xl">⚡</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Fulfillment</p>
              <p className="text-xs font-extrabold text-gray-800">{product.storeId?.name || "Nearby Partner"}</p>
            </div>
            <div className="space-y-1 border-x border-gray-100">
              <span className="text-2xl">⏱️</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Time</p>
              <p className="text-xs font-extrabold text-gray-800">{product.storeId ? product.storeId.deliveryRadius * 2 + 10 : "15"} Mins</p>
            </div>
            <div className="space-y-1">
              <span className="text-2xl">🍃</span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Quality</p>
              <p className="text-xs font-extrabold text-gray-800">100% Handpicked</p>
            </div>
          </div>

          {/* Description & Specifications */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 tracking-tight">Product Specifications</h3>
            
            <p className="text-sm text-gray-500 leading-relaxed">
              {product.description || `Enjoy fresh, high-quality ${product.name} sourced directly from our verified hyperlocal partner stores. Packed with care to maintain flavor, nutrient value, and freshness.`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {specs.map((s, idx) => (
                <div key={idx} className="flex justify-between border-b border-gray-50 pb-2 text-xs">
                  <span className="text-gray-400 font-bold uppercase tracking-wider">{s.name}</span>
                  <span className="text-gray-800 font-extrabold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-3">
            <h3 className="font-extrabold text-lg text-gray-800 tracking-tight">Nutritional Information</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">Approximate values per 100g serving</p>
            <div className="grid grid-cols-2 gap-3">
              {nutrition.map((n, idx) => (
                <div key={idx} className="flex justify-between bg-gray-50 p-2.5 rounded-xl text-xs">
                  <span className="text-gray-500 font-bold">{n.name}</span>
                  <span className="text-gray-800 font-extrabold">{n.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Products Carousel */}
          {storeProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-lg text-gray-800 tracking-tight">Frequently Bought Together</h3>
              <div className="grid grid-cols-2 gap-4">
                {storeProducts.map((p) => {
                  const pWeight = p.availableWeights?.[0] || "1 kg";
                  return (
                    <div
                      key={p._id}
                      onClick={() => navigate(`/product/${p._id}`)}
                      className="bg-white rounded-2xl border border-gray-150 p-3 flex flex-col justify-between hover:shadow-sm transition cursor-pointer"
                    >
                      <div className="h-24 w-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-50 mb-2">
                        <img
                          src={p.image ? `${p.image}${p.image.includes("?") ? "&" : "?"}t=${new Date(p.updatedAt || Date.now()).getTime()}` : LOCAL_PLACEHOLDER}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = LOCAL_PLACEHOLDER;
                          }}
                        />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs text-gray-800 truncate">{p.name}</h5>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{pWeight}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-green-600 font-extrabold text-sm">₹{p.price}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(p, product.storeId._id, pWeight);
                            refreshCart();
                          }}
                          className="border border-green-200 hover:bg-green-50 text-green-600 font-black text-[10px] px-3 py-1.5 rounded-xl transition"
                        >
                          + ADD
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}

export default ProductDetails;
