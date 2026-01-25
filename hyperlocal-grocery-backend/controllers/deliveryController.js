const Order = require("../models/Order");
const Store = require("../models/Store");

/* ======================================================
   DELIVERY – GET ORDERS READY FOR DELIVERY
   ====================================================== */
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: "Packed",
      $or: [
        { deliveryPartner: { $exists: false } }, // ✅ FIX
        { deliveryPartner: null },
        { deliveryPartner: req.user._id },
      ],
    })
      .populate("storeId", "name")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch delivery orders",
    });
  }
};

/* ======================================================
   DELIVERY – ACCEPT DELIVERY
   ====================================================== */
exports.acceptDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Packed") {
      return res.status(400).json({
        message: "Order not ready for delivery",
      });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        message: "Order already assigned",
      });
    }

    order.deliveryPartner = req.user._id;
    order.deliveryStatus = "Assigned";
    await order.save();

    const io = req.app.get("io");

    // 🔔 Vendor + customer
    io.to(order.storeId.toString()).emit("order:update", order);
    io.to(order._id.toString()).emit("order:update", order);

    // 🔔 Delivery dashboards
    io.to("delivery").emit("delivery:update");

    res.json({
      message: "Delivery accepted",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   DELIVERY – UPDATE DELIVERY STATUS
   ====================================================== */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    const allowedStatuses = [
      "Picked Up",
      "On the Way",
      "Delivered",
    ];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return res.status(400).json({
        message: "Invalid delivery status",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      !order.deliveryPartner ||
      order.deliveryPartner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Not assigned to this order",
      });
    }

    order.deliveryStatus = deliveryStatus;
    await order.save();

    const io = req.app.get("io");

    // 🔔 Vendor + customer
    io.to(order.storeId.toString()).emit("order:update", order);
    io.to(order._id.toString()).emit("order:update", order);

    // 🔔 Delivery dashboards
    io.to("delivery").emit("delivery:update");

    res.json({
      message: "Delivery status updated",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
