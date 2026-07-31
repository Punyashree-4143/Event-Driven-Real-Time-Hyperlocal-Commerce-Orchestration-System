const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const isAuthDebugEnabled = () => process.env.AUTH_DEBUG === "true";

const maskSecret = (value) => {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 12) return `${text.slice(0, 3)}...`;
  return `${text.slice(0, 10)}...${text.slice(-6)}`;
};

const authDebug = (label, details = {}) => {
  if (!isAuthDebugEnabled()) return;
  console.log(`[AUTH DEBUG] ${label}`, details);
};

// ==============================
// Register CUSTOMER
// ==============================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "customer",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Register VENDOR
// ==============================
const registerVendor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const vendor = await User.create({
      name,
      email,
      password,
      role: "vendor", // ✅ FIXED (was "shop")
    });

    res.status(201).json({
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      token: generateToken(vendor._id, vendor.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// Login (Customer / Vendor)
// ==============================
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim();

    authDebug("login request received", {
      emailReceived: email,
      normalizedEmail,
      passwordReceived: Boolean(password),
    });

    const user = await User.findOne({ email: normalizedEmail });

    authDebug("user lookup result", {
      userFound: Boolean(user),
      userId: user?._id?.toString(),
      role: user?.role,
      storedPasswordHash: maskSecret(user?.password),
    });

    const passwordMatches = user ? await user.matchPassword(password) : false;

    authDebug("bcrypt compare result", {
      passwordMatches,
    });

    if (user && passwordMatches) {
      const token = generateToken(user._id, user.role);

      authDebug("jwt generated", {
        token: maskSecret(token),
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  registerVendor,
  authUser,
};
