require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: "admin@gmail.com" });

    if (existing) {
      console.log("❌ Admin already exists");
      process.exit();
    }

    const admin = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: "Admin@123",
      role: "admin",
    });

    await admin.save();

    console.log("✅ Admin created successfully!");
    console.log("Email: admin@gmail.com");
    console.log("Password: Admin@123");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();