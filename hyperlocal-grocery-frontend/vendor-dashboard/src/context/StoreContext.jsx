import { createContext, useEffect, useState } from "react";

export const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL;

  const fetchStore = async () => {
    const token = localStorage.getItem("vendorToken"); // ✅ CORRECT

    if (!token) {
      setStore(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/stores/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ STRING TOKEN
          },
        }
      );

      if (!res.ok) {
        console.error("STORE FETCH FAILED:", res.status);
        setStore(null);
        return;
      }

      const data = await res.json();
      setStore(data.store || null);
    } catch (err) {
      console.error("STORE FETCH ERROR:", err);
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 fetch immediately after login / refresh
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
