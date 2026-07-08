import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { API_BASE_URL } from "../config/api";

const ProductsList = () => {
  const { store } = useContext(StoreContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    if (!store) return;

    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/products/${store._id}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("FETCH PRODUCTS ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [store]);

  if (!store) return <p className="p-8">No store found</p>;
  if (loading) return <p className="p-8">Loading products...</p>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>

        <Link
          to="/products/add"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Product
        </Link>
      </div>

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
                      "—"
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

export default ProductsList;
