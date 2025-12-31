const express = require("express");
const router = express.Router();
const { getNearbyStores } = require("../controllers/storeController");

router.get("/nearby", getNearbyStores);

module.exports = router;
