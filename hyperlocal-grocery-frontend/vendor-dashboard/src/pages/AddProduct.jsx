import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";

const AddProduct = () => {
  const { store } = useContext(StoreContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");

  const token = localStorage.getItem("vendorToken");
  const API_BASE = import.meta.env.VITE_API_URL;

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
          price: Number(pricePerKg), // ✅ price per kg
          category,
          stock: Number(stock), // total available stock
          image,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add product");
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

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <input
          placeholder="Product Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Price per kg */}
        <div className="flex items-center border rounded">
          <input
            type="number"
            placeholder="Price"
            className="w-full p-2 outline-none"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            required
          />
          <span className="px-3 text-gray-600 bg-gray-100 border-l">
            ₹ / kg
          </span>
        </div>

        {/* Category */}
        <input
          placeholder="Category"
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* Total stock */}
        <input
          type="number"
          placeholder="Total Stock (kg)"
          className="w-full p-2 border rounded"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

        {/* Image */}
        <input
          placeholder="Image URL"
          className="w-full p-2 border rounded"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        {image && (
          <img
            src={image}
            alt="Preview"
            className="w-24 h-24 object-cover rounded"
          />
        )}

        <button className="bg-green-600 text-white px-4 py-2 rounded w-full">
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
