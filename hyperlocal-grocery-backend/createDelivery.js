require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const createDelivery = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({
      email: "delivery@gmail.com",
    });

    if (existing) {
      console.log("❌ Delivery partner already exists.");
      process.exit();
    }

    const delivery = await User.create({
      name: "Delivery Partner",
      email: "delivery@gmail.com",
      password: "Delivery@123",
      role: "delivery",
    });

    console.log("✅ Delivery Partner created successfully!");
    console.log("Email:", delivery.email);
    console.log("Password: Delivery@123");

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createDelivery();