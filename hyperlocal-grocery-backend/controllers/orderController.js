const Product = require("../models/Product");
const Order = require("../models/Order");

exports.placeOrder = async (req, res) => {
  try {
    const { storeId, items, address, total, paymentMethod } = req.body;

    console.log("ORDER REQUEST:", req.body);

    if (!storeId || !items || items.length === 0) {
      return res.status(400).json({
        message: "Invalid order data"
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
          message: `${product.name} is out of stock`
        });
      }

      product.stock -= item.qty;
      await product.save();
    }

    const order = new Order({
      storeId,
      items,
      address,
      total,
      paymentMethod,
      status: "confirmed"
    });

    await order.save();

    res.status(201).json({ order });
  } catch (err) {
    console.error("ORDER ERROR:", err);
    res.status(500).json({
      message: err.message || "Order failed"
    });
  }
};
