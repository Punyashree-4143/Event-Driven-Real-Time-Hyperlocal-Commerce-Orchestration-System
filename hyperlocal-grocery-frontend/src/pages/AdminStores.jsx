import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = API_BASE_URL;

  // =========================
  // FETCH ALL STORES (ADMIN)
  // =========================
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        setError("Admin token missing");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_BASE}/admin/stores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Access denied");
      }

      setStores(data.stores || []);
    } catch (err) {
      console.error("ADMIN STORE ERROR:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE STORE STATUS
  // =========================
  const updateStatus = async (storeId, status) => {
    try {
      const token = localStorage.getItem("userToken");

      const res = await fetch(
        `${API_BASE}/admin/stores/${storeId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      // 🔄 Refresh list
      fetchStores();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // =========================
  // UI STATES
  // =========================
  if (loading) {
    return <p style={{ padding: 20 }}>Loading stores...</p>;
  }

  if (error) {
    return (
      <p style={{ padding: 20, color: "red" }}>
        {error}
      </p>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h2>🏪 Admin – Store Management</h2>

      {stores.length === 0 ? (
        <p>No stores found</p>
      ) : (
        stores.map((store) => (
          <div
            key={store._id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "8px",
            }}
          >
            <h3>{store.name}</h3>
            <p>{store.address}</p>

            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color:
                    store.status === "approved"
                      ? "green"
                      : store.status === "blocked"
                      ? "red"
                      : "orange",
                }}
              >
                {store.status}
              </span>
            </p>

            {store.status !== "approved" && (
              <button
                onClick={() =>
                  updateStatus(store._id, "approved")
                }
                style={{ marginRight: "10px" }}
              >
                ✅ Approve
              </button>
            )}

            {store.status !== "blocked" && (
              <button
                onClick={() =>
                  updateStatus(store._id, "blocked")
                }
              >
                ⛔ Block
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminStores;
