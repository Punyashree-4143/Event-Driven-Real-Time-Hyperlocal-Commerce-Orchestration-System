import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Public / User Pages
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Stores from "./pages/Stores";
import Products from "./pages/Products";
import CategoryPage from "./pages/CategoryPage";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Tracking from "./pages/Tracking";
import OrderHistory from "./pages/OrderHistory";
import Profile from "./pages/Profile";

// Admin
import AdminStores from "./pages/AdminStores";
import AdminRoute from "./pages/AdminRoute";
import AdminLogin from "./pages/AdminLogin";

function App() {
  

  return (
    <>
      {/* 🔥 GLOBAL NAVBAR */}
      <Navbar />

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* 🔐 ADMIN LOGIN */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* CUSTOMER */}
        <Route path="/stores" element={<Stores />} />
        <Route path="/store/:storeId" element={<Products />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/tracking/:orderId" element={<Tracking />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/profile" element={<Profile />} />

        {/* 🔐 ADMIN (PROTECTED) */}
        <Route
          path="/admin/stores"
          element={
            <AdminRoute>
              <AdminStores />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
