const Product = require("../models/Product");
const Order = require("../models/Order");
const Store = require("../models/Store");

/* ======================================================
   CUSTOMER – PLACE ORDER (WITH REAL-TIME INVENTORY)
   ====================================================== */
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

    const io = req.app.get("io");

    // 🔥 Reduce stock + emit socket updates
    for (const item of items) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      product.stock -= item.qty;
      await product.save();

      // 🔴 REAL-TIME INVENTORY UPDATE
      io.to(storeId.toString()).emit("inventory:update", {
        productId: product._id,
        newStock: product.stock,
      });
    }

    const normalizedItems = items.map((item) => ({
      productId: item._id,
      name: item.name,
      price: item.price,
      qty: item.qty,
    }));

    const order = await Order.create({
      userId: req.user._id,
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

/* ======================================================
   CUSTOMER – GET MY ORDERS
   ====================================================== */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).json({
      message: "Failed to fetch order history",
    });
  }
};

/* ======================================================
   CUSTOMER – GET ORDER BY ID (TRACKING)
   ====================================================== */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   CUSTOMER – CANCEL ORDER
   ====================================================== */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // ❌ Only Placed orders can be cancelled
    if (order.status !== "Placed") {
      return res.status(400).json({
        message:
          "Order cannot be cancelled after packing",
      });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   CUSTOMER – CHECK REORDER AVAILABILITY
   ====================================================== */
exports.checkReorderAvailability = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      order.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const unavailableItems = [];

    for (const item of order.items) {
      const product = await Product.findById(
        item.productId
      );

      if (!product || product.stock < item.qty) {
        unavailableItems.push(item.name);
      }
    }

    if (unavailableItems.length > 0) {
      return res.json({
        canReorder: false,
        unavailableItems,
      });
    }

    res.json({ canReorder: true });
  } catch (err) {
    console.error("REORDER CHECK ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   VENDOR – GET STORE ORDERS
   ====================================================== */
exports.getVendorOrders = async (req, res) => {
  try {
    const store = await Store.findOne({
      owner: req.user._id,
    });

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
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   VENDOR – UPDATE ORDER STATUS (LOCKED FLOW)
   ====================================================== */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const store = await Store.findOne({
      owner: req.user._id,
    });

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

    res.json({
      message: "Status updated",
      order,
    });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};
