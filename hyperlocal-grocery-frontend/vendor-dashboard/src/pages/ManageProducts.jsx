import React, { useEffect, useState, useContext } from "react";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

function ManageProducts() {
  const { store } = useContext(StoreContext);
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;
  const LOCAL_PLACEHOLDER = "/placeholder.svg";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state: All, Low Stock, Out of Stock, Archived, Active
  const [filterType, setFilterType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Bulk selections state
  const [selectedIds, setSelectedIds] = useState([]);

  // Audit history logs
  const [historyLog, setHistoryLog] = useState([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState("Inventory");

  /* ======================================================
     CATALOG MANAGEMENT STATES
     ====================================================== */
  const [activeCatalogTab, setActiveCatalogTab] = useState("Products");
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogSubCategories, setCatalogSubCategories] = useState([]);
  const [catalogProductTypes, setCatalogProductTypes] = useState([]);

  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedSubCatId, setSelectedSubCatId] = useState("");

  const [searchCat, setSearchCat] = useState("");
  const [searchSub, setSearchSub] = useState("");
  const [searchType, setSearchType] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  const [editingCatalogItem, setEditingCatalogItem] = useState(null); // { id, name }

  const fetchProducts = async () => {
    if (!store) return;
    try {
      const res = await fetch(`${API_BASE}/products/${store._id}`);
      if (!res.ok) throw new Error("Failed to load catalog");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     CATALOG FETCH OPERATIONS
     ====================================================== */
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/catalog/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.categories || [];
      setCatalogCategories(list);
      if (list.length > 0 && !selectedCatId) {
        setSelectedCatId(list[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubCategories = async () => {
    if (!selectedCatId) return;
    try {
      const res = await fetch(`${API_BASE}/catalog/categories/${selectedCatId}/subcategories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.subcategories || [];
      setCatalogSubCategories(list);
      if (list.length > 0) {
        setSelectedSubCatId(list[0]._id);
      } else {
        setSelectedSubCatId("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProductTypes = async () => {
    if (!selectedSubCatId) return;
    try {
      const res = await fetch(`${API_BASE}/catalog/subcategories/${selectedSubCatId}/product-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCatalogProductTypes(data.producttypes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    const saved = localStorage.getItem(`audit_history_${store?._id}`);
    if (saved) setHistoryLog(JSON.parse(saved));
  }, [store]);

  // Load Subcategories when category selection changes
  useEffect(() => {
    if (selectedCatId) {
      fetchSubCategories();
    } else {
      setCatalogSubCategories([]);
    }
    setSelectedSubCatId("");
  }, [selectedCatId]);

  // Load Product Types when subcategory selection changes
  useEffect(() => {
    if (selectedSubCatId) {
      fetchProductTypes();
    } else {
      setCatalogProductTypes([]);
    }
  }, [selectedSubCatId]);

  const addHistoryEntry = (action) => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      action
    };
    const nextLog = [entry, ...historyLog].slice(0, 30);
    setHistoryLog(nextLog);
    localStorage.setItem(`audit_history_${store?._id}`, JSON.stringify(nextLog));
  };

  const getSafeProduct = (p) => ({
    ...p,
    brand: p.brand || "Generic",
    mrp: p.mrp || p.price || 0,
    sellingPrice: p.sellingPrice || p.price || 0,
    sku: p.sku || "N/A",
    barcode: p.barcode || "N/A",
    isAvailable: p.isAvailable !== false,
    isFeatured: p.isFeatured || false
  });

  const updateProduct = async (id, updates, logMsg) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        if (logMsg) addHistoryEntry(logMsg);
        fetchProducts();
      } else {
        alert("Failed to update product details.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name} permanently?`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        addHistoryEntry(`Permanently deleted ${name}`);
        setSelectedIds(prev => prev.filter(item => item !== id));
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
          sku: safeP.sku !== "N/A" ? `${safeP.sku}-COPY` : "",
          barcode: safeP.barcode !== "N/A" ? safeP.barcode : "",
          categoryId: safeP.categoryId,
          subCategoryId: safeP.subCategoryId,
          productTypeId: safeP.productTypeId
        })
      });

      if (res.ok) {
        addHistoryEntry(`Duplicated item ${safeP.name}`);
        fetchProducts();
      } else {
        alert("Failed to duplicate product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filters & searches
  const processedProducts = products.map(getSafeProduct).filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterType === "Low Stock") matchesFilter = p.stock > 0 && p.stock <= 5;
    else if (filterType === "Out of Stock") matchesFilter = p.stock === 0;
    else if (filterType === "Archived") matchesFilter = !p.isAvailable;
    else if (filterType === "Active") matchesFilter = p.isAvailable && p.stock > 0;

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Checkbox functions
  const toggleSelectAll = () => {
    if (selectedIds.length === processedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedProducts.map(p => p._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk operations execution
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${selectedIds.length} selected products?`)) return;

    setLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) count++;
      } catch (err) {
        console.error(err);
      }
    }
    addHistoryEntry(`Bulk deleted ${count} products.`);
    setSelectedIds([]);
    await fetchProducts();
  };

  const executeBulkArchive = async (archiveState) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isAvailable: !archiveState })
        });
        if (res.ok) count++;
      } catch (err) {
        console.error(err);
      }
    }
    addHistoryEntry(`Bulk ${archiveState ? "archived" : "restored"} ${count} products.`);
    setSelectedIds([]);
    await fetchProducts();
  };

  const executeBulkFeature = async (featureState) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isFeatured: featureState })
        });
        if (res.ok) count++;
      } catch (err) {
        console.error(err);
      }
    }
    addHistoryEntry(`Bulk ${featureState ? "featured" : "unfeatured"} ${count} products.`);
    setSelectedIds([]);
    await fetchProducts();
  };

  const executeBulkStockAdjustment = async () => {
    if (selectedIds.length === 0) return;
    const value = prompt("Enter stock value to assign to all selected items (or e.g. +10, -5 to adjust relative):");
    if (value === null || value.trim() === "") return;

    setLoading(true);
    let count = 0;
    const isRelative = value.startsWith("+") || value.startsWith("-");
    const delta = Number(value);

    for (const id of selectedIds) {
      try {
        const prod = products.find(p => p._id === id);
        if (!prod) continue;
        const nextStock = isRelative ? Math.max(0, prod.stock + delta) : Math.max(0, delta);

        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ stock: nextStock })
        });
        if (res.ok) count++;
      } catch (err) {
        console.error(err);
      }
    }
    addHistoryEntry(`Bulk adjusted stock for ${count} products by value "${value}".`);
    setSelectedIds([]);
    await fetchProducts();
  };

  // Classified logs splits
  const displayedLogs = historyLog.filter(h => {
    const action = h.action.toLowerCase();
    const isPrice = action.includes("price") || action.includes("mrp") || action.includes("cost") || action.includes("rate");
    if (activeHistoryTab === "Price") return isPrice;
    return !isPrice;
  });

  /* ======================================================
     CATALOG MANAGEMENT CRUD ACTIONS
     ====================================================== */
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/catalog/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName })
      });
      if (res.ok) {
        setNewCatName("");
        fetchCategories();
        addHistoryEntry(`Added category "${newCatName}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedCatId) return;

    try {
      const res = await fetch(`${API_BASE}/catalog/subcategories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ categoryId: selectedCatId, name: newSubName })
      });
      if (res.ok) {
        setNewSubName("");
        fetchSubCategories();
        addHistoryEntry(`Added subcategory "${newSubName}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProductType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim() || !selectedSubCatId) return;

    try {
      const res = await fetch(`${API_BASE}/catalog/product-types`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subCategoryId: selectedSubCatId, name: newTypeName })
      });
      if (res.ok) {
        setNewTypeName("");
        fetchProductTypes();
        addHistoryEntry(`Added product type "${newTypeName}"`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCatalogEdit = async (type, id) => {
    if (!editingCatalogItem || !editingCatalogItem.name.trim()) return;

    try {
      const url = `${API_BASE}/catalog/${
        type === "category" ? "categories" : type === "subcategory" ? "subcategories" : "product-types"
      }/${id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingCatalogItem.name })
      });

      if (res.ok) {
        addHistoryEntry(`Renamed ${type} to "${editingCatalogItem.name}"`);
        setEditingCatalogItem(null);
        if (type === "category") fetchCategories();
        else if (type === "subcategory") fetchSubCategories();
        else if (type === "product-type") fetchProductTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (type, id, currentActive) => {
    try {
      const url = `${API_BASE}/catalog/${
        type === "category" ? "categories" : type === "subcategory" ? "subcategories" : "product-types"
      }/${id}`;

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentActive })
      });

      if (res.ok) {
        addHistoryEntry(`${currentActive ? "Hid" : "Showed"} ${type}`);
        if (type === "category") fetchCategories();
        else if (type === "subcategory") fetchSubCategories();
        else if (type === "product-type") fetchProductTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCatalogItem = async (type, id, displayName) => {
    const confirmationMsg = 
      type === "category" 
        ? `Deleting "${displayName}" category will cascade delete all its subcategories and product types. Proceed?`
        : `Delete "${displayName}"?`;

    if (!window.confirm(confirmationMsg)) return;

    try {
      const url = `${API_BASE}/catalog/${
        type === "category" ? "categories" : type === "subcategory" ? "subcategories" : "product-types"
      }/${id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        addHistoryEntry(`Deleted ${type} "${displayName}"`);
        if (type === "category") {
          fetchCategories();
          setSelectedCatId("");
        } else if (type === "subcategory") {
          fetchSubCategories();
          setSelectedSubCatId("");
        } else if (type === "product-type") {
          fetchProductTypes();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCatalogReorder = async (type, index, direction, items) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const id1 = items[index]._id;
    const id2 = items[targetIndex]._id;

    try {
      const res = await fetch(`${API_BASE}/catalog/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type, id1, id2 })
      });

      if (res.ok) {
        addHistoryEntry(`Reordered ${type}`);
        if (type === "category") fetchCategories();
        else if (type === "subcategory") fetchSubCategories();
        else if (type === "producttype") fetchProductTypes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-55 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Filter lists for quick catalog views
  const filteredCatList = catalogCategories.filter(c => c.name.toLowerCase().includes(searchCat.toLowerCase()));
  const filteredSubList = catalogSubCategories.filter(s => s.name.toLowerCase().includes(searchSub.toLowerCase()));
  const filteredTypesList = catalogProductTypes.filter(t => t.name.toLowerCase().includes(searchType.toLowerCase()));

  return (
    <div className="p-6 text-left bg-gray-55 min-h-screen space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Inventory & Catalog Control</h1>
          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Spreadsheet stock manager & taxonomy settings</p>
        </div>
      </div>

      {/* TOP TABS SELECTOR */}
      <div className="flex border-b text-xs font-black uppercase tracking-wider border-gray-150">
        {["Products", "Categories", "SubCategories", "Product Types"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCatalogTab(tab)}
            className={`px-6 py-2.5 transition border-b-2 ${
              activeCatalogTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABS CONTENT RENDERING */}
      <div className="space-y-6">

        {/* PRODUCTS TAB */}
        {activeCatalogTab === "Products" && (
          <div className="space-y-6">
            {/* QUICK STATUS BAR */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setFilterType("All"); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border transition ${
                  filterType === "All" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-650 hover:bg-gray-150 border-gray-255"
                }`}
              >
                All Items ({products.length})
              </button>

              <button
                onClick={() => { setFilterType("Low Stock"); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border transition flex items-center gap-1.5 ${
                  filterType === "Low Stock" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-650 hover:bg-gray-150 border-gray-255"
                }`}
              >
                ⚠️ Low Stock ({lowStockCount})
              </button>

              <button
                onClick={() => { setFilterType("Out of Stock"); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border transition flex items-center gap-1.5 ${
                  filterType === "Out of Stock" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-650 hover:bg-gray-150 border-gray-255"
                }`}
              >
                🚫 Out of Stock ({outOfStockCount})
              </button>

              <button
                onClick={() => { setFilterType("Archived"); setSelectedIds([]); }}
                className={`px-4 py-2 rounded-2xl text-xs font-black uppercase border transition ${
                  filterType === "Archived" ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-650 hover:bg-gray-150 border-gray-255"
                }`}
              >
                📦 Archived ({products.filter(p => !p.isAvailable).length})
              </button>
            </div>

            {/* BULK ACTIONS TOOLBAR */}
            {selectedIds.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
                <div>
                  <p className="text-xs font-black text-emerald-800">🛠️ Bulk Action Toolbar</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">{selectedIds.length} items checked</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <button
                    onClick={executeBulkStockAdjustment}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => executeBulkFeature(true)}
                    className="bg-white hover:bg-gray-100 text-gray-755 border px-3.5 py-2 rounded-lg transition"
                  >
                    Feature
                  </button>
                  <button
                    onClick={() => executeBulkFeature(false)}
                    className="bg-white hover:bg-gray-100 text-gray-755 border px-3.5 py-2 rounded-lg transition"
                  >
                    Unfeature
                  </button>
                  <button
                    onClick={() => executeBulkArchive(true)}
                    className="bg-white hover:bg-gray-100 text-gray-755 border px-3.5 py-2 rounded-lg transition"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => executeBulkArchive(false)}
                    className="bg-white hover:bg-gray-100 text-gray-755 border px-3.5 py-2 rounded-lg transition"
                  >
                    Restore
                  </button>
                  <button
                    onClick={executeBulkDelete}
                    className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 px-3.5 py-2 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* SPREADSHEET TABLE & CLASS HISTORY LOGS */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
              
              {/* Spreadsheet Inventory Table */}
              <div className="xl:col-span-3 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
                
                <input
                  type="text"
                  placeholder="Search spreadsheet by Name, Brand, SKU ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-55 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-400 font-black uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={processedProducts.length > 0 && selectedIds.length === processedProducts.length}
                            onChange={toggleSelectAll}
                            className="w-3.5 h-3.5 text-green-655 border-gray-350 rounded focus:ring-green-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Image</th>
                        <th className="p-3">Product Name / SKU</th>
                        <th className="p-3 w-24">MRP (₹)</th>
                        <th className="p-3 w-24">Selling (₹)</th>
                        <th className="p-3 w-32 text-center">Stock</th>
                        <th className="p-3 text-center">Featured</th>
                        <th className="p-3 text-center">Archive</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedProducts.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-8 text-center text-gray-400 font-semibold">
                            No items match your active filters.
                          </td>
                        </tr>
                      ) : (
                        processedProducts.map((p) => {
                          const isLow = p.stock > 0 && p.stock <= 5;
                          const isOut = p.stock === 0;

                          return (
                            <tr key={p._id} className="border-b hover:bg-gray-50/50 transition">
                              
                              {/* Checkbox */}
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(p._id)}
                                  onChange={() => toggleSelect(p._id)}
                                  className="w-3.5 h-3.5 text-green-655 border-gray-350 rounded focus:ring-green-500 cursor-pointer"
                                />
                              </td>

                              {/* Image */}
                              <td className="p-3">
                                  <img
                                    src={p.image || LOCAL_PLACEHOLDER}
                                    alt={p.name}
                                    className="w-10 h-10 object-cover rounded-lg bg-gray-50 border"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = LOCAL_PLACEHOLDER;
                                    }}
                                  />
                              </td>

                              {/* Name & SKU */}
                              <td className="p-3">
                                <p className="font-extrabold text-gray-800 line-clamp-1">{p.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">SKU: {p.sku} • Barcode: {p.barcode}</p>
                              </td>

                              {/* MRP input */}
                              <td className="p-3">
                                <input
                                  type="number"
                                  defaultValue={p.mrp}
                                  onBlur={(e) => {
                                    const nextMrp = Number(e.target.value);
                                    if (nextMrp !== p.mrp) {
                                      updateProduct(p._id, { mrp: nextMrp }, `Updated MRP of ${p.name} to ₹${nextMrp}`);
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border rounded-lg text-center outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                                />
                              </td>

                              {/* Selling Price input */}
                              <td className="p-3">
                                <input
                                  type="number"
                                  defaultValue={p.sellingPrice}
                                  onBlur={(e) => {
                                    const nextPrice = Number(e.target.value);
                                    if (nextPrice !== p.sellingPrice) {
                                      updateProduct(p._id, { sellingPrice: nextPrice, price: nextPrice }, `Updated price of ${p.name} to ₹${nextPrice}`);
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border rounded-lg text-center outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-650"
                                />
                              </td>

                              {/* Stock adjustments */}
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      const nextStock = Math.max(0, p.stock - 1);
                                      updateProduct(p._id, { stock: nextStock }, `Decreased stock of ${p.name} to ${nextStock}`);
                                    }}
                                    disabled={p.stock <= 0}
                                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-250 flex items-center justify-center font-extrabold transition disabled:opacity-50"
                                  >
                                    −
                                  </button>

                                  <input
                                    type="number"
                                    value={p.stock}
                                    onChange={(e) => {
                                      const nextStock = Number(e.target.value);
                                      if (!isNaN(nextStock) && nextStock >= 0) {
                                        updateProduct(p._id, { stock: nextStock }, `Directly adjusted stock of ${p.name} to ${nextStock}`);
                                      }
                                    }}
                                    className={`w-12 py-1 border rounded-lg text-center outline-none font-bold text-[11px] ${
                                      isOut ? "border-red-300 bg-red-50 text-red-700" : isLow ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200"
                                    }`}
                                  />

                                  <button
                                    onClick={() => {
                                      const nextStock = p.stock + 1;
                                      updateProduct(p._id, { stock: nextStock }, `Increased stock of ${p.name} to ${nextStock}`);
                                    }}
                                    className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-250 flex items-center justify-center font-extrabold transition"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* Featured */}
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    const nextFeatured = !p.isFeatured;
                                    updateProduct(p._id, { isFeatured: nextFeatured }, `${nextFeatured ? "Featured" : "Unfeatured"} product ${p.name}`);
                                  }}
                                  className={`text-lg transition ${p.isFeatured ? "text-amber-500 scale-110" : "text-gray-300 hover:text-amber-400"}`}
                                >
                                  ★
                                </button>
                              </td>

                              {/* Archive / Active toggle */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!p.isAvailable}
                                  onChange={(e) => {
                                    const archiveStatus = e.target.checked;
                                    updateProduct(
                                      p._id,
                                      { isAvailable: !archiveStatus },
                                      `${archiveStatus ? "Archived" : "Restored"} product ${p.name}`
                                    );
                                  }}
                                  className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                              </td>

                              {/* Quick actions */}
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-[9px] font-black uppercase tracking-wider">
                                  <button
                                    onClick={() => handleDuplicate(p)}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-lg transition"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p._id, p.name)}
                                    className="bg-red-50 hover:bg-red-100 text-red-755 border border-red-200 px-2 py-1 rounded-lg transition"
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic classified logs */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
                
                {/* Logs Tabs */}
                <div className="flex border-b text-[10px] font-black uppercase tracking-wider border-gray-150">
                  <button
                    onClick={() => setActiveHistoryTab("Inventory")}
                    className={`w-1/2 text-center pb-2 transition border-b-2 ${
                      activeHistoryTab === "Inventory" ? "border-green-600 text-green-700" : "border-transparent text-gray-400"
                    }`}
                  >
                    📦 Stock Log
                  </button>
                  <button
                    onClick={() => setActiveHistoryTab("Price")}
                    className={`w-1/2 text-center pb-2 transition border-b-2 ${
                      activeHistoryTab === "Price" ? "border-green-600 text-green-700" : "border-transparent text-gray-400"
                    }`}
                  >
                    ₹ Price Log
                  </button>
                </div>
                
                {displayedLogs.length === 0 ? (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center py-6">
                    No modifications recorded.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                    {displayedLogs.map((h, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-55 rounded-xl border border-gray-150 text-[10px]">
                        <p className="font-black text-gray-700 leading-snug">{h.action}</p>
                        <p className="text-[8px] text-gray-455 font-bold uppercase mt-0.5">🕒 {h.timestamp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeCatalogTab === "Categories" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">📁 Categories Taxonomy Control</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Configure store categories</p>
            </div>

            <div className="space-y-4">
              {/* Quick Add Form */}
              <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="New Category Name (e.g. Fruits & Vegetables)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl">
                  Add
                </button>
              </form>

              {/* Search filter */}
              <input
                type="text"
                placeholder="Search categories..."
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-xs border rounded-xl outline-none"
              />

              {/* List */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y text-xs">
                {filteredCatList.length === 0 ? (
                  <p className="p-4 text-gray-400 font-bold">No categories registered.</p>
                ) : (
                  filteredCatList.map((cat, idx) => (
                    <div key={cat._id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-55/40">
                      {editingCatalogItem && editingCatalogItem.id === cat._id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingCatalogItem.name}
                            onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, name: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                          <button onClick={() => handleSaveCatalogEdit("category", cat._id)} className="text-green-650 font-bold">Save</button>
                          <button onClick={() => setEditingCatalogItem(null)} className="text-gray-400">Cancel</button>
                        </div>
                      ) : (
                        <span className={`font-extrabold ${cat.isActive ? "text-gray-800" : "text-gray-450 line-through decoration-gray-400"}`}>
                          {cat.name} {!cat.isActive && <span className="text-[9px] font-black uppercase text-red-500 border border-red-200 px-1 py-0.5 rounded ml-1.5">Hidden</span>}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCatalogReorder("category", idx, "up", filteredCatList)}
                            disabled={idx === 0}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleCatalogReorder("category", idx, "down", filteredCatList)}
                            disabled={idx === filteredCatList.length - 1}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => handleToggleActive("category", cat._id, cat.isActive)}
                          className={`font-bold hover:underline ${cat.isActive ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {cat.isActive ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => setEditingCatalogItem({ id: cat._id, name: cat.name })}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogItem("category", cat._id, cat.name)}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBCATEGORIES TAB */}
        {activeCatalogTab === "SubCategories" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">📁 Subcategories Taxonomy Control</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Configure store subcategories</p>
            </div>

            <div className="space-y-4">
              {/* Select Category */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Parent Category:</span>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="px-3 py-1.5 text-xs border rounded-xl font-bold text-gray-700 outline-none"
                >
                  {catalogCategories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Quick Add Form */}
              <form onSubmit={handleAddSubCategory} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="New Subcategory Name (e.g. Fresh Fruits)"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                  disabled={!selectedCatId}
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl" disabled={!selectedCatId}>
                  Add
                </button>
              </form>

              {/* Search filter */}
              <input
                type="text"
                placeholder="Search subcategories..."
                value={searchSub}
                onChange={(e) => setSearchSub(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-xs border rounded-xl outline-none"
              />

              {/* List */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y text-xs">
                {filteredSubList.length === 0 ? (
                  <p className="p-4 text-gray-400 font-bold">No subcategories registered under this category.</p>
                ) : (
                  filteredSubList.map((sub, idx) => (
                    <div key={sub._id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-55/40">
                      {editingCatalogItem && editingCatalogItem.id === sub._id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingCatalogItem.name}
                            onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, name: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                          <button onClick={() => handleSaveCatalogEdit("subcategory", sub._id)} className="text-green-650 font-bold">Save</button>
                          <button onClick={() => setEditingCatalogItem(null)} className="text-gray-400">Cancel</button>
                        </div>
                      ) : (
                        <span className={`font-extrabold ${sub.isActive ? "text-gray-800" : "text-gray-450 line-through decoration-gray-400"}`}>
                          {sub.name} {!sub.isActive && <span className="text-[9px] font-black uppercase text-red-500 border border-red-200 px-1 py-0.5 rounded ml-1.5">Hidden</span>}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCatalogReorder("subcategory", idx, "up", filteredSubList)}
                            disabled={idx === 0}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleCatalogReorder("subcategory", idx, "down", filteredSubList)}
                            disabled={idx === filteredSubList.length - 1}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => handleToggleActive("subcategory", sub._id, sub.isActive)}
                          className={`font-bold hover:underline ${sub.isActive ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {sub.isActive ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => setEditingCatalogItem({ id: sub._id, name: sub.name })}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogItem("subcategory", sub._id, sub.name)}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT TYPES TAB */}
        {activeCatalogTab === "Product Types" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">📁 Product Types Taxonomy Control</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Configure store product types</p>
            </div>

            <div className="space-y-4">
              {/* Select Parent Category & Subcategory */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Category:</span>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="px-3 py-1.5 text-xs border rounded-xl font-bold text-gray-700 outline-none"
                  >
                    {catalogCategories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Subcategory:</span>
                  <select
                    value={selectedSubCatId}
                    onChange={(e) => setSelectedSubCatId(e.target.value)}
                    className="px-3 py-1.5 text-xs border rounded-xl font-bold text-gray-700 outline-none"
                    disabled={!selectedCatId}
                  >
                    {catalogSubCategories.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Add Form */}
              <form onSubmit={handleAddProductType} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="New Product Type (e.g. Mozzarella Cheese)"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                  required
                  disabled={!selectedSubCatId}
                />
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl" disabled={!selectedSubCatId}>
                  Add
                </button>
              </form>

              {/* Search filter */}
              <input
                type="text"
                placeholder="Search product types..."
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-xs border rounded-xl outline-none"
              />

              {/* List */}
              <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y text-xs">
                {filteredTypesList.length === 0 ? (
                  <p className="p-4 text-gray-400 font-bold">No product types registered under this subcategory.</p>
                ) : (
                  filteredTypesList.map((type, idx) => (
                    <div key={type._id} className="p-3 flex justify-between items-center bg-white hover:bg-gray-55/50">
                      {editingCatalogItem && editingCatalogItem.id === type._id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingCatalogItem.name}
                            onChange={(e) => setEditingCatalogItem({ ...editingCatalogItem, name: e.target.value })}
                            className="px-2 py-1 border rounded"
                          />
                          <button onClick={() => handleSaveCatalogEdit("product-type", type._id)} className="text-green-655 font-bold">Save</button>
                          <button onClick={() => setEditingCatalogItem(null)} className="text-gray-400">Cancel</button>
                        </div>
                      ) : (
                        <span className={`font-extrabold ${type.isActive ? "text-gray-800" : "text-gray-450 line-through decoration-gray-400"}`}>
                          {type.name} {!type.isActive && <span className="text-[9px] font-black uppercase text-red-500 border border-red-200 px-1 py-0.5 rounded ml-1.5">Hidden</span>}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCatalogReorder("producttype", idx, "up", filteredTypesList)}
                            disabled={idx === 0}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleCatalogReorder("producttype", idx, "down", filteredTypesList)}
                            disabled={idx === filteredTypesList.length - 1}
                            className="px-1.5 py-0.5 border rounded disabled:opacity-50 font-bold bg-gray-50 hover:bg-gray-100"
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          onClick={() => handleToggleActive("product-type", type._id, type.isActive)}
                          className={`font-bold hover:underline ${type.isActive ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          {type.isActive ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => setEditingCatalogItem({ id: type._id, name: type.name })}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogItem("product-type", type._id, type.name)}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ManageProducts;
