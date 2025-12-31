const express = require("express");
const router = express.Router();
const {
  getProductsByStore
} = require("../controllers/productController");

router.get("/:storeId", getProductsByStore);

module.exports = router;
