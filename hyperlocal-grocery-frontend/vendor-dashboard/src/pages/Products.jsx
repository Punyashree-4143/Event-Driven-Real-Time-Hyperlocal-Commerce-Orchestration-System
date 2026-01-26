import { useContext, useEffect, useState } from "react";
import { StoreContext } from "../context/StoreContext";

const Products = () => {
  const { store } = useContext(StoreContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📝 Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");

  const token = localStorage.getItem("vendorToken");
  const API_BASE = import.meta.env.VITE_API_URL;

  /* =====================
     FETCH PRODUCTS
     ===================== */
  const fetchProducts = async () => {
    if (!store) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/products/${store._id}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [store]);

  /* =====================
     ADD PRODUCT
     ===================== */
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE}/api/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            price: Number(price),
            category,
            stock: Number(stock),
            image,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to add product");
        return;
      }

      // reset form
      setName("");
      setPrice("");
      setCategory("");
      setStock("");
      setImage("");

      fetchProducts();
    } catch (error) {
      alert("Server error");
    }
  };

  if (!store) return <p className="p-8">No store found.</p>;
  if (loading) return <p className="p-8">Loading products...</p>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Products</h1>

      {/* ➕ ADD PRODUCT FORM */}
      <form
        onSubmit={handleAddProduct}
        className="bg-white p-6 rounded shadow space-y-4 max-w-md"
      >
        <h2 className="text-lg font-semibold">Add Product</h2>

        <input
          placeholder="Product Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Price (₹ / kg)"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          placeholder="Category"
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="number"
          placeholder="Stock (kg)"
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
            className="w-24 h-24 object-cover rounded border"
            onError={(e) =>
              (e.target.src = "https://via.placeholder.com/96")
            }
          />
        )}

        <button className="bg-green-600 text-white px-4 py-2 rounded w-full">
          Add Product
        </button>
      </form>

      {/* 📦 PRODUCT LIST */}
      {products.length === 0 ? (
        <p className="text-gray-600">No products added yet.</p>
      ) : (
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) =>
                          (e.target.src =
                            "https://via.placeholder.com/48")
                        }
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">₹{p.price}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    {p.stock > 0 ? (
                      <span className="text-green-600 font-semibold">
                        Available
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        Out of stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
