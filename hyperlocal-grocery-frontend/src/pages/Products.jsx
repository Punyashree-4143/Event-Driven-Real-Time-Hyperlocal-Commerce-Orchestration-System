import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../services/api";
import { addToCart, increaseQty, decreaseQty, getCart } from "../utils/cart";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config/api";

const API_BASE = API_BASE_URL;
const LOCAL_PLACEHOLDER = "/placeholder.svg";
const socket = io(SOCKET_URL);

const CATEGORIES_ICONS = {
  "Fruits & Vegetables": "🍎",
  "Dairy & Breakfast": "🥛",
  "Snacks & Beverages": "🍿",
  "Frozen Foods": "❄️",
  "Bakery": "🍞",
  "Personal Care": "🧴",
  "Household Essentials": "🕯️",
  "Cleaning Supplies": "🧹",
  "Others": "📦"
};

const isValidObjectId = (id) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

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

function Products() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  
  // Dynamic Catalog Taxonomy States
  const [categoriesTaxonomy, setCategoriesTaxonomy] = useState([]);
  const [subCategoriesTaxonomy, setSubCategoriesTaxonomy] = useState([]);
  const [productTypesTaxonomy, setProductTypesTaxonomy] = useState([]);

  // Selected Catalog Filters
  const [selectedCatId, setSelectedCatId] = useState("All");
  const [selectedSubCatId, setSelectedSubCatId] = useState("All");
  const [selectedTypeId, setSelectedTypeId] = useState("All");

  const [variants, setVariants] = useState({});

  const refreshCart = () => {
    setCartItems(getCart());
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("storage", refreshCart);
    return () => window.removeEventListener("storage", refreshCart);
  }, []);

  // Fetch store, products, and dynamic catalog taxonomy
  useEffect(() => {
    if (!isValidObjectId(storeId)) {
      setError("Invalid Store ID");
      setLoading(false);
      return;
    }
    localStorage.setItem("currentStoreId", storeId);
    setLoading(true);
    setError(null);

    // 1. Fetch Store Details
    fetch(`${API_BASE}/stores/${storeId}`)
      .then(safeJsonParse)
      .then((data) => setStore(data.store))
      .catch((err) => {
        console.error("Store Fetch Error:", err);
        setError(err.message);
      });

    // 2. Fetch Store Taxonomy Catalog
    fetch(`${API_BASE}/catalog/store-catalog?storeId=${storeId}`)
      .then(safeJsonParse)
      .then((data) => {
        setCategoriesTaxonomy(data.categories || []);
        setSubCategoriesTaxonomy(data.subcategories || []);
        setProductTypesTaxonomy(data.producttypes || []);
      })
      .catch((err) => {
        console.error("Catalog Fetch Error:", err);
      });

    // 3. Fetch Products
    getProductsByStore(storeId)
      .then((data) => {
        const storeProducts = data.products || [];
        setProducts(storeProducts);

        // default variants setup
        const initial = {};
        storeProducts.forEach((p) => {
          initial[p._id] = p.availableWeights?.[0] || "1 kg";
        });
        setVariants(initial);
      })
      .catch((err) => {
        console.error("Products Fetch Error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // Real-time stock sync
  useEffect(() => {
    if (!isValidObjectId(storeId)) return;
    socket.emit("joinStore", storeId);

    socket.on("inventory:update", ({ productId, newStock }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, stock: newStock } : p
        )
      );
    });

    return () => socket.off("inventory:update");
  }, [storeId]);

  const handleAddToCart = (product, variant) => {
    addToCart(product, storeId, variant);
    refreshCart();
  };

  const handleIncrease = (productId, variant) => {
    increaseQty(productId, variant);
    refreshCart();
  };

  const handleDecrease = (productId, variant) => {
    decreaseQty(productId, variant);
    refreshCart();
  };

  const getVariantPrice = (price, variant) => {
    if (variant === "250 g" || variant === "250 ml") return Math.round(price * 0.25);
    if (variant === "500 g" || variant === "500 ml") return Math.round(price * 0.5);
    return price; // 1 kg
  };

  // Group products by Category for the "All" view (respecting search query and displaying active categories only)
  const getGroupedProducts = () => {
    const grouped = {};
    products.forEach((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchesSearch) {
        const catName = p.category || "Others";
        if (!grouped[catName]) {
          grouped[catName] = [];
        }
        grouped[catName].push(p);
      }
    });
    return grouped;
  };

  // Generate categories list dynamically from product data to avoid empty/Others fallback issues
  const uniqueCategories = [];
  const categoryMap = new Map();

  products.forEach((p) => {
    const catName = p.category || "Others";
    if (!categoryMap.has(catName)) {
      const taxonomyCat = categoriesTaxonomy.find(c => c.name === catName || c._id === p.categoryId);
      const catObj = {
        _id: taxonomyCat ? taxonomyCat._id : (p.categoryId || catName),
        name: catName,
        icon: taxonomyCat ? taxonomyCat.icon : ""
      };
      categoryMap.set(catName, catObj);
      uniqueCategories.push(catObj);
    }
  });

  uniqueCategories.sort((a, b) => {
    const taxA = categoriesTaxonomy.find(c => c.name === a.name);
    const taxB = categoriesTaxonomy.find(c => c.name === b.name);
    if (taxA && taxB) return taxA.displayOrder - taxB.displayOrder;
    if (taxA) return -1;
    if (taxB) return 1;
    return 0;
  });

  const selectedCategoryName = (() => {
    if (selectedCatId === "All") return "All";
    const found = uniqueCategories.find(c => c._id === selectedCatId || c.name === selectedCatId);
    return found ? found.name : "All";
  })();

  const getActiveSubCategories = () => {
    if (selectedCatId === "All") return [];
    
    const subMap = new Map();
    const subs = [];
    
    products.forEach((p) => {
      const matchesCat = p.categoryId === selectedCatId || p.category === selectedCategoryName;
      if (matchesCat && p.subCategory) {
        const subName = p.subCategory;
        if (!subMap.has(subName)) {
          const taxonomySub = subCategoriesTaxonomy.find(s => s.name === subName || s._id === p.subCategoryId);
          const subObj = {
            _id: taxonomySub ? taxonomySub._id : (p.subCategoryId || subName),
            name: subName,
            categoryId: selectedCatId
          };
          subMap.set(subName, subObj);
          subs.push(subObj);
        }
      }
    });
    
    return subs;
  };

  const getActiveProductTypes = () => {
    if (selectedSubCatId === "All") return [];
    
    const selectedSub = getActiveSubCategories().find(s => s._id === selectedSubCatId || s.name === selectedSubCatId);
    const selectedSubName = selectedSub ? selectedSub.name : "";
    
    const typeMap = new Map();
    const types = [];
    
    products.forEach((p) => {
      const matchesCat = p.categoryId === selectedCatId || p.category === selectedCategoryName;
      const matchesSub = p.subCategoryId === selectedSubCatId || p.subCategory === selectedSubName;
      
      if (matchesCat && matchesSub && p.productTypeId) {
        const taxonomyType = productTypesTaxonomy.find(t => t._id === p.productTypeId.toString());
        if (taxonomyType) {
          const typeName = taxonomyType.name;
          if (!typeMap.has(typeName)) {
            typeMap.set(typeName, taxonomyType);
            types.push(taxonomyType);
          }
        }
      }
    });
    
    return types;
  };

  // Filter products for category-specific view (while respecting subcat, type, and search)
  const getSpecificFilteredProducts = () => {
    return products.filter((p) => {
      const matchesCat = 
        selectedCatId === "All" || 
        !p.categoryId || 
        !p.category || 
        p.categoryId === selectedCatId || 
        p.category === selectedCategoryName;
      
      const selectedSub = getActiveSubCategories().find(s => s._id === selectedSubCatId || s.name === selectedSubCatId);
      const selectedSubName = selectedSub ? selectedSub.name : "";
      const matchesSub = 
        selectedSubCatId === "All" || 
        !p.subCategoryId || 
        !p.subCategory || 
        p.subCategoryId === selectedSubCatId || 
        p.subCategory === selectedSubName;
      
      const matchesType = 
        selectedTypeId === "All" || 
        !p.productTypeId || 
        p.productTypeId === selectedTypeId;

      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || "").toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCat && matchesSub && matchesType && matchesSearch;
    });
  };

  const groupedCatalog = getGroupedProducts();
  const specificProductsList = getSpecificFilteredProducts();
  const activeSubCategories = getActiveSubCategories();
  const activeProductTypes = getActiveProductTypes();

  // Console log details before rendering as requested by user
  console.log("--- BEFORE RENDER ---");
  products.forEach((p) => {
    console.log(`Product: "${p.name}" | Category: "${p.category}" | SubCategory: "${p.subCategory}"`);
  });
  console.log("Grouped Categories:", Object.keys(groupedCatalog));
  console.log("---------------------");

  // Debug catalog trace logs
  console.log("=== DEBUG CATALOG FLOW ===");
  console.log("API Response Categories:", categoriesTaxonomy);
  console.log("API Response Subcategories:", subCategoriesTaxonomy);
  console.log("API Response Product Types:", productTypesTaxonomy);
  console.log("Products after fetch:", products);
  console.log("Selected Category ID:", selectedCatId);
  console.log("Selected Subcategory ID:", selectedSubCatId);
  console.log("Selected Product Type ID:", selectedTypeId);
  console.log("Search Term:", searchTerm);
  console.log("Products grouped (All view):", groupedCatalog);
  console.log("Products filtered (Specific view):", specificProductsList);
  console.log("==========================");

  const renderProductCard = (p, isCarouselItem = false) => {
    const selectedVariant = variants[p._id] || "1 kg";
    const displayPrice = getVariantPrice(p.price, selectedVariant);
    const displayMrp = p.mrp ? getVariantPrice(p.mrp, selectedVariant) : displayPrice;
    const discount = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

    // Cart check
    const cartItem = cartItems.find((i) => i._id === p._id && i.variant === selectedVariant);
    const qtyInCart = cartItem ? cartItem.qty : 0;

    return (
      <div
        key={p._id}
        onClick={() => navigate(`/product/${p._id}`)}
        className={`bg-white rounded-2xl border border-gray-150 p-4 flex flex-col justify-between hover:shadow-md transition duration-150 cursor-pointer relative text-left ${
          isCarouselItem ? "w-44 sm:w-48 shrink-0" : ""
        }`}
      >
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
            {discount}% OFF
          </span>
        )}

        {/* Image */}
        <div className="h-28 w-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-55 mb-2.5">
          <img
            src={p.image ? `${p.image}${p.image.includes("?") ? "&" : "?"}t=${new Date(p.updatedAt || Date.now()).getTime()}` : LOCAL_PLACEHOLDER}
            alt={p.name}
            className="h-full w-full object-cover transform hover:scale-105 transition duration-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = LOCAL_PLACEHOLDER;
            }}
          />
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{p.brand || "Generic"}</span>
          <h4 className="font-extrabold text-xs text-gray-800 line-clamp-2 h-8 leading-tight">{p.name}</h4>
        </div>

        {/* Weights selector */}
        <div className="flex flex-wrap gap-1 my-2">
          {(p.availableWeights || ["250 g", "500 g", "1 kg"]).map((w) => (
            <button
              key={w}
              onClick={(e) => {
                e.stopPropagation();
                setVariants((prev) => ({ ...prev, [p._id]: w }));
              }}
              className={`px-1.5 py-0.5 text-[9px] font-bold rounded-lg border transition ${
                selectedVariant === w
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-550 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-green-650 font-extrabold text-sm leading-none">₹{displayPrice}</span>
            {displayMrp > displayPrice && (
              <span className="text-[10px] text-gray-450 line-through mt-0.5">₹{displayMrp}</span>
            )}
          </div>

          {p.stock === 0 ? (
            <span className="text-[10px] font-bold text-red-500">Out of Stock</span>
          ) : qtyInCart > 0 ? (
            <div 
              className="flex items-center bg-green-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleDecrease(p._id, selectedVariant)}
                className="px-2.5 py-1.5 hover:bg-green-700 transition"
              >
                −
              </button>
              <span className="px-1">{qtyInCart}</span>
              <button
                onClick={() => handleIncrease(p._id, selectedVariant)}
                className="px-2.5 py-1.5 hover:bg-green-700 transition"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(p, selectedVariant);
              }}
              className="bg-white hover:bg-green-50 text-green-600 border border-green-200 hover:border-green-300 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl transition duration-100 shadow-sm"
            >
              + ADD
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-550 font-bold text-sm">Opening store shelves...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-8 rounded-2xl max-w-md w-full text-center shadow-sm">
          <p className="font-extrabold text-lg mb-2">⚠️ Store Offline</p>
          <p className="text-sm opacity-90 mb-6">{error}</p>
          <button
            onClick={() => navigate("/stores")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
          >
            Back to Stores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-left">
      
      {/* 🏪 STORE BANNER HEADER */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white py-8 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-green-200">
              <span className="cursor-pointer hover:underline" onClick={() => navigate("/")}>Home</span>
              <span>&gt;</span>
              <span>Stores</span>
              <span>&gt;</span>
              <span className="text-white">{store?.name}</span>
            </div>
            <h1 className="text-3xl font-black mt-2 tracking-tight">{store?.name}</h1>
            <p className="text-green-100 text-xs font-semibold mt-1">📍 {store?.address}</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <span className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              ⭐ {store?.rating || "4.5"} Rating
            </span>
            <span className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              ⚡ Delivery in {store?.deliveryTime || "30 mins"}
            </span>
            <span className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1">
              📍 {(store?.distance ? store.distance / 1000 : 0.5).toFixed(1)} km away
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 LAYOUT GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar Categories (Desktop) */}
        <aside className="w-full lg:w-64 shrink-0 hidden lg:block space-y-2">
          <h3 className="font-extrabold text-sm text-gray-500 uppercase tracking-wider px-3 mb-4">Categories</h3>
          
          <button
            onClick={() => {
              setSelectedCatId("All");
              setSelectedSubCatId("All");
              setSelectedTypeId("All");
            }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition duration-150 ${
              selectedCatId === "All"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-150"
            }`}
          >
            <span className="text-lg">📦</span>
            <span>All Categories</span>
          </button>

          {uniqueCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => {
                setSelectedCatId(cat._id);
                setSelectedSubCatId("All");
                setSelectedTypeId("All");
              }}
              className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition duration-150 ${
                selectedCatId === cat._id
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-150"
              }`}
            >
              <span className="text-lg">{cat.icon || CATEGORIES_ICONS[cat.name] || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </aside>

        {/* Mobile Horizontal Categories */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCatId("All");
              setSelectedSubCatId("All");
              setSelectedTypeId("All");
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-extrabold border flex items-center gap-1.5 transition ${
              selectedCatId === "All"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-250 hover:bg-gray-50"
            }`}
          >
            <span>📦</span>
            <span>All</span>
          </button>

          {uniqueCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => {
                setSelectedCatId(cat._id);
                setSelectedSubCatId("All");
                setSelectedTypeId("All");
              }}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-extrabold border flex items-center gap-1.5 transition ${
                selectedCatId === cat._id
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-250 hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon || CATEGORIES_ICONS[cat.name] || "📦"}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Right Main Panel */}
        <main className="flex-1 space-y-6">
          
          {/* SEARCH & SUBCATEGORIES TOOLBAR */}
          <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder={
                  selectedCatId === "All"
                    ? `Search inside ${store?.name}...`
                    : `Search in ${categoriesTaxonomy.find(c => c._id === selectedCatId)?.name}...`
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-55 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition text-gray-700"
              />
            </div>

            {/* Subcategory chips (Shown only when in specific category view) */}
            {selectedCatId !== "All" && activeSubCategories.length > 0 && (
              <div className="space-y-3.5">
                <div className="flex gap-2 overflow-x-auto pt-1 scrollbar-hide border-b pb-2 border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedSubCatId("All");
                      setSelectedTypeId("All");
                    }}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold border transition ${
                      selectedSubCatId === "All"
                        ? "bg-green-50 text-green-700 border-green-300"
                        : "bg-white text-gray-650 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    All Subcategories
                  </button>

                  {activeSubCategories.map((sub) => (
                    <button
                      key={sub._id}
                      onClick={() => {
                        setSelectedSubCatId(sub._id);
                        setSelectedTypeId("All");
                      }}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-bold border transition ${
                        selectedSubCatId === sub._id
                          ? "bg-green-50 text-green-700 border-green-300"
                          : "bg-white text-gray-655 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>

                {/* Product Type chips (Shown only when specific subcategory is selected) */}
                {selectedSubCatId !== "All" && activeProductTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5 animate-fadeIn">
                    <button
                      onClick={() => setSelectedTypeId("All")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                        selectedTypeId === "All"
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      All Types
                    </button>

                    {activeProductTypes.map((type) => (
                      <button
                        key={type._id}
                        onClick={() => setSelectedTypeId(type._id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                          selectedTypeId === type._id
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* MAIN CATALOG DISPLAY */}
          {selectedCatId === "All" ? (
            
            /* ================================================= */
            /* 1. ALL TAB - PRODUCT CATEGORIES CAROUSELS         */
            /* ================================================= */
            Object.keys(groupedCatalog).length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-150">
                <p className="text-gray-500 font-semibold">No items match your search.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(groupedCatalog).map((catName) => {
                  const catProductsList = groupedCatalog[catName];
                  const matchingCat = categoriesTaxonomy.find(c => c.name === catName);
                  
                  return (
                    <div key={catName} className="space-y-3.5 bg-white p-5 rounded-3xl border border-gray-150 shadow-sm">
                      
                      {/* Section Header */}
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-1.5">
                          <span className="text-lg">{matchingCat?.icon || CATEGORIES_ICONS[catName] || "📦"}</span>
                          <span>{catName}</span>
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                            {catProductsList.length}
                          </span>
                        </h3>
                        <button
                          onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            params.set("storeId", storeId);
                            navigate(`/category/${encodeURIComponent(catName)}?${params.toString()}`);
                          }}
                          className="text-xs font-black text-green-650 hover:text-green-700 hover:underline flex items-center gap-0.5"
                        >
                          View All <span className="text-sm">→</span>
                        </button>
                      </div>

                      {/* Horizontal product list scroll */}
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {catProductsList.slice(0, 8).map((p) => renderProductCard(p, true))}
                      </div>

                    </div>
                  );
                })}
              </div>
            )

          ) : (

            /* ================================================= */
            /* 2. SPECIFIC CATEGORY TAB - GRID LAYOUT            */
            /* ================================================= */
            specificProductsList.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-gray-150">
                <p className="text-gray-500 font-semibold">No items found in this section.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {specificProductsList.map((p) => renderProductCard(p, false))}
              </div>
            )

          )}

        </main>
      </div>

    </div>
  );
}

export default Products;
