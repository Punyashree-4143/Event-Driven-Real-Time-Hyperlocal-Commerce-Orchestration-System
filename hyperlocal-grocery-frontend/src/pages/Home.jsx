import { useNavigate } from "react-router-dom";
import "../styles/home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>🛒 Hyperlocal Grocery Platform</h1>
      <p>
        Find nearby grocery stores and get essentials delivered fast.
      </p>

      <div className="home-buttons">
        <button onClick={() => navigate("/register")}>
          Register
        </button>

        <button
          className="login-btn"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Home;
