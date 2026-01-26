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
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price: Number(pricePerKg),
          category,
          stock: Number(stock),
          image,
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

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Product Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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

        <input
          placeholder="Category"
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="number"
          placeholder="Total Stock (kg)"
          className="w-full p-2 border rounded"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

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
            onError={(e) =>
              (e.target.src = "https://via.placeholder.com/96")
            }
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
