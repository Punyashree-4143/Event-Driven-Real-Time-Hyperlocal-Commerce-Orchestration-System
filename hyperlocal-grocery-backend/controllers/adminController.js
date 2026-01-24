const Store = require("../models/Store");

// ==============================
// GET ALL STORES
// ==============================
exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({ stores });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch stores",
    });
  }
};

// ==============================
// UPDATE STORE STATUS
// ==============================
exports.updateStoreStatus = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status } = req.body;

    if (!["approved", "blocked"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    store.status = status;
    await store.save();

    res.json({
      message: "Store status updated",
      store,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update store",
    });
  }
};
