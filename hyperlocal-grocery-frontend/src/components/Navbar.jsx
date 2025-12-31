import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <h2 className="logo" onClick={() => navigate("/")}>
        🛒 Hyperlocal Grocery Platform
      </h2>

      <div className="nav-links">
        <button onClick={() => navigate("/stores")}>
          Stores
        </button>

        <button onClick={() => navigate("/cart")}>
          Cart
        </button>

        <button onClick={() => navigate("/profile")}>
          Profile
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
