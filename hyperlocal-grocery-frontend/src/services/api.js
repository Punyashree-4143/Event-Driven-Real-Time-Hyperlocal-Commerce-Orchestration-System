const BASE_URL = "http://localhost:5001/api";

/* =========================
   STORES
========================= */
export const getNearbyStores = async (lat, lng) => {
  const res = await fetch(
    `${BASE_URL}/stores/nearby?lat=${lat}&lng=${lng}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch stores");
  }

  return res.json();
};

/* =========================
   PRODUCTS (✅ FIXED)
========================= */
export const getProductsByStore = async (storeId) => {
  const res = await fetch(
    `http://localhost:5001/api/products/${storeId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
};

/* =========================
   AUTH (if used)
========================= */
export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return res.json();
};
