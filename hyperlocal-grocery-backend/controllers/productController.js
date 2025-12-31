const Product = require("../models/Product");

exports.getProductsByStore = async (req, res) => {
  try {
    const products = await Product.find({
      storeId: req.params.storeId
    });

    res.json({ products });
  } catch (err) {
    console.error("PRODUCT FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
