const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const protect = require("../middleware/protect");
const adminOnly = require("../middleware/adminOnly");

// ===============================
// GET ALL STORES (ADMIN)
// ===============================
router.get("/stores", protect, adminOnly, async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({ stores });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch stores",
      error: err.message,
    });
  }
});

// ===============================
// APPROVE / BLOCK STORE
// ===============================
router.put(
  "/stores/:storeId/status",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { storeId } = req.params;
      const { status } = req.body;

      if (!["approved", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const store = await Store.findById(storeId);

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      store.status = status;
      await store.save();

      res.json({ message: "Status updated", store });
    } catch (err) {
      res.status(500).json({
        message: "Failed to update store",
        error: err.message,
      });
    }
  }
);

module.exports = router;
