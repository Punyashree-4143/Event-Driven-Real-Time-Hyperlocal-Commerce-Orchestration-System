const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },

  items: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      name: String,
      price: Number,
      qty: Number
    }
  ],

  address: {
    type: String,
    required: true
  },

  total: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    required: true
  },

  status: {
    type: String,
    default: "confirmed"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
