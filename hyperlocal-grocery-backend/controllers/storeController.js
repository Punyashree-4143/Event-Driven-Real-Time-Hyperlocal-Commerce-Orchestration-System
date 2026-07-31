const Store = require("../models/Store");
const Product = require("../models/Product");
const { seedDefaultCatalog } = require("../utils/seedCatalog");

// ===============================
// GET NEARBY STORES
// Hyperlocal + Product Category Filter
// ===============================
exports.getNearbyStores = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const category = req.query.category; // product category

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const pipeline = [
      // 🔥 GEO QUERY
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat],
          },
          distanceField: "distance", // meters
          spherical: true,
          maxDistance: 20000, // 20 km hard cap
          query: { status: "approved" }, // only approved stores
        },
      },

      // 🔗 JOIN PRODUCTS USING storeId
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "storeId", // ✅ THIS MATCHES YOUR DB
          as: "products",
        },
      },
    ];

    // 🎯 FILTER STORES BY PRODUCT CATEGORY
    if (category && category !== "All") {
      pipeline.push({
        $match: {
          "products.category": category,
        },
      });
    }

    pipeline.push(
      // 🚚 DELIVERY CHECK
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

      // 📍 NEAREST FIRST
      {
        $sort: { distance: 1 },
      },

      // ❌ REMOVE PRODUCTS ARRAY FROM RESPONSE
      {
        $project: {
          products: 0,
        },
      }
    );

    const stores = await Store.aggregate(pipeline);

    res.json({ stores });
  } catch (error) {
    console.error("GET NEARBY STORES ERROR:", error);
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
    const { name, address, location, deliveryRadius, logo, banner, holidayMode, businessHours, minOrder, description, deliveryTime } = req.body;

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

    // 🔒 One vendor → one store
    const existingStore = await Store.findOne({ owner: req.user._id });

    if (existingStore) {
      return res.status(400).json({
        message: "You already have a store",
      });
    }

    const store = await Store.create({
      owner: req.user._id,
      name,
      address,
      location: {
        type: "Point",
        coordinates: [
          Number(location.coordinates[0]), // lng
          Number(location.coordinates[1]), // lat
        ],
      },
      deliveryRadius,
      logo: logo || "",
      banner: banner || "",
      holidayMode: !!holidayMode,
      businessHours: businessHours || "9 AM - 9 PM",
      minOrder: Number(minOrder) || 0,
      description: description || "",
      deliveryTime: deliveryTime || "30 mins",
      status: "pending", // admin approval required
    });

    // 🌾 Seed default grocery catalog dynamically
    await seedDefaultCatalog(store._id);

    res.status(201).json(store);
  } catch (error) {
    console.error("CREATE STORE ERROR:", error);
    res.status(500).json({
      message: "Failed to create store",
      error: error.message,
    });
  }
};
