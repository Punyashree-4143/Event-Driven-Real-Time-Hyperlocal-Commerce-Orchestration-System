const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getVendorOrders,
  updateOrderStatus,
  getOrderById,
} = require("../controllers/orderController");

const protect = require("../middleware/protect");     // customer
const shopOnly = require("../middleware/shopOnly");   // vendor

// ==============================
// VENDOR ROUTES (MUST COME FIRST)
// ==============================
router.get("/vendor", shopOnly, getVendorOrders);
router.put("/:orderId/status", shopOnly, updateOrderStatus);

// ==============================
// CUSTOMER ROUTES
// ==============================
router.post("/", protect, placeOrder);
router.get("/:orderId", protect, getOrderById);

module.exports = router;
