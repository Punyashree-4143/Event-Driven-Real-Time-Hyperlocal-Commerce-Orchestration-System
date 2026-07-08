const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const shopOnly = require("../middleware/shopOnly");
const { getNearbyStores, createStore } = require("../controllers/storeController");

// 🌍 USER SIDE
router.get("/nearby", getNearbyStores);

// 🏪 VENDOR SIDE
router.post("/", shopOnly, createStore);

// 🔥 VENDOR: GET MY STORE (THIS FIXES YOUR ISSUE)
router.get("/my", shopOnly, async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    res.json({ store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🌍 USER: GET STORE BY ID
router.get("/:storeId", async (req, res) => {
  try {
    let store = null;
    const storeId = req.params.storeId;
    const mongoose = require("mongoose");

    if (mongoose.Types.ObjectId.isValid(storeId)) {
      store = await Store.findById(storeId);
    }

    if (!store && mongoose.Types.ObjectId.isValid(storeId)) {
      store = await Store.findOne({ owner: storeId });
    }

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json({ store });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

