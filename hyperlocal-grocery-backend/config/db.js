const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("mongoose.connection.name:", conn.connection.name);
    console.log("mongoose.connection.host:", conn.connection.host);

    // 🔥 Migration: Update products with no/empty category to "Others"
    try {
      const Product = require("../models/Product");
      const count = await Product.countDocuments({
        $or: [
          { category: { $exists: false } },
          { category: null },
          { category: "" }
        ]
      });
      if (count > 0) {
        console.log(`Migration: Found ${count} products with no category. Migrating to 'Others'...`);
        const result = await Product.updateMany(
          {
            $or: [
              { category: { $exists: false } },
              { category: null },
              { category: "" }
            ]
          },
          { $set: { category: "Others" } }
        );
        console.log(`Migration: Successfully updated ${result.modifiedCount} products.`);
      } else {
        console.log("Migration: No products without category found.");
      }

      // 🔥 Migration: Update legacy categories to hierarchical parent + subcategories
      const legacyMap = {
        "Vegetables": { category: "Fruits & Vegetables", subCategory: "Vegetables" },
        "Fruits": { category: "Fruits & Vegetables", subCategory: "Fruits" },
        "Milk": { category: "Dairy & Breakfast", subCategory: "Milk" },
        "Curd": { category: "Dairy & Breakfast", subCategory: "Curd" },
        "Butter": { category: "Dairy & Breakfast", subCategory: "Butter" },
        "Pencil": { category: "Stationery", subCategory: "Pencils" },
        "Pen": { category: "Stationery", subCategory: "Pens" },
        "Notebook": { category: "Stationery", subCategory: "Notebooks" },
        "Snacks": { category: "Snacks & Beverages", subCategory: "Chips" }
      };

      for (const [oldCat, newVals] of Object.entries(legacyMap)) {
        const countOld = await Product.countDocuments({ category: oldCat });
        if (countOld > 0) {
          console.log(`Migration: Found ${countOld} products with legacy category '${oldCat}'. Migrating...`);
          const result = await Product.updateMany(
            { category: oldCat },
            { $set: { category: newVals.category, subCategory: newVals.subCategory } }
          );
          console.log(`Migration: Successfully updated ${result.modifiedCount} products from legacy '${oldCat}' to '${newVals.category}' / '${newVals.subCategory}'.`);
        }
      }
    } catch (migError) {
      console.error("Migration failed:", migError);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

