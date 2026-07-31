import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

function ProductsList() {
  const navigate = useNavigate();
  const { store } = useContext(StoreContext);
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;
  const LOCAL_PLACEHOLDER = "/placeholder.svg";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    categoriesCount: 0,
    featured: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // Category list loaded dynamically for filters
  const [storeCategoriesList, setStoreCategoriesList] = useState([]);
  const [storeSubCategoriesList, setStoreSubCategoriesList] = useState([]);

  // Expandable Category Group Accordion States
  const [expandedCategories, setExpandedCategories] = useState({});

  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSubCategory, setFilterSubCategory] = useState("All");
  const [filterStockStatus, setFilterStockStatus] = useState("All");
  const [filterFeatured, setFilterFeatured] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Edit Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Edit Modal cascading states
  const [editCats, setEditCats] = useState([]);
  const [editSubs, setEditSubs] = useState([]);
  const [editTypes, setEditTypes] = useState([]);

  const fetchProducts = async () => {
    if (!store) return;
    try {
      const res = await fetch(`${API_BASE}/products/${store._id}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      const list = data.products || [];
      setProducts(list);
      computeStats(list);
    } catch (err) {
      console.error("Error loading vendor products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreTaxonomy = async () => {
    if (!store) return;
    try {
      const res = await fetch(`${API_BASE}/catalog/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStoreCategoriesList(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch subcategories when filter category changes
  useEffect(() => {
    if (!store) return;
    if (filterCategory === "All") {
      setStoreSubCategoriesList([]);
      return;
    }
    const catObj = storeCategoriesList.find(c => c.name === filterCategory);
    if (!catObj) return;

    const fetchSubs = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/categories/${catObj._id}/subcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStoreSubCategoriesList(data.subcategories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubs();
  }, [filterCategory, storeCategoriesList]);

  useEffect(() => {
    fetchProducts();
    fetchStoreTaxonomy();
  }, [store]);

  // Reset pagination on filter or search updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterSubCategory, filterStockStatus, filterFeatured, sortBy]);

  // Dynamic Edit Modal loading
  useEffect(() => {
    if (!isEditOpen || !editForm) return;

    const loadEditTaxonomy = async () => {
      try {
        // 1. Load Categories
        const catRes = await fetch(`${API_BASE}/catalog/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const catData = await catRes.json();
        const catsList = catData.categories || [];
        setEditCats(catsList);

        // Find current category ID
        let currentCatId = editForm.categoryId;
        if (!currentCatId && editForm.category) {
          const match = catsList.find(c => c.name === editForm.category);
          if (match) currentCatId = match._id;
        }

        if (currentCatId) {
          // 2. Load Subcategories
          const subRes = await fetch(`${API_BASE}/catalog/categories/${currentCatId}/subcategories`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const subData = await subRes.json();
          const subsList = subData.subcategories || [];
          setEditSubs(subsList);

          // Find current subcategory ID
          let currentSubId = editForm.subCategoryId;
          if (!currentSubId && editForm.subCategory) {
            const match = subsList.find(s => s.name === editForm.subCategory);
            if (match) currentSubId = match._id;
          }

          if (currentSubId) {
            // 3. Load Product Types
            const typeRes = await fetch(`${API_BASE}/catalog/subcategories/${currentSubId}/product-types`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const typeData = await typeRes.json();
            setEditTypes(typeData.producttypes || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadEditTaxonomy();
  }, [isEditOpen]);

  // Handle category change in Edit Form
  const handleEditCatChange = async (catId) => {
    setEditForm(prev => ({ 
      ...prev, 
      categoryId: catId, 
      category: editCats.find(c => c._id === catId)?.name || "",
      subCategoryId: null,
      subCategory: "",
      productTypeId: null
    }));
    setEditTypes([]);

    try {
      const res = await fetch(`${API_BASE}/catalog/categories/${catId}/subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.subcategories || [];
      setEditSubs(list);
      if (list.length > 0) {
        handleEditSubChange(list[0]._id, list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubChange = async (subId, customList) => {
    const list = customList || editSubs;
    setEditForm(prev => ({
      ...prev,
      subCategoryId: subId,
      subCategory: list.find(s => s._id === subId)?.name || "",
      productTypeId: null
    }));

    try {
      const res = await fetch(`${API_BASE}/catalog/subcategories/${subId}/product-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const listTypes = data.producttypes || [];
      setEditTypes(listTypes);
      if (listTypes.length > 0) {
        setEditForm(prev => ({ ...prev, productTypeId: listTypes[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const computeStats = (list) => {
    const total = list.length;
    const cats = new Set(list.map(p => p.category).filter(Boolean)).size;
    const featured = list.filter(p => p.isFeatured).length;
    const lowStock = list.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = list.filter(p => p.stock === 0).length;

    setStats({ total, categoriesCount: cats, featured, lowStock, outOfStock });

    const expanded = {};
    list.forEach(p => {
      if (p.category) expanded[p.category] = true;
    });
    setExpandedCategories(expanded);
  };

  const getSafeProduct = (p) => ({
    ...p,
    brand: p.brand || "Generic",
    mrp: p.mrp || p.price || 0,
    sellingPrice: p.sellingPrice || p.price || 0,
    subCategory: p.subCategory || "General",
    unit: p.unit || "unit",
    availableWeights: p.availableWeights || ["1 unit"],
    deliveryTime: p.deliveryTime || "30 mins",
    isFeatured: p.isFeatured || false,
    isAvailable: p.isAvailable !== false
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (p) => {
    const safeP = getSafeProduct(p);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${safeP.name} (Copy)`,
          brand: safeP.brand,
          mrp: safeP.mrp,
          sellingPrice: safeP.sellingPrice,
          price: safeP.sellingPrice,
          category: safeP.category,
          subCategory: safeP.subCategory,
          description: safeP.description || "",
          stock: safeP.stock,
          image: safeP.image || "",
          unit: safeP.unit,
          availableWeights: safeP.availableWeights,
          deliveryTime: safeP.deliveryTime,
          isFeatured: safeP.isFeatured,
          isAvailable: safeP.isAvailable,
          categoryId: safeP.categoryId,
          subCategoryId: safeP.subCategoryId,
          productTypeId: safeP.productTypeId
        })
      });

      if (res.ok) {
        fetchProducts();
      } else {
        alert("Failed to duplicate product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (p) => {
    navigate(`/products/add?edit=${p._id}`);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm) return;

    try {
      const res = await fetch(`${API_BASE}/products/${editForm._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          brand: editForm.brand,
          mrp: Number(editForm.mrp),
          sellingPrice: Number(editForm.sellingPrice),
          price: Number(editForm.sellingPrice),
          category: editForm.category,
          subCategory: editForm.subCategory,
          description: editForm.description,
          stock: Number(editForm.stock),
          image: editForm.image,
          unit: editForm.unit,
          availableWeights: typeof editForm.availableWeights === "string" 
            ? editForm.availableWeights.split(",").map(w => w.trim()).filter(Boolean)
            : editForm.availableWeights,
          deliveryTime: editForm.deliveryTime,
          isFeatured: editForm.isFeatured,
          isAvailable: editForm.isAvailable,
          categoryId: editForm.categoryId || null,
          subCategoryId: editForm.subCategoryId || null,
          productTypeId: editForm.productTypeId || null
        })
      });

      if (res.ok) {
        setIsEditOpen(false);
        fetchProducts();
      } else {
        alert("Failed to update product details.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Run Filtering & Sorting
  const processedProducts = products.map(getSafeProduct).filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesSub = filterSubCategory === "All" || p.subCategory === filterSubCategory;

    let matchesStock = true;
    if (filterStockStatus === "In Stock") matchesStock = p.stock > 5;
    else if (filterStockStatus === "Low Stock") matchesStock = p.stock > 0 && p.stock <= 5;
    else if (filterStockStatus === "Out of Stock") matchesStock = p.stock === 0;

    let matchesFeatured = true;
    if (filterFeatured === "Featured") matchesFeatured = p.isFeatured;
    else if (filterFeatured === "Regular") matchesFeatured = !p.isFeatured;

    return matchesSearch && matchesCategory && matchesSub && matchesStock && matchesFeatured;
  }).sort((a, b) => {
    if (sortBy === "Newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "Oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "PriceAsc") return a.sellingPrice - b.sellingPrice;
    if (sortBy === "PriceDesc") return b.sellingPrice - a.sellingPrice;
    if (sortBy === "StockAsc") return a.stock - b.stock;
    if (sortBy === "StockDesc") return b.stock - a.stock;
    if (sortBy === "Alphabetical") return a.name.localeCompare(b.name);
    return 0;
  });

  // Paginated Slice
  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSlice = processedProducts.slice(startIndex, startIndex + itemsPerPage);

  // Group paginated items by Category
  const groupedProducts = {};
  paginatedSlice.forEach((p) => {
    const cat = p.category || "Others";
    if (!groupedProducts[cat]) groupedProducts[cat] = [];
    groupedProducts[cat].push(p);
  });

  return (
    <div className="p-6 space-y-6 text-left bg-gray-55 min-h-screen font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Inventory Console</h1>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Store: {store?.name}</p>
        </div>
        <Link
          to="/products/add"
          className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-sm transition"
        >
          + Add New Product
        </Link>
      </div>

      {/* 📊 INVENTORY STATS DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Products</span>
          <p className="text-2xl font-black text-gray-800">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Categories</span>
          <p className="text-2xl font-black text-gray-855">{stats.categoriesCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Featured Items</span>
          <p className="text-2xl font-black text-blue-600">{stats.featured}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Low Stock (≤5)</span>
          <p className="text-2xl font-black text-orange-600">{stats.lowStock}</p>
          {stats.lowStock > 0 && <span className="absolute right-3 top-3 animate-ping h-2 w-2 rounded-full bg-orange-400"></span>}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Out of Stock</span>
          <p className="text-2xl font-black text-red-500">{stats.outOfStock}</p>
        </div>

      </div>

      {/* 🔍 SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        <div className="lg:col-span-2 relative">
          <input
            type="text"
            placeholder="Search by Name, Brand, SKU ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Dynamic Category Filter */}
        <select
          className="px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-705"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setFilterSubCategory("All");
          }}
        >
          <option value="All">All Categories</option>
          {storeCategoriesList.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        {/* Dynamic Subcategory Filter */}
        <select
          className="px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-705"
          value={filterSubCategory}
          onChange={(e) => setFilterSubCategory(e.target.value)}
          disabled={filterCategory === "All"}
        >
          <option value="All">All Subcategories</option>
          {storeSubCategoriesList.map(sub => (
            <option key={sub._id} value={sub.name}>{sub.name}</option>
          ))}
        </select>

        <select
          className="px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-705"
          value={filterStockStatus}
          onChange={(e) => setFilterStockStatus(e.target.value)}
        >
          <option value="All">All Stock Levels</option>
          <option value="In Stock">In Stock (&gt;5)</option>
          <option value="Low Stock">Low Stock (1-5)</option>
          <option value="Out of Stock">Out of Stock (=0)</option>
        </select>

        <select
          className="px-3.5 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-705"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="Newest">Sort: Newest First</option>
          <option value="Oldest">Sort: Oldest First</option>
          <option value="PriceAsc">Price: Low to High</option>
          <option value="PriceDesc">Price: High to Low</option>
          <option value="StockAsc">Stock: Low to High</option>
          <option value="StockDesc">Stock: High to Low</option>
          <option value="Alphabetical">Sort: Alphabetical</option>
        </select>

      </div>

      {/* Accordion Group Listing */}
      {processedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-550">
          No inventory products match your active search filters.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedProducts).map((catName) => {
            const list = groupedProducts[catName];
            const isExpanded = expandedCategories[catName];

            return (
              <div key={catName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div 
                  onClick={() => toggleCategory(catName)}
                  className="p-4 flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 border-b cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-800">{catName}</span>
                    <span className="bg-gray-200 text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {list.length} {list.length === 1 ? "product" : "products"}
                    </span>
                  </div>
                  <span className="text-gray-400 font-bold text-xs">{isExpanded ? "▲ Hide" : "▼ Expand"}</span>
                </div>

                {isExpanded && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {list.map((p) => {
                      const discount = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
                      return (
                        <div 
                          key={p._id}
                          className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition relative text-left bg-white"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase">{p.brand}</span>
                            {p.isFeatured && (
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Featured
                              </span>
                            )}
                          </div>

                          <div className="h-28 w-full bg-gray-55 rounded-xl flex items-center justify-center overflow-hidden mb-3">
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

                          <div className="space-y-0.5">
                            <h4 className="font-black text-xs text-gray-800 line-clamp-2 h-8 leading-tight">{p.name}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{p.subCategory}</p>
                          </div>

                          <div className="my-2.5 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-550">Stock:</span>
                              <span className={p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-orange-655" : "text-green-600"}>
                                {p.stock} {p.unit}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${p.stock === 0 ? "bg-red-500" : p.stock <= 5 ? "bg-orange-500" : "bg-green-550"}`}
                                style={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline mt-1 border-t pt-2 border-gray-50">
                            <div className="flex flex-col">
                              <span className="text-green-600 font-black text-sm">₹{p.sellingPrice}</span>
                              {p.mrp > p.sellingPrice && (
                                <span className="text-[10px] text-gray-450 line-through">MRP: ₹{p.mrp}</span>
                              )}
                            </div>
                            {discount > 0 && (
                              <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 border-t pt-3 mt-3.5 text-center text-[10px] font-bold uppercase tracking-wider">
                            <button 
                              onClick={() => handleOpenEdit(p)}
                              className="bg-gray-150 hover:bg-gray-250 text-gray-700 py-1.5 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDuplicate(p)}
                              className="bg-green-55 hover:bg-green-100 border border-green-200 text-green-700 py-1.5 rounded-lg transition"
                            >
                              Copy
                            </button>
                            <button 
                              onClick={() => handleDelete(p._id)}
                              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-655 py-1.5 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold font-sans uppercase"
          >
            Previous
          </button>
          <span className="text-xs font-bold font-sans text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold font-sans uppercase"
          >
            Next
          </button>
        </div>
      )}

      {/* 📝 INLINE EDIT MODAL WITH CASCADING TAXONOMY */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-lg font-black text-gray-800">✏️ Edit Product Details</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-655 font-bold text-sm">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Product Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Brand</label>
                <input
                  type="text"
                  value={editForm.brand}
                  onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Dynamic Edit Category */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Category *</label>
                <select
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-700"
                  value={editForm.categoryId || ""}
                  onChange={(e) => handleEditCatChange(e.target.value)}
                  required
                >
                  {editCats.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Edit Subcategory */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Subcategory</label>
                <select
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-700"
                  value={editForm.subCategoryId || ""}
                  onChange={(e) => handleEditSubChange(e.target.value)}
                  disabled={editSubs.length === 0}
                >
                  <option value="">-- No Subcategory --</option>
                  {editSubs.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Edit Product Type */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Product Type</label>
                <select
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-700"
                  value={editForm.productTypeId || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, productTypeId: e.target.value }))}
                  disabled={editTypes.length === 0}
                >
                  <option value="">-- No Product Type --</option>
                  {editTypes.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  value={editForm.mrp}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mrp: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  value={editForm.sellingPrice}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Stock Quantity *</label>
                <div className="flex border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 text-xs outline-none"
                    required
                  />
                  <span className="bg-gray-150 border-l px-3.5 py-2 text-xs font-bold text-gray-550 uppercase">{editForm.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Delivery Time *</label>
                <input
                  type="text"
                  value={editForm.deliveryTime}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Image URL</label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Available Weights (Comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editForm.availableWeights) ? editForm.availableWeights.join(", ") : editForm.availableWeights}
                  onChange={(e) => setEditForm(prev => ({ ...prev, availableWeights: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.isFeatured}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-xs font-bold text-gray-700 uppercase">Featured Item</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.isAvailable}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="w-4 h-4 text-green-655 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-xs font-bold text-gray-700 uppercase">Available for sale</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full sm:col-span-2 bg-green-600 hover:bg-green-700 text-white font-extrabold py-3.5 rounded-2xl transition shadow-md text-xs mt-4"
              >
                Save Changes
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductsList;
