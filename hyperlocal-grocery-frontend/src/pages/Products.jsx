import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../services/api";
import { addToCart } from "../utils/cart";
import { io } from "socket.io-client";

// 🔌 SOCKET CONNECTION (single instance)
const socket = io("http://localhost:5001");

function Products() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // =========================
  // FETCH PRODUCTS
  // =========================
  useEffect(() => {
    getProductsByStore(storeId)
      .then((data) => {
        setProducts(
          Array.isArray(data.products) ? data.products : []
        );
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // =========================
  // 🔥 REAL-TIME INVENTORY
  // =========================
  useEffect(() => {
    if (!storeId) return;

    // Join store room
    socket.emit("joinStore", storeId);

    // Listen for inventory updates
    socket.on("inventory:update", ({ productId, newStock }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, stock: newStock }
            : p
        )
      );
    });

    return () => {
      socket.off("inventory:update");
    };
  }, [storeId]);

  // 🔍 FILTER PRODUCTS BY NAME
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔝 Header */}
      <header className="bg-white shadow p-4 sticky top-0 z-10 space-y-3">
        <h2 className="text-xl font-semibold text-gray-800">
          Available Products
        </h2>

        {/* 🔍 Search Bar */}
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-full border focus:ring-2 focus:ring-green-500 outline-none"
        />
      </header>

      {/* 🛒 Products */}
      <section className="p-4">
        {filteredProducts.length === 0 ? (
          <p className="text-gray-500">
            No products found
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col"
              >
                {/* 🖼 Image */}
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-32 w-full object-cover rounded-lg mb-3"
                  onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/150")
                  }
                />

                {/* 📦 Info */}
                <h3 className="font-medium text-gray-800">
                  {p.name}
                </h3>

                <p className="text-green-600 font-semibold mt-1">
                  ₹{p.price}
                </p>

                {/* 📊 Stock */}
                <p
                  className={`text-sm mt-1 ${
                    p.stock > 0
                      ? "text-orange-600"
                      : "text-red-500"
                  }`}
                >
                  {p.stock > 0
                    ? `Only ${p.stock} left`
                    : "Out of stock"}
                </p>

                {/* 🛒 Action */}
                <button
                  disabled={p.stock === 0}
                  onClick={() => {
                    addToCart(p, storeId);
                    navigate("/cart");
                  }}
                  className={`mt-auto py-2 rounded-lg text-sm font-medium transition ${
                    p.stock === 0
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {p.stock === 0
                    ? "Unavailable"
                    : "Add to Cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Products;
