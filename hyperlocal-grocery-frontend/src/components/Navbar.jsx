import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-20 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 🛒 Logo */}
        <h2
          onClick={() => navigate("/")}
          className="text-lg sm:text-xl font-bold text-green-700 cursor-pointer"
        >
          🛒 Hyperlocal Grocery
        </h2>

        {/* 🔗 Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate("/stores")}
            className="px-3 py-1.5 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
          >
            Stores
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="px-3 py-1.5 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
          >
            Cart
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="px-3 py-1.5 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-green-50 hover:text-green-700 transition"
          >
            Profile
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
