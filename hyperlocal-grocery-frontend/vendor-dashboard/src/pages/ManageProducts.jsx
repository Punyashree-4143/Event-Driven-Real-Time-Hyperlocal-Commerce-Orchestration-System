import { useEffect, useState } from "react";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("vendorToken");

  // =====================
  // FETCH PRODUCTS
  // =====================
  const fetchProducts = async () => {
    try {
      const res = await fetch(
        "http://localhost:5001/api/products/vendor/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err.message);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =====================
  // UPDATE PRODUCT
  // =====================
  const updateProduct = async (id, updates) => {
    try {
      const res = await fetch(
        `http://localhost:5001/api/products/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // =====================
  // DELETE PRODUCT
  // =====================
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/products/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-6">Loading products...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Image</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Price (₹ / kg)</th>
              <th className="border p-2">Stock (kg)</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Available</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                {/* IMAGE EDIT */}
                <td className="border p-2">
                  <div className="space-y-2">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-14 h-14 object-cover rounded"
                      onError={(e) =>
                        (e.target.src =
                          "https://via.placeholder.com/60")
                      }
                    />

                    <input
                      type="text"
                      placeholder="Image URL"
                      className="w-32 border p-1 text-xs"
                      defaultValue={p.image}
                      onBlur={(e) =>
                        updateProduct(p._id, {
                          image: e.target.value,
                        })
                      }
                    />
                  </div>
                </td>

                <td className="border p-2">{p.name}</td>

                {/* PRICE UPDATE */}
                <td className="border p-2">
                  <input
                    type="number"
                    className="w-20 border p-1"
                    defaultValue={p.price}
                    onBlur={(e) =>
                      updateProduct(p._id, {
                        price: Number(e.target.value),
                      })
                    }
                  />
                </td>

                {/* STOCK CONTROL */}
                <td className="border p-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateProduct(p._id, { stock: p.stock - 1 })
                      }
                      disabled={p.stock <= 0}
                      className="px-2 bg-red-500 text-white rounded"
                    >
                      −
                    </button>

                    <span>{p.stock}</span>

                    <button
                      onClick={() =>
                        updateProduct(p._id, { stock: p.stock + 1 })
                      }
                      className="px-2 bg-green-500 text-white rounded"
                    >
                      +
                    </button>
                  </div>
                </td>

                <td className="border p-2">{p.category || "—"}</td>

                <td className="border p-2">
                  {p.isAvailable ? (
                    <span className="text-green-600 font-semibold">
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      No
                    </span>
                  )}
                </td>

                {/* DELETE */}
                <td className="border p-2">
                  <button
                    onClick={() => deleteProduct(p._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageProducts;
