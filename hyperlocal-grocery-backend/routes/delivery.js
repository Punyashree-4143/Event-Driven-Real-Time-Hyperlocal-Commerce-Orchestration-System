const express = require("express");
const router = express.Router();

const deliveryProtect = require("../middleware/deliveryProtect");
const {
  getAvailableOrders,
  acceptDelivery,
  updateDeliveryStatus, // ✅ add
} = require("../controllers/deliveryController");
// 🚚 Get orders ready for delivery
router.get(
  "/orders",
  deliveryProtect,
  getAvailableOrders
);

// 🚚 Accept delivery
router.put(
  "/orders/:orderId/accept",
  deliveryProtect,
  acceptDelivery
);



// 🚚 Update delivery progress
router.put(
  "/orders/:orderId/status",
  deliveryProtect,
  updateDeliveryStatus
);

module.exports = router;
