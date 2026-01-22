const jwt = require("jsonwebtoken");
const User = require("../models/User");

const shopOnly = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔑 MUST be decoded.id
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor access only" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = shopOnly;
