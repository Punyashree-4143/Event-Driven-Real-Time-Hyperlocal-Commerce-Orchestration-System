const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },
  name: String,
  price: Number,
  image: String,
  category: String,

  // 🔥 INVENTORY
  stock: {
    type: Number,
    default: 10
  },

  isAvailable: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Product", productSchema);
