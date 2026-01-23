const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  checkReorderAvailability,
  getVendorOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const protect = require("../middleware/protect");     // customer
const shopOnly = require("../middleware/shopOnly");   // vendor

// ==============================
// 🔴 VENDOR ROUTES — MUST BE FIRST
// ==============================
router.get("/vendor", shopOnly, getVendorOrders);
router.put("/:orderId/status", shopOnly, updateOrderStatus);

// ==============================
// 🟢 CUSTOMER ROUTES
// ==============================
router.post("/", protect, placeOrder);
router.get("/my", protect, getMyOrders);
router.get("/:orderId/reorder-check", protect, checkReorderAvailability);
router.put("/:orderId/cancel", protect, cancelOrder);
router.get("/:orderId", protect, getOrderById);

module.exports = router;
