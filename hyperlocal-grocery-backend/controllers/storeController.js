const Store = require("../models/Store");

exports.getNearbyStores = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 20000
        }
      },
      {
        $addFields: {
          canDeliver: {
            $lte: [
              "$distance",
              {
                $multiply: [
                  { $toDouble: "$deliveryRadius" },
                  1000
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    return res.json({ stores });
  } catch (error) {
    console.error("GEO ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch nearby stores",
      error: error.message
    });
  }
};
