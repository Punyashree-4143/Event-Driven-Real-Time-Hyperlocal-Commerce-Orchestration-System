import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { StoreContext } from "../context/StoreContext";

const Sidebar = () => {
  const { store, clearStore } = useContext(StoreContext);
  const [openProducts, setOpenProducts] = useState(false);
  const navigate = useNavigate();

  const activeClass = "hover:bg-emerald-700 px-3 py-2 rounded-xl block transition";
  const disabledClass = "opacity-55 cursor-not-allowed px-3 py-2 rounded-xl block";

  const handleLogout = () => {
    console.log("Logging out...");

    localStorage.clear();   // or remove specific keys
    clearStore();           // ✅ correct way
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-emerald-800 text-white p-5 flex flex-col shadow-md">
      <h2 className="text-xl font-black mb-8 tracking-tight uppercase flex items-center gap-1.5">
        ⚡ greenmart Hub
      </h2>

      <nav className="flex flex-col gap-3.5 flex-1 text-sm font-bold">
        <Link to="/" className={activeClass}>📊 Dashboard</Link>

        <Link to="/store" className={activeClass}>🏪 My Store</Link>

        {store?.status === "approved" ? (
          <div className="space-y-1">
            <button
              onClick={() => setOpenProducts(!openProducts)}
              className="w-full text-left hover:bg-emerald-700 px-3 py-2 rounded-xl flex justify-between items-center transition"
            >
              <span>📦 Products Catalog</span>
              <span className="text-[10px]">{openProducts ? "▲" : "▼"}</span>
            </button>

            {openProducts && (
              <div className="ml-4 flex flex-col gap-1 text-xs border-l border-emerald-700 pl-3.5 pt-1">
                <Link to="/products/add" className="hover:text-emerald-300 py-1.5 transition">Add Product</Link>
                <Link to="/products/list" className="hover:text-emerald-300 py-1.5 transition">Product List</Link>
                <Link to="/products/manage" className="hover:text-emerald-300 py-1.5 transition">Manage Catalog</Link>
              </div>
            )}
          </div>
        ) : (
          <span className={disabledClass}>
            📦 Products (Awaiting Approval)
          </span>
        )}

        {store?.status === "approved" ? (
          <Link to="/orders" className={activeClass}>🛒 Store Orders</Link>
        ) : (
          <span className={disabledClass}>
            🛒 Orders (Awaiting Approval)
          </span>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
