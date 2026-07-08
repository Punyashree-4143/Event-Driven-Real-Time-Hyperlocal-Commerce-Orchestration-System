import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

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

const AddProduct = () => {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();

  const [categories, setCategories] = useState(FALLBACK_TAXONOMY);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [mrp, setMrp] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [category, setCategory] = useState("Fruits & Vegetables");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [unit, setUnit] = useState("kg");
  const [availableWeightsInput, setAvailableWeightsInput] = useState("250 g, 500 g, 1 kg");
  const [deliveryTime, setDeliveryTime] = useState("30 mins");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const token = localStorage.getItem("vendorToken");
  const API_BASE = API_BASE_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/categories`);
        if (res.ok) {
          const data = await res.json();
          if (data.categories) {
            setCategories(data.categories);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [API_BASE]);

  useEffect(() => {
    const subCats = categories[category] || [];
    if (subCats.length > 0) {
      setSubCategory(subCats[0]);
    } else {
      setSubCategory("");
    }
  }, [category, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          brand,
          mrp: Number(mrp),
          sellingPrice: Number(sellingPrice),
          price: Number(sellingPrice), // Keep compatibility
          category,
          subCategory,
          description,
          stock: Number(stock),
          image,
          unit,
          availableWeights: availableWeightsInput.split(",").map(w => w.trim()).filter(Boolean),
          deliveryTime,
          isFeatured,
          isAvailable,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("ADD PRODUCT ERROR:", text);
        alert("Failed to add product");
        return;
      }

      navigate("/products/list", { replace: true });
    } catch (err) {
      console.error("ADD PRODUCT ERROR:", err);
      alert("Server error");
    }
  };

  if (!store) {
    return <p className="p-8">No store found</p>;
  }

  const subCategoriesList = categories[category] || [];

  return (
    <div className="p-8 max-w-2xl bg-white shadow rounded-xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Product Name *</label>
          <input
            placeholder="e.g. Fresh Red Apples"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Brand */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Brand</label>
          <input
            placeholder="e.g. Organic Farms"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Category *</label>
          <select
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {Object.keys(categories).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Subcategory *</label>
          <select
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            required
          >
            {subCategoriesList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* MRP */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">MRP (₹) *</label>
          <input
            type="number"
            placeholder="Maximum Retail Price"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            required
          />
        </div>

        {/* Selling Price */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Selling Price (₹) *</label>
          <input
            type="number"
            placeholder="Selling Price"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            required
          />
        </div>

        {/* Total Stock */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Total Stock *</label>
          <div className="flex items-center border rounded focus-within:ring-2 focus-within:ring-green-500 overflow-hidden">
            <input
              type="number"
              placeholder="e.g. 50"
              className="w-full p-2 outline-none"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
            <span className="px-3 text-gray-600 bg-gray-100 border-l font-medium">
              {unit}
            </span>
          </div>
        </div>

        {/* Unit */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Unit *</label>
          <select
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          >
            <option value="kg">kg (Kilogram)</option>
            <option value="g">g (Gram)</option>
            <option value="liter">liter (Litre)</option>
            <option value="ml">ml (Millilitre)</option>
            <option value="piece">piece</option>
            <option value="pack">pack</option>
          </select>
        </div>

        {/* Available Weights / Variants */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Available Weights/Variants (Comma separated)</label>
          <input
            placeholder="e.g. 250 g, 500 g, 1 kg"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={availableWeightsInput}
            onChange={(e) => setAvailableWeightsInput(e.target.value)}
          />
        </div>

        {/* Delivery Time */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Delivery Time *</label>
          <input
            placeholder="e.g. 30 mins"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            required
          />
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Image URL</label>
          <input
            placeholder="https://example.com/image.jpg"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        {/* Image Preview */}
        {image && (
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Image Preview</label>
            <img
              src={image}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/128")
              }
            />
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            placeholder="Product description and details..."
            rows="3"
            className="p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6 md:col-span-2">
          {/* Featured Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Featured Product</span>
          </label>

          {/* Available Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">Available for Sale</span>
          </label>
        </div>

        {/* Submit */}
        <div className="md:col-span-2">
          <button className="bg-green-600 hover:bg-green-700 transition duration-150 text-white font-semibold px-4 py-2 rounded-lg w-full">
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
