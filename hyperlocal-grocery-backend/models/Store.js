const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // vendor (shop)
    },

    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    deliveryRadius: {
      type: Number, // in km
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "blocked"],
      default: "pending",
    },

    logo: {
      type: String,
      default: "",
    },

    banner: {
      type: String,
      default: "",
    },

    holidayMode: {
      type: Boolean,
      default: false,
    },

    businessHours: {
      type: String,
      default: "9 AM - 9 PM",
    },

    minOrder: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      default: 4.5,
    },

    description: {
      type: String,
      default: "",
    },

    deliveryTime: {
      type: String,
      default: "30 mins",
    },
  },
  { timestamps: true }
);

// 🔥 VERY IMPORTANT: GEO INDEX
storeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Store", storeSchema);
