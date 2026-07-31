import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiFetch } from "../config/api";

function AdminLogin() {
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
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // 🔒 STRICT ADMIN CHECK
      if (data.role !== "admin") {
        alert("Admin access only");
        return;
      }

      // ✅ LOGIN ADMIN
      login({
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      localStorage.setItem("userToken", data.token);

      navigate("/admin/stores");
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);
      alert(err.message || "Server error");
    }
  };

  return (
    <div className="auth-container">
      <h2>Admin Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Admin Email"
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

        <button type="submit">Login as Admin</button>
      </form>
    </div>
  );
}

export default AdminLogin;
