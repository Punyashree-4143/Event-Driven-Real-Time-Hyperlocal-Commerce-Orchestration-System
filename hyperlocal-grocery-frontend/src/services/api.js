// ✅ Use environment variable
import { API_BASE_URL, apiFetch } from "../config/api";

/* =========================
   STORES
========================= */
export const getNearbyStores = async (lat, lng) => {
  const res = await fetch(
    `${API_BASE_URL}/stores/nearby?lat=${lat}&lng=${lng}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch stores");
  }

  return res.json();
};

/* =========================
   PRODUCTS
========================= */
export const getProductsByStore = async (storeId) => {
  const res = await fetch(
    `${API_BASE_URL}/products/${storeId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
};

/* =========================
   AUTH
========================= */
export const loginUser = async (data) => {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
};
