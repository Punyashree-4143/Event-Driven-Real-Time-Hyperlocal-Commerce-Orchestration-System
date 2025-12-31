import React, { useEffect, useState } from 'react';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/products') // Replace with your backend URL
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h2>Available Products</h2>
      {products.length === 0 && <p>No products found.</p>}
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — ${p.price.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
