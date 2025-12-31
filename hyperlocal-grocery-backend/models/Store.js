const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    }
  },
  { timestamps: true }
);

// Geo index (VERY IMPORTANT)
storeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Store", storeSchema);
