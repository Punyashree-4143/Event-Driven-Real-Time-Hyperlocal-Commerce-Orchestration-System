import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductsByStore } from "../services/api";
import { addToCart } from "../utils/cart";
import "../styles/products.css";

function Products() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p style={{ padding: 20 }}>Loading products...</p>;
  }

  return (
    <>
      <header className="page-header">
        <h2>Available Products</h2>
      </header>

      <section className="product-section">
        <div className="product-grid">
          {products.length === 0 ? (
            <p>No products available</p>
          ) : (
            products.map((p) => (
              <div key={p._id} className="product-card">
                <img
                  src={p.image}
                  alt={p.name}
                  className="product-image"
                  onError={(e) =>
                    (e.target.src =
                      "https://via.placeholder.com/150")
                  }
                />

                <h3>{p.name}</h3>
                <p className="price">₹{p.price}</p>

                {/* 🔥 INVENTORY */}
                <p className="stock-text">
                  {p.stock > 0
                    ? `Only ${p.stock} left`
                    : "Out of stock"}
                </p>

                <button
                  disabled={p.stock === 0}
                  onClick={() => {
                    addToCart(p, storeId);
                    navigate("/cart");
                  }}
                >
                  {p.stock === 0
                    ? "Unavailable"
                    : "Add to Cart"}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

export default Products;
