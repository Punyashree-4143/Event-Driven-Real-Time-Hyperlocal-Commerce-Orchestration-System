const express = require("express");
const router = express.Router();

const {
  getProductsByStore,
  getVendorProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const shopOnly = require("../middleware/shopOnly");

// 🔥 SHOP (VENDOR) ROUTES
router.get("/vendor/all", shopOnly, getVendorProducts);
router.post("/", shopOnly, addProduct);
router.put("/:productId", shopOnly, updateProduct);
router.delete("/:productId", shopOnly, deleteProduct);

// 👤 CUSTOMER ROUTE (MUST BE LAST)
router.get("/:storeId", getProductsByStore);

module.exports = router;
