const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
    },

    image: {
      type: String, // image URL
    },

    stock: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-update availability based on stock
productSchema.pre("save", function (next) {
  this.isAvailable = this.stock > 0;
  next();
});

module.exports = mongoose.model("Product", productSchema);
