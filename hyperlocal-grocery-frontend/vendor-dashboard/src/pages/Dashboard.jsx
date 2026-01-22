import { useContext } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";

const Dashboard = () => {
  const { store, loading } = useContext(StoreContext);

  // 🔄 WAIT FOR STORE TO LOAD
  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600 text-lg">Loading store...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* NO STORE */}
      {!store && (
        <div className="bg-white p-6 rounded shadow max-w-md">
          <p className="mb-4">You have not created a store yet.</p>
          <Link
            to="/store"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Create Store
          </Link>
        </div>
      )}

      {/* STORE PENDING */}
      {store?.status === "pending" && (
        <div className="bg-yellow-50 border border-yellow-300 p-6 rounded max-w-md">
          <p className="font-semibold text-yellow-700">
            Your store is under review ⏳
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            You will be able to add products once approved.
          </p>
        </div>
      )}

      {/* STORE APPROVED */}
      {store?.status === "approved" && (
        <div className="bg-green-50 border border-green-300 p-6 rounded max-w-md">
          <p className="font-semibold text-green-700">
            Your store is live 🎉
          </p>
          <Link
            to="/products"
            className="inline-block mt-3 bg-green-600 text-white px-4 py-2 rounded"
          >
            Manage Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
