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

  // 🔄 Fetch products
  const fetchProducts = async () => {
    if (!store) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/products/${store._id}`
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [store]);

  // ➕ Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price,
          category,
          stock,
          image, // 🖼 IMAGE URL
        }),
      });

      if (!res.ok) {
        alert("Failed to add product");
        return;
      }

      // Reset form
      setName("");
      setPrice("");
      setCategory("");
      setStock("");
      setImage("");

      // Refresh products
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
          placeholder="Price (₹)"
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
          placeholder="Stock"
          className="w-full p-2 border rounded"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          required
        />

        {/* 🖼 IMAGE URL */}
        <input
          placeholder="Image URL"
          className="w-full p-2 border rounded"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />

        {/* IMAGE PREVIEW */}
        {image && (
          <img
            src={image}
            alt="Preview"
            className="w-24 h-24 object-cover rounded border"
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
