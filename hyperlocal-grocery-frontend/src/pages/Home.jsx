import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-green-700 mb-4">
          🛒 Hyperlocal Grocery Platform
        </h1>

        <p className="text-gray-600 mb-8">
          Find nearby grocery stores and get essentials delivered fast.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/register")}
            className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition"
          >
            Register
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full border border-green-600 text-green-600 py-3 rounded-lg text-lg font-medium hover:bg-green-50 transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
