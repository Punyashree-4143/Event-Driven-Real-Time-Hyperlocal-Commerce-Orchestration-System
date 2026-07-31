const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const email = "vendor1@test.com";
    const newPassword = "Vendor@123";

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    console.log(result);

    console.log("\n✅ Password reset successful!");
    console.log("Email:", email);
    console.log("Password:", newPassword);

    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
  });