const User = require("../models/User");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        createdAt: user.createdAt,
        profileImage: user.profileImage || user.profilePhotoUrl || "",
        profilePhotoUrl: user.profilePhotoUrl || user.profileImage || "",
        address: user.address || "",
        status: user.status || "Active",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { name, phone, profileImage } = req.body;

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({ message: "Name cannot be empty" });
        }
        user.name = name.trim();
      }

      if (phone !== undefined) {
        const phoneRegex = /^[0-9+\-\s()]*$/;
        const trimmedPhone = phone.trim();
        if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
          return res.status(400).json({ message: "Invalid phone number format" });
        }
        user.phone = trimmedPhone;
      }

      if (profileImage !== undefined) {
        const trimmedImg = profileImage.trim();
        user.profileImage = trimmedImg;
        user.profilePhotoUrl = trimmedImg; // Sync with profilePhotoUrl for backwards compatibility
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        profileImage: updatedUser.profileImage || updatedUser.profilePhotoUrl || "",
        profilePhotoUrl: updatedUser.profilePhotoUrl || updatedUser.profileImage || "",
        address: updatedUser.address || "",
        status: updatedUser.status || "Active",
        updatedAt: updatedUser.updatedAt,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
