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

    // 🔔 Notify vendor (existing)
    io.to(storeId.toString()).emit("order:update", order);

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

    const order = await Order.findById(orderId).populate("deliveryPartner", "name email");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
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

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (order.status !== "Placed") {
      return res.status(400).json({
        message: "Order cannot be cancelled after packing",
      });
    }

    const io = req.app.get("io");

    // 🔁 INVENTORY ROLLBACK
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      if (product) {
        product.stock += item.qty;
        await product.save();

        // 🔴 REAL-TIME INVENTORY UPDATE
        io.to(order.storeId.toString()).emit("inventory:update", {
          productId: product._id,
          newStock: product.stock,
        });
      }
    }

    order.status = "Cancelled";
    await order.save();

    // 🔔 Notify vendor
    io.to(order.storeId.toString()).emit("order:update", order);

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

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const unavailableItems = [];

    for (const item of order.items) {
      const product = await Product.findById(item.productId);

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
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error("VENDOR ORDERS ERROR:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ======================================================
   VENDOR – UPDATE ORDER STATUS (FIXED)
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

    // ✅ FIX: Vendor stops at PACKED / READY
    const validTransitions = {
      Placed: ["Accepted", "Cancelled", "Packed"],
      Accepted: ["Preparing", "Cancelled"],
      Preparing: ["Packed", "Cancelled"],
      Packed: ["Ready", "Cancelled"],
      Ready: ["Cancelled"],
      Cancelled: []
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
    console.log(`[VENDOR DEBUG] Mongo updated: order ${order._id} status changed to ${status}`);

    const io = req.app.get("io");

    // 🔔 Vendor dashboard update (existing)
    io.to(store._id.toString()).emit("order:update", order);
    console.log(`[VENDOR DEBUG] Socket emitted order:update to store room: ${store._id}`);

    // 🔔 Customer tracking update (MERN sync)
    io.to(order._id.toString()).emit("order:update", order);
    console.log(`[VENDOR DEBUG] Socket emitted order:update to customer order room: ${order._id}`);

    // 🚚 Notify delivery (existing socket logic)
    if (status === "Packed" || status === "Ready") {
      io.to("delivery").emit("delivery:update");
      console.log(`[VENDOR DEBUG] Socket emitted delivery:update for order: ${order._id}`);
    }

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
