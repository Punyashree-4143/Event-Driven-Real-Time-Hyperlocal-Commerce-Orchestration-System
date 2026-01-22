const express = require("express");
const router = express.Router();
const {
  registerUser,
  registerVendor,
  authUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/vendor/register", registerVendor);
router.post("/login", authUser);

module.exports = router;
