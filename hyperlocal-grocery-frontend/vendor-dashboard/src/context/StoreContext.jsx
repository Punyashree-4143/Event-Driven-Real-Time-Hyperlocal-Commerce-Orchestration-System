import { createContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = API_BASE_URL;

  const fetchStore = async () => {
    const token = localStorage.getItem("vendorToken");

    if (!token) {
      setStore(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/stores/my`, // ✅ FIX
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setStore(data.store || null);
    } catch (err) {
      console.error("STORE FETCH ERROR:", err.message);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        store,
        loading,
        refetchStore: fetchStore,
        clearStore: () => setStore(null),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
