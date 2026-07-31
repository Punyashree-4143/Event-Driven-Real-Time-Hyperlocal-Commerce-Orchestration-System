const express = require("express");
const router = express.Router();

const {
  getProductsByStore,
  getVendorProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductsByCategory,
  searchProducts,
  filterProducts,
  getProductById,
} = require("../controllers/productController");

const shopOnly = require("../middleware/shopOnly");

// 👤 CUSTOMER CATEGORIES & SEARCH ROUTES (Static routes first)
router.get("/categories", getCategories);
router.get("/filter", filterProducts);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/detail/:productId", getProductById);

// 🔥 SHOP (VENDOR) ROUTES
router.get("/vendor/all", shopOnly, getVendorProducts);
router.post("/", shopOnly, addProduct);
router.put("/:productId", shopOnly, updateProduct);
router.delete("/:productId", shopOnly, deleteProduct);

// 👤 CUSTOMER ROUTE (MUST BE THE LAST GET ROUTE)
router.get("/:storeId", getProductsByStore);

module.exports = router;

