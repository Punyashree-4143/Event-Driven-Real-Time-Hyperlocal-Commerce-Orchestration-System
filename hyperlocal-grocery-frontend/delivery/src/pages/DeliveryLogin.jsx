import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DeliveryAuthContext } from "../context/DeliveryAuthContext";
import { apiFetch } from "../config/api";

function DeliveryLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(DeliveryAuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (data.role === "delivery") {
        login(data.token);
        navigate("/orders");
      } else {
        alert("Invalid delivery credentials");
      }
    } catch (err) {
      console.error("DELIVERY LOGIN ERROR:", err);
      alert(err.message || "Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8"
      >
        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚚</div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Delivery Login
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage deliveries
          </p>
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="delivery@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full bg-black text-white py-2.5 rounded-xl font-semibold tracking-wide hover:bg-gray-900 active:scale-[0.98] transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default DeliveryLogin;
