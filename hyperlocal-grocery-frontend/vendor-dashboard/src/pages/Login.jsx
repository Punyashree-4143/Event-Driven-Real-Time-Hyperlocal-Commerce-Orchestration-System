import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../config/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // 🚫 BLOCK NON-VENDORS
      if (data.role !== "vendor") {
        alert("Access denied. Vendor only.");
        return;
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("vendorToken", data.token);

      window.location.href = "/";
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert(error.message || "Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-xl w-96"
      >
        <h1 className="text-2xl font-bold text-center text-green-600 mb-6">
          Vendor Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Login
        </button>

        <p className="text-center text-sm mt-4">
          New vendor?{" "}
          <Link to="/register" className="text-green-600 font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
