import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  return (
    <nav className="sticky top-0 z-20 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h2
          onClick={() => navigate("/")}
          className="text-xl font-bold text-green-700 cursor-pointer"
        >
          🛒 Hyperlocal Grocery
        </h2>

        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/stores")}>
            Stores
          </button>

          <button onClick={() => navigate("/cart")}>
            Cart
          </button>

          <button onClick={() => navigate("/profile")}>
            Profile
          </button>

          {/* 🔥 ADMIN ONLY */}
          {auth?.user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin/stores")}
              className="text-red-600 font-semibold"
            >
              Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
