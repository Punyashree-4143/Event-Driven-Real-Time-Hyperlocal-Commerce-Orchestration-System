import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { StoreContext } from "../context/StoreContext";

const Sidebar = () => {
  const { store, clearStore } = useContext(StoreContext);
  const [openProducts, setOpenProducts] = useState(false);
  const navigate = useNavigate();

  const activeClass = "hover:bg-green-600 px-2 py-1 rounded";
  const disabledClass = "opacity-50 cursor-not-allowed px-2 py-1 rounded";

  const handleLogout = () => {
    console.log("Logging out...");

    localStorage.clear();   // or remove specific keys
    clearStore();           // ✅ correct way
    navigate("/login");
  };

  return (
    <div className="w-64 h-screen bg-green-700 text-white p-5 flex flex-col">
      <h2 className="text-xl font-bold mb-6">Vendor Panel</h2>

      <nav className="flex flex-col gap-4 flex-1">
        <Link to="/" className={activeClass}>Dashboard</Link>
        <Link to="/store" className={activeClass}>My Store</Link>

        {store?.status === "approved" ? (
          <div>
            <button
              onClick={() => setOpenProducts(!openProducts)}
              className="w-full text-left hover:bg-green-600 px-2 py-1 rounded font-semibold"
            >
              Products ▾
            </button>

            {openProducts && (
              <div className="ml-4 mt-2 flex flex-col gap-2 text-sm">
                <Link to="/products/add" className={activeClass}>Add Product</Link>
                <Link to="/products/list" className={activeClass}>Product List</Link>
                <Link to="/products/manage" className={activeClass}>Manage Products</Link>
              </div>
            )}
          </div>
        ) : (
          <span className={disabledClass}>
            Products (Waiting for approval)
          </span>
        )}

        {store?.status === "approved" ? (
          <Link to="/orders" className={activeClass}>Orders</Link>
        ) : (
          <span className={disabledClass}>
            Orders (Waiting for approval)
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
