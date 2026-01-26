import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../services/api";
import { addToCart } from "../utils/cart";
import { io } from "socket.io-client";

// 🔑 API & SOCKET BASE
const API_BASE = import.meta.env.VITE_API_URL;
const SOCKET_BASE = API_BASE.replace("/api", "");

// 🔌 SOCKET (single instance)
const socket = io(SOCKET_BASE);

function Products() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);

  // 🔥 variant state PER PRODUCT
  const [variants, setVariants] = useState({});

  /* =========================
     CART STATE
     ========================= */
  const refreshCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(cart);
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const isInCart = (productId, variant) =>
    cartItems.some(
      (i) => i._id === productId && i.variant === variant
    );

  /* =========================
     FETCH PRODUCTS
     ========================= */
  useEffect(() => {
    getProductsByStore(storeId)
      .then((data) => {
        setProducts(data.products || []);

        // default variant = 1 kg
        const initial = {};
        data.products?.forEach((p) => {
          initial[p._id] = "1 kg";
        });
        setVariants(initial);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  /* =========================
     REAL-TIME INVENTORY
     ========================= */
  useEffect(() => {
    if (!storeId) return;

    socket.emit("joinStore", storeId);

    socket.on("inventory:update", ({ productId, newStock }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, stock: newStock }
            : p
        )
      );
    });

    return () => socket.off("inventory:update");
  }, [storeId]);

  /* =========================
     HELPERS
     ========================= */
  const getDisplayPrice = (price, variant) => {
    if (variant === "250 g") return Math.round(price * 0.25);
    if (variant === "500 g") return Math.round(price * 0.5);
    return price; // 1 kg
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product) => {
    const variant = variants[product._id];
    addToCart(product, storeId, variant);
    refreshCart();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading products...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 🔝 Header */}
      <header className="bg-white shadow p-4 sticky top-0 z-10 space-y-3">
        <h2 className="text-xl font-semibold">
          Available Products
        </h2>

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-full border"
        />
      </header>

      {/* 🛒 Products */}
      <section className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const selectedVariant = variants[p._id];
            const added = isInCart(p._id, selectedVariant);

            return (
              <div
                key={p._id}
                className="bg-white rounded-xl shadow p-4 flex flex-col"
              >
                {/* 🖼 Image */}
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-32 w-full object-cover rounded mb-2"
                  onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/150")
                  }
                />

                {/* 📦 Name */}
                <h3 className="font-medium">{p.name}</h3>

                {/* ⚖ Variant Selector */}
                <div className="flex gap-2 my-2">
                  {["250 g", "500 g", "1 kg"].map((v) => (
                    <button
                      key={v}
                      onClick={() =>
                        setVariants((prev) => ({
                          ...prev,
                          [p._id]: v,
                        }))
                      }
                      className={`px-2 py-1 text-xs rounded border ${
                        selectedVariant === v
                          ? "bg-green-600 text-white"
                          : "bg-white"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {/* 💰 Price */}
                <p className="text-green-600 font-semibold text-lg">
                  ₹{getDisplayPrice(p.price, selectedVariant)}
                </p>
                <p className="text-xs text-gray-500">
                  ₹{p.price} / kg
                </p>

                {/* 📊 Stock */}
                <p className="text-sm text-orange-600 mt-1">
                  Only {p.stock} left
                </p>

                {/* 🛒 Add */}
                <button
                  disabled={p.stock === 0 || added}
                  onClick={() => handleAddToCart(p)}
                  className={`mt-auto py-2 rounded text-sm font-semibold ${
                    added
                      ? "bg-gray-300"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {added ? "✓ Added" : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🧺 Sticky Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white px-4 py-3 flex justify-between">
          <span>
            🛒 {cartItems.length} items
          </span>
          <button
            onClick={() => navigate("/cart")}
            className="bg-green-500 px-4 py-1 rounded"
          >
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}

export default Products;
