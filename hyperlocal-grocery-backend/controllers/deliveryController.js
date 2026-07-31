const Order = require("../models/Order");
const Store = require("../models/Store");

/* ======================================================
   DELIVERY – GET ORDERS READY FOR DELIVERY
   ====================================================== */
exports.getAvailableOrders = async (req, res) => {
  try {
    const query = {
      $or: [
        { 
          status: "Ready", 
          $or: [
            { deliveryPartner: null }, 
            { deliveryPartner: { $exists: false } }
          ] 
        },
        { deliveryPartner: req.user._id }
      ]
    };

    const orders = await Order.find(query)
      .populate("storeId", "name")
      .sort({ createdAt: 1 }); // Sort oldest Ready first

    console.log("===== DELIVERY API =====");
    console.log(query);
    console.log("Orders Returned:", orders);
    orders.forEach(o => {
      console.log(`Order: id=${o._id}, status=${o.status}, deliveryPartner=${o.deliveryPartner}, deliveryStatus=${o.deliveryStatus}`);
    });

    res.json({ orders });
  } catch (err) {
    console.error("Failed to fetch delivery orders:", err);
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

    if (order.status !== "Ready") {
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
    order.status = "Out for Delivery"; // As specified in User Request
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
    if (deliveryStatus === "Picked Up") {
      order.status = "Picked Up";
    } else if (deliveryStatus === "On the Way") {
      order.status = "Out for Delivery";
    } else if (deliveryStatus === "Delivered") {
      order.status = "Delivered";
    }
    
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
