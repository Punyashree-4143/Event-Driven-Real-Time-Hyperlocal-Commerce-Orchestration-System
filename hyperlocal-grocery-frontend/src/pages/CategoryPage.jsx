import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, SOCKET_URL } from "../config/api";
import { addToCart } from "../utils/cart";
import { io } from "socket.io-client";

const isValidObjectId = (id) => {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
};

const API_BASE = API_BASE_URL;

const FALLBACK_TAXONOMY = {
  "Fruits & Vegetables": ["Fruits", "Vegetables", "Leafy Greens", "Exotic Fruits"],
  "Dairy & Breakfast": ["Milk", "Curd", "Butter", "Cheese", "Eggs"],
  "Snacks & Beverages": ["Chips", "Biscuits", "Chocolates", "Soft Drinks", "Juices", "Tea", "Coffee"],
  "Stationery": ["Pens", "Pencils", "Notebooks", "Office Supplies"],
  "Household Essentials": ["Pooja Needs", "Repellents", "Batteries & Bulbs", "Kitchenware", "Others"],
  "Cleaning Supplies": ["Detergents & Fabric Care", "Dishwashers", "Toilet & Floor Cleaners", "Garbage Bags & Clings", "Others"],
  "Personal Care": ["Soaps & Body Wash", "Shampoo & Conditioner", "Oral Care", "Skin Care & Lotions", "Others"],
  "Baby Care": ["Diapers & Wipes", "Baby Food & Formula", "Baby Bath & Skin Care", "Others"],
  "Pet Care": ["Dog Food", "Cat Food", "Pet Toys & Grooming", "Others"],
  "Frozen Foods": ["Frozen Veg Snacks", "Frozen Non-Veg Snacks", "Ice Creams & Desserts", "Others"],
  "Bakery": ["Cakes & Pastries", "Cookies & Biscuits", "Buns & Pavs", "Rusks & Khari", "Others"],
  "Meat & Seafood": ["Chicken & Poultry", "Fish & Seafood", "Mutton & Red Meat", "Others"],
  "Electronics": ["Mobile Accessories", "Cables & Chargers", "Small Appliances", "Others"],
  "Home & Kitchen": ["Cookware", "Kitchen Organizers", "Tableware", "Others"],
  "Others": ["General Grocery", "Miscellaneous"]
};

const CATEGORY_STYLE_MAP = {
  "Fruits & Vegetables": { emoji: "🍎🥦", banner: "from-green-600 to-emerald-700" },
  "Dairy & Breakfast": { emoji: "🥛🥞", banner: "from-yellow-50 to-amber-600" },
  "Snacks & Beverages": { emoji: "🍿🥤", banner: "from-red-500 to-orange-600" },
  "Stationery": { emoji: "✏️📓", banner: "from-slate-600 to-slate-700" },
  "Household Essentials": { emoji: "🕯️🔋", banner: "from-indigo-600 to-purple-700" },
  "Cleaning Supplies": { emoji: "🧹🧼", banner: "from-blue-500 to-sky-600" },
  "Personal Care": { emoji: "🧴🧼", banner: "from-pink-500 to-rose-600" },
  "Baby Care": { emoji: "👶🍼", banner: "from-purple-500 to-pink-500" },
  "Pet Care": { emoji: "🐶🐱", banner: "from-rose-500 to-red-600" },
  "Frozen Foods": { emoji: "❄️🍟", banner: "from-blue-600 to-indigo-700" },
  "Bakery": { emoji: "🍞🧁", banner: "from-amber-600 to-orange-600" },
  "Meat & Seafood": { emoji: "🥩🐟", banner: "from-red-600 to-rose-600" },
  "Electronics": { emoji: "🔌🔋", banner: "from-gray-600 to-gray-700" },
  "Home & Kitchen": { emoji: "🍳🏺", banner: "from-yellow-600 to-yellow-750" },
  "Others": { emoji: "📦🛒", banner: "from-emerald-600 to-teal-700" },
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

function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesTaxonomy, setCategoriesTaxonomy] = useState(FALLBACK_TAXONOMY);
  const [subCategory, setSubCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("relevance");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [brands, setBrands] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [variants, setVariants] = useState({});

  const categoryStyle = CATEGORY_STYLE_MAP[category] || { emoji: "📦🛒", banner: "from-green-600 to-emerald-700" };

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
     LOAD DATA
     ========================= */
  useEffect(() => {
    const sId = searchParams.get("storeId") || localStorage.getItem("currentStoreId");
    
    if (isValidObjectId(sId)) {
      setStoreId(sId);
      localStorage.setItem("currentStoreId", sId);

      // Fetch store details
      fetch(`${API_BASE}/stores/${sId}`)
        .then(safeJsonParse)
        .then((data) => setStore(data.store))
        .catch((err) => {
          console.error("Error loading store details:", err);
          setError(err.message);
        });
    } else {
      setStoreId(null);
      setStore(null);
    }

    // Fetch categories taxonomy
    fetch(`${API_BASE}/products/categories`)
      .then(safeJsonParse)
      .then((data) => {
        if (data.categories) setCategoriesTaxonomy(data.categories);
      })
      .catch((err) => {
        console.error("Error loading categories taxonomy:", err);
        setError(err.message);
      });
  }, [searchParams, navigate]);

  /* =========================
     FETCH PRODUCTS BY FILTERS
     ========================= */
  useEffect(() => {
    if (!isValidObjectId(storeId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Construct query parameters
    let url = `${API_BASE}/products/filter?category=${encodeURIComponent(category)}`;
    url += `&storeId=${storeId}`;

    if (subCategory !== "All") {
      url += `&subCategory=${encodeURIComponent(subCategory)}`;
    }
    if (isFeaturedOnly) {
      url += `&isFeatured=true`;
    }
    if (minPrice) {
      url += `&minPrice=${minPrice}`;
    }
    if (maxPrice) {
      url += `&maxPrice=${maxPrice}`;
    }
    if (sort !== "relevance") {
      url += `&sort=${sort}`;
    }

    console.log("Current URL:", window.location.href);
    console.log("Current storeId:", storeId);
    console.log("Fetch URL:", url);

    fetch(url)
      .then(safeJsonParse)
      .then((data) => {
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);

        // Get unique brands
        const uniqueBrands = ["All", ...new Set(fetchedProducts.map(p => p.brand).filter(Boolean))];
        setBrands(uniqueBrands);

        // Init default variants
        const initial = {};
        fetchedProducts.forEach((p) => {
          initial[p._id] = p.availableWeights?.[0] || "1 kg";
        });
        setVariants(initial);
      })
      .catch((err) => {
        console.error("Error filtering products:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [storeId, category, subCategory, sort, minPrice, maxPrice, isFeaturedOnly]);

  /* =========================
     REAL-TIME SOCKETS
     ========================= */
  useEffect(() => {
    if (!isValidObjectId(storeId)) return;

    const socket = io(SOCKET_URL);
    socket.emit("joinStore", storeId);

    socket.on("inventory:update", ({ productId, newStock }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, stock: newStock } : p
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [storeId]);

  /* =========================
     HELPERS
     ========================= */
  const getDisplayPrice = (price, variant) => {
    if (variant === "250 g") return Math.round(price * 0.25);
    if (variant === "500 g") return Math.round(price * 0.5);
    return price; // 1 kg
  };

  const handleAddToCart = (product) => {
    const variant = variants[product._id];
    addToCart(product, storeId, variant);
    refreshCart();
  };

  // Inline Search Filter on name, brand, subcategory
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subCategory?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = selectedBrand === "All" || p.brand === selectedBrand;

    return matchesSearch && matchesBrand;
  });

  const subCategoriesList = ["All", ...(categoriesTaxonomy[category] || [])];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 🏞️ Category Banner */}
      <div className={`bg-gradient-to-r ${categoryStyle.banner} text-white p-6 shadow-md`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold opacity-85">
              <span>Stores</span>
              <span>&gt;</span>
              <span className="cursor-pointer hover:underline" onClick={() => navigate(`/store/${storeId}`)}>
                {store?.name || "Store"}
              </span>
              <span>&gt;</span>
              <span>{category}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-3">
              <span>{categoryStyle.emoji}</span>
              <span>{category}</span>
            </h1>
          </div>
          <button
            onClick={() => navigate(`/store/${storeId}`)}
            className="self-start md:self-auto bg-white/20 hover:bg-white/30 text-white border border-white/40 px-4 py-1.5 rounded-lg text-sm font-semibold transition duration-150"
          >
            ← Back to Store
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* 🏷️ Subcategory Chips */}
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
          {subCategoriesList.map((sub) => (
            <button
              key={sub}
              onClick={() => setSubCategory(sub)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium border transition-all duration-150 ${
                subCategory === sub
                  ? "bg-green-600 text-white border-green-600 shadow"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* 🛠️ Toolbar: Search, Sort, Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder={`Search in ${category}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700"
            />
          </div>

          {/* Sort dropdown */}
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700 bg-white"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>

          {/* Brand dropdown */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700 bg-white"
            >
              <option value="All">Brand: All</option>
              {brands.filter(b => b !== "All").map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Advanced Filter: Min Price, Max Price, Featured */}
          <div className="md:col-span-4 border-t pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Min Price:</span>
              <input
                type="number"
                placeholder="₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-20 px-2 py-1 border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">Max Price:</span>
              <input
                type="number"
                placeholder="₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-20 px-2 py-1 border rounded-lg text-xs"
              />
            </div>

            <div className="col-span-2 sm:col-span-2 flex justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeaturedOnly}
                  onChange={(e) => setIsFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-xs font-semibold text-gray-700">★ Featured Products Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* 🛒 Products Grid */}
        {error ? (
          <div className="text-center p-12 bg-red-50 border border-red-200 text-red-800 rounded-2xl shadow-sm">
            <p className="font-semibold text-lg">⚠️ Failed to load products</p>
            <p className="text-sm mt-1 opacity-90">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                setSubCategory("All");
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl shadow-sm border">
            <p className="text-gray-500 font-medium">No products found matching the criteria.</p>
          </div>
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
                      (e.target.src = "https://via.placeholder.com/150")
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

export default CategoryPage;
