import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Invalid credentials");
        return;
      }

      // 🚫 BLOCK VENDORS ONLY
      if (data.role === "vendor") {
        alert("Please login using the Vendor Dashboard");
        return;
      }

      // ✅ STORE TOKEN
      localStorage.setItem("userToken", data.token);

      // ✅ STORE USER (WITH ROLE)
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role, // customer OR admin
      });

      alert("Login successful");

      // 🔀 REDIRECT BASED ON ROLE
      if (data.role === "admin") {
        navigate("/admin/stores");
      } else {
        navigate("/stores");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>

      {/* CUSTOMER REGISTER */}
      <p className="auth-link">
        Don’t have an account?{" "}
        <span onClick={() => navigate("/register")}>
          Register
        </span>
      </p>

      {/* 🔐 ADMIN LOGIN LINK */}
      <p className="auth-link">
        Are you an admin?{" "}
        <span
          onClick={() => navigate("/admin/login")}
          style={{
            color: "#d32f2f",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Admin Login
        </span>
      </p>
    </div>
  );
}

export default Login;
