const Product = require("../models/Product");
const Order = require("../models/Order");
const Store = require("../models/Store");

// ==============================
// CUSTOMER – PLACE ORDER
// ==============================
exports.placeOrder = async (req, res) => {
  try {
    const {
      storeId,
      items,
      address,
      totalAmount,
      paymentMethod,
    } = req.body;

    if (!storeId || !items || items.length === 0) {
      return res.status(400).json({
        message: "Invalid order data",
      });
    }

    // 🔥 Reduce stock
    for (const item of items) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res
          .status(404)
          .json({ message: "Product not found" });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      product.stock -= item.qty;
      await product.save();
    }

    // Normalize items
    const normalizedItems = items.map((item) => ({
      productId: item._id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const order = await Order.create({
      userId: req.user._id, // customer
      storeId,
      items: normalizedItems,
      address,
      totalAmount,
      paymentMethod,
      status: "Placed",
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({
      message: err.message || "Order failed",
    });
  }
};

// ==============================
// CUSTOMER – GET ORDER BY ID (TRACKING)
// ==============================
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // 🔒 Customer can access ONLY their order
    if (
      order.userId &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// VENDOR – GET STORE ORDERS
// ==============================
exports.getVendorOrders = async (req, res) => {
  try {
    // Find vendor's store
    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({
        message: "Store not found for this vendor",
      });
    }

    const orders = await Order.find({
      storeId: store._id,
    }).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error("VENDOR ORDERS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// VENDOR – UPDATE ORDER STATUS (LOCKED FLOW)
// ==============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      storeId: store._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found for this store",
      });
    }

    // 🔒 VALID STATUS FLOW
    const validTransitions = {
      Placed: ["Packed"],
      Packed: ["Out for Delivery"],
      "Out for Delivery": ["Delivered"],
    };

    if (
      !validTransitions[order.status] ||
      !validTransitions[order.status].includes(status)
    ) {
      return res.status(400).json({
        message: `Invalid status transition from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Status updated", order });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
