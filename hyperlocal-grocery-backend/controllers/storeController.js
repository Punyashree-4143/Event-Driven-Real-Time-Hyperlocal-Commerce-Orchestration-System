const Store = require("../models/Store");

// ===============================
// GET NEARBY STORES (HYPERLOCAL)
// ===============================
exports.getNearbyStores = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance", // meters
          spherical: true,
          maxDistance: 20000, // 20km hard limit
          query: { status: "approved" }, // ✅ only approved stores
        },
      },
      {
        $addFields: {
          canDeliver: {
            $lte: [
              "$distance",
              { $multiply: ["$deliveryRadius", 1000] }, // km → meters
            ],
          },
        },
      },
      {
        $sort: { distance: 1 }, // nearest first
      },
    ]);

    res.json({ stores });
  } catch (error) {
    console.error("GEO ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch nearby stores",
      error: error.message,
    });
  }
};

// ===============================
// CREATE STORE (VENDOR)
// ===============================
exports.createStore = async (req, res) => {
  try {
    const { name, address, location, deliveryRadius } = req.body;

    // 🔴 Validate input
    if (
      !name ||
      !address ||
      !location ||
      !location.coordinates ||
      !deliveryRadius
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 🔥 IMPORTANT: one vendor → one store
    const existingStore = await Store.findOne({ owner: req.user._id });

    if (existingStore) {
      return res.status(400).json({
        message: "You already have a store",
      });
    }

    const store = await Store.create({
      owner: req.user._id, // from JWT
      name,
      address,
      location: {
        type: "Point",
        coordinates: [
          Number(location.coordinates[0]),
          Number(location.coordinates[1]),
        ],
      },
      deliveryRadius,
      status: "pending", // admin approval required
    });

    res.status(201).json(store);
  } catch (error) {
    console.error("CREATE STORE ERROR:", error);
    res.status(500).json({
      message: "Failed to create store",
      error: error.message,
    });
  }
};
