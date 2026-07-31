import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

function AddProduct() {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;
  const LOCAL_PLACEHOLDER = "/placeholder.svg";

  // Taxonomy states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);

  // Selected taxonomy IDs
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedSubCatId, setSelectedSubCatId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");

  // Product common form states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("kg");
  const [deliveryTime, setDeliveryTime] = useState("30 mins");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");

  // Product details
  const [shelfLife, setShelfLife] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");

  // Nutrition Facts (Food Categories)
  const [nutrition, setNutrition] = useState({
    energy: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sugar: "",
    sodium: "",
    vitaminC: "",
    calcium: "",
    iron: ""
  });

  // Multiple Images & Gallery states
  const [imagesList, setImagesList] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activePreviewImage, setActivePreviewImage] = useState("");

  // Single pricing states (used only if variants are disabled)
  const [hasVariants, setHasVariants] = useState(false);
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [availableWeightsInput, setAvailableWeightsInput] = useState("1 kg");

  // Variant Editor states
  const [variantsList, setVariantsList] = useState([]);
  const [variantWeight, setVariantWeight] = useState("500g");
  const [customWeightInput, setCustomWeightInput] = useState("");
  const [variantMrp, setVariantMrp] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [editingVariantIdx, setEditingVariantIdx] = useState(null);

  // Dynamic Custom Fields state
  const [customAttributes, setCustomAttributes] = useState({});

  // Flag to hold the original product model for initialization safety
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch Categories
  useEffect(() => {
    if (!store) return;
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const list = data.categories || [];
        setCategories(list);
        if (list.length > 0 && !editId) {
          setSelectedCatId(list[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, [store, editId]);

  // Fetch Subcategories
  useEffect(() => {
    if (!selectedCatId) {
      setSubCategories([]);
      return;
    }
    const fetchSubs = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/categories/${selectedCatId}/subcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const list = data.subcategories || [];
        setSubCategories(list);
        
        if (editingProduct && editingProduct.categoryId === selectedCatId && editingProduct.subCategoryId) {
          setSelectedSubCatId(editingProduct.subCategoryId);
        } else if (list.length > 0) {
          setSelectedSubCatId(list[0]._id);
        } else {
          setSelectedSubCatId("");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubs();
  }, [selectedCatId, editingProduct]);

  // Fetch Product Types
  useEffect(() => {
    if (!selectedSubCatId) {
      setProductTypes([]);
      return;
    }
    const fetchTypes = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalog/subcategories/${selectedSubCatId}/product-types`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const list = data.producttypes || [];
        setProductTypes(list);

        if (editingProduct && editingProduct.subCategoryId === selectedSubCatId && editingProduct.productTypeId) {
          setSelectedTypeId(editingProduct.productTypeId);
        } else if (list.length > 0) {
          setSelectedTypeId(list[0]._id);
        } else {
          setSelectedTypeId("");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTypes();
  }, [selectedSubCatId, editingProduct]);

  // Fetch Product Details for Edit Mode
  useEffect(() => {
    if (!editId) return;
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/detail/${editId}`);
        const data = await res.json();
        if (res.ok && data.product) {
          const p = data.product;
          setEditingProduct(p);
          setName(p.name || "");
          setBrand(p.brand || "");
          setDescription(p.description || "");
          setUnit(p.unit || "kg");
          setDeliveryTime(p.deliveryTime || "30 mins");
          setIsFeatured(p.isFeatured || false);
          setIsAvailable(p.isAvailable !== false);
          setSku(p.sku || "");
          setBarcode(p.barcode || "");
          setImagesList(p.images || []);
          setActivePreviewImage(p.image || "");
          setMrp(p.mrp || "");
          setSellingPrice(p.sellingPrice || "");
          setStock(p.stock || "");
          setAvailableWeightsInput(p.availableWeights ? p.availableWeights.join(", ") : "1 kg");
          setHasVariants(p.variants && p.variants.length > 0);
          setVariantsList(p.variants || []);
          
          setShelfLife(p.shelfLife || "");
          setCountryOfOrigin(p.countryOfOrigin || "");
          setManufacturer(p.manufacturer || "");
          setStorageInstructions(p.storageInstructions || "");

          if (p.nutrition) {
            setNutrition(prev => ({
              ...prev,
              ...p.nutrition
            }));
          }

          if (p.attributes) {
            setCustomAttributes(p.attributes);
          }

          setSelectedCatId(p.categoryId || "");
        }
      } catch (err) {
        console.error("Error loading product details:", err);
      }
    };
    fetchProduct();
  }, [editId]);

  useEffect(() => {
    if (!editingProduct) {
      setCustomAttributes({});
    }
  }, [selectedTypeId]);

  const isFoodCategory = () => {
    const catObj = categories.find(c => c._id === selectedCatId);
    if (!catObj) return false;
    const catName = catObj.name.toLowerCase();
    return (
      catName.includes("food") ||
      catName.includes("fruit") ||
      catName.includes("vegetable") ||
      catName.includes("dairy") ||
      catName.includes("bakery") ||
      catName.includes("beverage") ||
      catName.includes("breakfast") ||
      catName.includes("milk") ||
      catName.includes("curd") ||
      catName.includes("butter") ||
      catName.includes("paneer") ||
      catName.includes("snacks") ||
      catName.includes("frozen")
    );
  };

  const getCustomFieldsDef = () => {
    if (!selectedTypeId) return [];
    const typeObj = productTypes.find(t => t._id === selectedTypeId);
    const typeName = (typeObj?.name || "").toLowerCase();
    const catObj = categories.find(c => c._id === selectedCatId);
    const catName = (catObj?.name || "").toLowerCase();

    if (
      typeName.includes("apple") || 
      typeName.includes("fruit") || 
      typeName.includes("vegetable") || 
      catName.includes("fruit") || 
      catName.includes("vegetable") || 
      catName.includes("dairy") || 
      catName.includes("bakery") ||
      catName.includes("breakfast")
    ) {
      return [
        { key: "organic", label: "Organic Product?", type: "checkbox" }
      ];
    }

    if (typeName.includes("pencil") || typeName.includes("pen") || catName.includes("stationery")) {
      return [
        { key: "material", label: "Material", type: "text", placeholder: "e.g. Wood, Graphite" },
        { key: "leadGrade", label: "Lead Grade", type: "text", placeholder: "e.g. HB, 2B" },
        { key: "packSize", label: "Pack Size", type: "text", placeholder: "e.g. Pack of 10" }
      ];
    }

    if (typeName.includes("laptop") || typeName.includes("computer") || catName.includes("electronics")) {
      return [
        { key: "ram", label: "RAM Capacity", type: "text", placeholder: "e.g. 16 GB" },
        { key: "processor", label: "Processor Brand/Model", type: "text", placeholder: "e.g. Intel i7" },
        { key: "warranty", label: "Warranty Details", type: "text", placeholder: "e.g. 1 Year" },
        { key: "power", label: "Power / Wattage", type: "text", placeholder: "e.g. 65W" },
        { key: "modelNumber", label: "Model Number", type: "text", placeholder: "e.g. XPS-13" }
      ];
    }

    return [];
  };

  const handleCustomFieldChange = (key, value) => {
    setCustomAttributes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Image Gallery Handlers
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const trimmed = newImageUrl.trim();
    const updated = [...imagesList, trimmed];
    setImagesList(updated);
    setActivePreviewImage(trimmed);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index) => {
    const updated = imagesList.filter((_, idx) => idx !== index);
    setImagesList(updated);
    if (activePreviewImage === imagesList[index]) {
      setActivePreviewImage(updated[0] || "");
    }
  };

  // Variant Editor Handlers
  const handleAddVariant = () => {
    const finalWeight = variantWeight === "Custom" ? customWeightInput.trim() : variantWeight;
    if (!finalWeight || !variantMrp || !variantPrice || !variantStock) {
      alert("Please fill all variant inputs (weight, MRP, price, stock).");
      return;
    }
    
    // Check duplication (excluding current edit index)
    if (variantsList.some((v, idx) => v.weight === finalWeight && idx !== editingVariantIdx)) {
      alert(`Variant for weight "${finalWeight}" already exists.`);
      return;
    }

    if (Number(variantPrice) > Number(variantMrp)) {
      alert("Selling Price cannot be greater than MRP.");
      return;
    }

    const newVar = {
      weight: finalWeight,
      mrp: Number(variantMrp),
      price: Number(variantPrice),
      stock: Number(variantStock)
    };

    if (editingVariantIdx !== null) {
      const updated = [...variantsList];
      updated[editingVariantIdx] = newVar;
      setVariantsList(updated);
      setEditingVariantIdx(null);
    } else {
      setVariantsList([...variantsList, newVar]);
    }

    setVariantMrp("");
    setVariantPrice("");
    setVariantStock("");
    setCustomWeightInput("");
  };

  const handleStartEditVariant = (index) => {
    const v = variantsList[index];
    setEditingVariantIdx(index);
    setVariantWeight("Custom");
    setCustomWeightInput(v.weight);
    setVariantMrp(v.mrp);
    setVariantPrice(v.price);
    setVariantStock(v.stock);
  };

  const handleRemoveVariant = (index) => {
    setVariantsList(variantsList.filter((_, idx) => idx !== index));
    if (editingVariantIdx === index) {
      setEditingVariantIdx(null);
      setVariantMrp("");
      setVariantPrice("");
      setVariantStock("");
      setCustomWeightInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTypeId) {
      alert("Please select category taxonomy first.");
      return;
    }

    if (hasVariants && variantsList.length === 0) {
      alert("Please configure at least one product variant.");
      return;
    }

    const categoryObj = categories.find(c => c._id === selectedCatId);
    const subCategoryObj = subCategories.find(s => s._id === selectedSubCatId);
    const typeObj = productTypes.find(t => t._id === selectedTypeId);

    const cleanedAttributes = {};
    Object.keys(customAttributes).forEach(k => {
      const val = customAttributes[k];
      if (val !== undefined && val !== null && val !== "") {
        cleanedAttributes[k] = val;
      }
    });

    const payload = {
      name,
      brand,
      category: categoryObj?.name || "Others",
      subCategory: subCategoryObj?.name || "",
      productType: typeObj?.name || "",
      description,
      image: activePreviewImage || imagesList[0] || "",
      images: imagesList,
      unit,
      deliveryTime,
      isFeatured,
      isAvailable,
      sku,
      barcode,
      categoryId: selectedCatId,
      subCategoryId: selectedSubCatId || null,
      productTypeId: selectedTypeId || null,
      shelfLife,
      countryOfOrigin,
      manufacturer,
      storageInstructions,
      nutrition: isFoodCategory() ? nutrition : {},
      attributes: cleanedAttributes,
      variants: hasVariants ? variantsList : []
    };

    if (!hasVariants) {
      payload.mrp = Number(mrp);
      payload.sellingPrice = Number(sellingPrice);
      payload.price = Number(sellingPrice);
      payload.stock = Number(stock);
      payload.availableWeights = availableWeightsInput.split(",").map(w => w.trim()).filter(Boolean);
    }

    // Frontend validations
    if (!payload.name || !payload.name.trim()) {
      alert("Product Name is required");
      return;
    }
    if (!payload.category || !payload.category.trim()) {
      alert("Category is required");
      return;
    }
    if (!payload.subCategory || !payload.subCategory.trim()) {
      alert("Subcategory is required");
      return;
    }
    if (!payload.image) {
      alert("Primary Image URL is required");
      return;
    }
    if (!hasVariants) {
      if (Number(payload.sellingPrice) > Number(payload.mrp)) {
        alert("Selling Price cannot be greater than MRP");
        return;
      }
      if (Number(payload.stock) < 0) {
        alert("Stock cannot be negative");
        return;
      }
    }

    try {
      const url = editId ? `${API_BASE}/products/${editId}` : `${API_BASE}/products`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Fulfillment Failed");
      }

      navigate("/products/list", { replace: true });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (!store) return <p className="p-8 text-center font-bold">No store configured.</p>;

  // Pricing calculations
  const displayMrp = hasVariants && variantsList.length > 0 ? variantsList[0].mrp : mrp;
  const displayPrice = hasVariants && variantsList.length > 0 ? variantsList[0].price : sellingPrice;
  const displayWeight = hasVariants && variantsList.length > 0 ? variantsList[0].weight : (availableWeightsInput.split(",")[0] || "1 kg");
  
  const calculatedDiscount = displayMrp && displayPrice && Number(displayMrp) > Number(displayPrice)
    ? Math.round(((Number(displayMrp) - Number(displayPrice)) / Number(displayMrp)) * 100)
    : 0;

  const youSaveAmount = mrp && sellingPrice && Number(mrp) > Number(sellingPrice)
    ? (Number(mrp) - Number(sellingPrice)).toFixed(2)
    : 0;

  const customFieldsDef = getCustomFieldsDef();

  return (
    <div className="p-6 text-left bg-gray-55 min-h-screen space-y-6 font-sans">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
          {editId ? "✏️ Edit Product Details" : "Add New Product"}
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase mt-1">
          {editId 
            ? `Update configuration values for product ID: #${editId}`
            : `Configure inventory item configurations for ${store.name}`}
        </p>
      </div>

      {/* STEP 1: CATALOG PLACEMENT */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-gray-700">Step 1: Choose Catalog Placement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Category *</label>
            <select
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Subcategory *</label>
            <select
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
              value={selectedSubCatId}
              onChange={(e) => setSelectedSubCatId(e.target.value)}
              disabled={subCategories.length === 0}
              required
            >
              <option value="">-- Select Subcategory --</option>
              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Product Type *</label>
            <select
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              disabled={!selectedSubCatId || productTypes.length === 0}
              required
            >
              <option value="">-- Select Product Type --</option>
              {productTypes.map((type) => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STEP 2: DETAILS FORM */}
      {!selectedTypeId ? (
        <div className="bg-gray-100 rounded-3xl p-8 border border-dashed border-gray-300 text-center text-gray-450 font-bold text-xs">
          ⚠️ Please select Category, Subcategory, and Product Type above to generate the listing form details.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FORM FIELDS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Common Fields Panel */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Common Fields</h3>
              <form onSubmit={handleSubmit} id="addProductForm" className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Product Name *</label>
                    <input
                      placeholder="e.g. Gala Red Apples"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Brand Name</label>
                    <input
                      placeholder="e.g. Fresh Crop"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">SKU Code</label>
                    <input
                      placeholder="e.g. PRD-APP-001"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Barcode / EAN</label>
                    <input
                      placeholder="e.g. 8901030752109"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Stock Unit *</label>
                    <select
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold text-gray-700"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="g">g (Gram)</option>
                      <option value="packet">packet</option>
                      <option value="piece">piece</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="box">box</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Estimated Delivery Time *</label>
                    <input
                      placeholder="e.g. 15-20 mins"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Product Description</label>
                  <textarea
                    placeholder="Provide a description of features, specifications, shelf life details..."
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs font-bold text-gray-700 uppercase">Available for sale</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="w-4 h-4 text-green-655 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs font-bold text-green-700 uppercase">This product has variants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-xs font-bold text-gray-700 uppercase">Featured Item</span>
                  </label>
                </div>

              </form>
            </div>

            {/* PRODUCT MEDIA WORKFLOW */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Product Media</h3>
              
              <div className="space-y-4">
                <div className="flex gap-2 max-w-lg">
                  <input
                    type="text"
                    placeholder="Paste Image URL (e.g. https://domain.com/item.jpg)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="bg-green-650 hover:bg-green-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl"
                  >
                    Add
                  </button>
                </div>

                {imagesList.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Image Gallery ({imagesList.length})</span>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {imagesList.map((img, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setActivePreviewImage(img)}
                          className={`group relative h-16 w-16 border rounded-xl overflow-hidden cursor-pointer bg-gray-50 flex items-center justify-center transition ${
                            activePreviewImage === img ? "border-green-600 ring-2 ring-green-500/20" : "border-gray-200"
                          }`}
                        >
                          <img src={img} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Large Image Preview box */}
                    {activePreviewImage && (
                      <div className="mt-4 border border-gray-150 p-2 rounded-2xl bg-gray-50 max-w-sm flex flex-col items-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">Primary Preview</span>
                        <div className="h-44 w-full bg-white rounded-xl overflow-hidden flex items-center justify-center relative">
                          <img src={activePreviewImage} alt="Large Preview" className="max-h-full max-w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              // Replace Primary Image URL
                              setActivePreviewImage("");
                            }}
                            className="absolute bottom-2 bg-red-600 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg shadow hover:bg-red-700 transition"
                          >
                            Remove Primary Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SINGLE PRICING PANEL (IF NO VARIANTS) */}
            {!hasVariants && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Single Pricing & Stock</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">MRP (₹) *</label>
                    <input
                      type="number"
                      placeholder="Retail Price"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      placeholder="Selling Price"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Stock Level *</label>
                    <input
                      type="number"
                      placeholder="Stock quantity"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Available Weights/Sizes (Comma separated) *</label>
                    <input
                      placeholder="e.g. 250 g, 500 g, 1 kg"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      value={availableWeightsInput}
                      onChange={(e) => setAvailableWeightsInput(e.target.value)}
                      required
                    />
                  </div>
                  {youSaveAmount > 0 && (
                    <span className="text-emerald-700 text-xs font-black bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 self-end">
                      🎉 You Save ₹{youSaveAmount} ({calculatedDiscount}% OFF)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC VARIANT EDITOR */}
            {hasVariants && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Professional Variant Matrix</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end bg-gray-55 p-3 rounded-2xl border border-gray-150">
                  
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Weight/Unit Option</label>
                    <select
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold text-gray-700"
                      value={variantWeight}
                      onChange={(e) => setVariantWeight(e.target.value)}
                    >
                      <option value="250g">250g</option>
                      <option value="500g">500g</option>
                      <option value="1kg">1kg</option>
                      <option value="2kg">2kg</option>
                      <option value="Pieces">Pieces</option>
                      <option value="Packets">Packets</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Custom">-- Custom --</option>
                    </select>
                  </div>

                  {variantWeight === "Custom" && (
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Custom Label</label>
                      <input
                        placeholder="e.g. 5 Litre"
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                        value={customWeightInput}
                        onChange={(e) => setCustomWeightInput(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      placeholder="MRP"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                      value={variantMrp}
                      onChange={(e) => setVariantMrp(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Selling (₹)</label>
                    <input
                      type="number"
                      placeholder="Selling"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Stock</label>
                    <input
                      type="number"
                      placeholder="Stock"
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="w-full bg-green-650 hover:bg-green-700 text-white font-extrabold text-[10px] py-2 rounded-lg uppercase tracking-wider"
                    >
                      {editingVariantIdx !== null ? "✓ Save" : "+ Add"}
                    </button>
                  </div>

                </div>

                {variantsList.length > 0 && (
                  <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-black uppercase text-gray-400 tracking-wider">
                          <th className="p-3">Weight/Size Option</th>
                          <th className="p-3">MRP (₹)</th>
                          <th className="p-3 text-green-600">Selling Price (₹)</th>
                          <th className="p-3">Stock Level</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-gray-700 divide-y divide-gray-100">
                        {variantsList.map((v, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/40">
                            <td className="p-3">{v.weight}</td>
                            <td className="p-3">₹{v.mrp}</td>
                            <td className="p-3 text-green-650">₹{v.price}</td>
                            <td className="p-3">{v.stock} units</td>
                            <td className="p-3 text-right space-x-3">
                              <button
                                type="button"
                                onClick={() => handleStartEditVariant(idx)}
                                className="text-blue-500 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(idx)}
                                className="text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT DETAILS PANEL */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Product Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Shelf Life</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Days"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    value={shelfLife}
                    onChange={(e) => setShelfLife(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Country of Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Britannia Industries Ltd"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Storage Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Keep refrigerated"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                    value={storageInstructions}
                    onChange={(e) => setStorageInstructions(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* NUTRITION PANEL (FOOD CATEGORIES ONLY) */}
            {isFoodCategory() && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Nutrition Facts (Per 100g/ml)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {Object.keys(nutrition).map((key) => (
                    <div key={key}>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12g / 350 kcal"
                        className="w-full px-2.5 py-1.5 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                        value={nutrition[key]}
                        onChange={(e) => setNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DYNAMIC CUSTOM ATTRIBUTES */}
            {customFieldsDef.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gray-700 border-b pb-2">Technical Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {customFieldsDef.map((field) => {
                    const val = customAttributes[field.key];
                    return (
                      <div key={field.key}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{field.label}</label>
                        {field.type === "checkbox" ? (
                          <label className="flex items-center gap-2 cursor-pointer select-none py-2">
                            <input
                              type="checkbox"
                              checked={!!val}
                              onChange={(e) => handleCustomFieldChange(field.key, e.target.checked)}
                              className="w-4 h-4 text-green-650 border-gray-300 rounded focus:ring-green-500 font-bold"
                            />
                            <span className="text-xs font-bold text-gray-700 uppercase">Yes</span>
                          </label>
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={val || ""}
                            onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                            className="w-full px-3 py-2 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              form="addProductForm"
              className="bg-green-650 hover:bg-green-700 text-white font-extrabold text-xs px-6 py-4 rounded-2xl shadow-md transition w-full uppercase tracking-wider"
            >
              {editId ? "Save Changes" : "Add Product to Inventory"}
            </button>

          </div>

          {/* PREVIEW BLOCK */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-gray-700">Customer Page Preview</h3>
              
              <div className="border border-gray-150 rounded-2xl p-4 flex flex-col justify-between relative text-left w-56 mx-auto bg-white shadow-sm">
                {calculatedDiscount > 0 && (
                  <span className="absolute top-3 left-3 bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
                    {calculatedDiscount}% OFF
                  </span>
                )}

                <div className="h-28 w-full bg-gray-55 rounded-xl flex items-center justify-center overflow-hidden mb-3 relative">
                  {activePreviewImage || imagesList[0] ? (
                    <img src={activePreviewImage || imagesList[0]} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-gray-305 text-3xl">🥦</div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{brand || "Generic"}</span>
                  <h4 className="font-extrabold text-xs text-gray-800 line-clamp-2 h-8 leading-tight">{name || "Product Name"}</h4>
                </div>

                <div className="flex gap-1 my-2">
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-lg border bg-green-600 text-white border-green-600">
                    {displayWeight}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-green-600 font-extrabold text-sm leading-none">₹{displayPrice || "0"}</span>
                    {calculatedDiscount > 0 && (
                      <span className="text-[10px] text-gray-455 line-through mt-0.5">₹{displayMrp}</span>
                    )}
                  </div>
                  <span className="bg-white text-green-600 border border-green-200 font-extrabold text-[10px] px-3.5 py-1.5 rounded-xl">
                    + ADD
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default AddProduct;
