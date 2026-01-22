import { Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateStore from "./pages/CreateStore";
import ProductsList from "./pages/ProductsList";
import AddProduct from "./pages/AddProduct";
import ManageProducts from "./pages/ManageProducts";
import VendorOrders from "./pages/VendorOrders"; // ✅ NEW

// Layout & Auth
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <Routes>
      {/* ===================== */}
      {/* PUBLIC ROUTES */}
      {/* ===================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ===================== */}
      {/* VENDOR DASHBOARD */}
      {/* ===================== */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* STORE */}
      <Route
        path="/store"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateStore />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* PRODUCTS */}
      <Route
        path="/products/list"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProductsList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/add"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AddProduct />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products/manage"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ManageProducts />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* ===================== */}
      {/* VENDOR ORDERS ✅ */}
      {/* ===================== */}
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <VendorOrders />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
