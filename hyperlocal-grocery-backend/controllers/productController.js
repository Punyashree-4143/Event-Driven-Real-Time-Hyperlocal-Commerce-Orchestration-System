const Product = require("../models/Product");
const Store = require("../models/Store");

// ===============================
// CUSTOMER SIDE – GET PRODUCTS BY STORE
// ===============================
exports.getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const products = await Product.find({
      storeId,
      isAvailable: true,
    });

    res.json({ products });
  } catch (err) {
    console.error("PRODUCT FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// VENDOR SIDE – GET ALL PRODUCTS
// ===============================
exports.getVendorProducts = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({
      storeId: store._id,
    });

    res.json({ products });
  } catch (err) {
    console.error("VENDOR PRODUCT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// ADD PRODUCT (VENDOR)
// ===============================
exports.addProduct = async (req, res) => {
  try {
    const { name, price, stock, category, image } = req.body;

    if (!name || price == null || stock == null) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await Product.create({
      storeId: store._id,
      name,
      price,
      stock,
      category,
      image,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPDATE PRODUCT (VENDOR)
// ===============================
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("storeId");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check
    if (product.storeId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(product, req.body);
    await product.save(); // triggers pre-save hook

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// DELETE PRODUCT (VENDOR)
// ===============================
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("storeId");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.storeId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
