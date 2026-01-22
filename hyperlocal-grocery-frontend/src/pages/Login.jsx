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

      // 🚫 BLOCK VENDORS FROM CUSTOMER APP
      if (data.role !== "customer") {
        alert("Please login using a CUSTOMER account");
        return;
      }

      // ✅ STORE CUSTOMER TOKEN
      localStorage.setItem("userToken", data.token);

      // ✅ STORE CUSTOMER USER IN CONTEXT
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      alert("Login successful");
      navigate("/stores");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <h2>Customer Login</h2>

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

      <p className="auth-link">
        Don’t have an account?{" "}
        <span onClick={() => navigate("/register")}>Register</span>
      </p>
    </div>
  );
}

export default Login;
