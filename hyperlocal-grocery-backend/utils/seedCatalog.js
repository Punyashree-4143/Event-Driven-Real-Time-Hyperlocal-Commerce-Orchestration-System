const StoreCategory = require("../models/StoreCategory");
const StoreSubCategory = require("../models/StoreSubCategory");
const StoreProductType = require("../models/StoreProductType");

const DEFAULT_CATALOG = [
  {
    category: "Fruits & Vegetables",
    subCategories: [
      {
        name: "Fruits",
        productTypes: ["Seasonal Fruits", "Exotic Fruits", "Citrus Fruits", "Tropical Fruits", "Berries", "Dry Fruits"]
      },
      {
        name: "Vegetables",
        productTypes: ["Leafy Vegetables", "Root Vegetables", "Salad Vegetables", "Cooking Vegetables", "Exotic Vegetables", "Herbs"]
      },
      {
        name: "Organic Produce",
        productTypes: ["Organic Produce"]
      },
      {
        name: "Fresh Cut",
        productTypes: ["Fresh Cut"]
      }
    ]
  },
  {
    category: "Dairy & Breakfast",
    subCategories: [
      { name: "Milk", productTypes: ["Milk"] },
      { name: "Curd", productTypes: ["Curd"] },
      { name: "Butter", productTypes: ["Butter"] },
      { name: "Cheese", productTypes: ["Cheese"] },
      { name: "Paneer", productTypes: ["Paneer"] },
      { name: "Eggs", productTypes: ["Eggs"] },
      { name: "Bread", productTypes: ["Bread"] },
      { name: "Oats", productTypes: ["Oats"] },
      { name: "Breakfast Cereals", productTypes: ["Breakfast Cereals"] },
      { name: "Honey & Spreads", productTypes: ["Honey & Spreads"] }
    ]
  },
  {
    category: "Snacks & Beverages",
    subCategories: [
      { name: "Chips", productTypes: ["Chips"] },
      { name: "Biscuits", productTypes: ["Biscuits"] },
      { name: "Chocolates", productTypes: ["Chocolates"] },
      { name: "Namkeen", productTypes: ["Namkeen"] },
      { name: "Tea", productTypes: ["Tea"] },
      { name: "Coffee", productTypes: ["Coffee"] },
      { name: "Soft Drinks", productTypes: ["Soft Drinks"] },
      { name: "Juices", productTypes: ["Juices"] },
      { name: "Energy Drinks", productTypes: ["Energy Drinks"] },
      { name: "Water", productTypes: ["Water"] }
    ]
  },
  {
    category: "Bakery",
    subCategories: [
      { name: "Bread", productTypes: ["Bread"] },
      { name: "Cakes", productTypes: ["Cakes"] },
      { name: "Cookies", productTypes: ["Cookies"] },
      { name: "Muffins", productTypes: ["Muffins"] },
      { name: "Pastries", productTypes: ["Pastries"] }
    ]
  },
  {
    category: "Household Essentials",
    subCategories: [
      { name: "Cleaning", productTypes: ["Cleaning"] },
      { name: "Laundry", productTypes: ["Laundry"] },
      { name: "Dishwash", productTypes: ["Dishwash"] },
      { name: "Garbage Bags", productTypes: ["Garbage Bags"] },
      { name: "Air Fresheners", productTypes: ["Air Fresheners"] }
    ]
  },
  {
    category: "Personal Care",
    subCategories: [
      { name: "Hair Care", productTypes: ["Hair Care"] },
      { name: "Skin Care", productTypes: ["Skin Care"] },
      { name: "Oral Care", productTypes: ["Oral Care"] },
      { name: "Bath & Body", productTypes: ["Bath & Body"] },
      { name: "Men's Grooming", productTypes: ["Men's Grooming"] },
      { name: "Women's Hygiene", productTypes: ["Women's Hygiene"] }
    ]
  },
  {
    category: "Baby Care",
    subCategories: [
      { name: "Baby Care", productTypes: ["Baby Care"] }
    ]
  },
  {
    category: "Pet Care",
    subCategories: [
      { name: "Pet Care", productTypes: ["Pet Care"] }
    ]
  },
  {
    category: "Frozen Foods",
    subCategories: [
      { name: "Frozen Foods", productTypes: ["Frozen Foods"] }
    ]
  },
  {
    category: "Stationery",
    subCategories: [
      {
        name: "Writing",
        productTypes: ["Pens", "Pencils", "Markers"]
      },
      {
        name: "Paper Products",
        productTypes: ["Notebooks", "Drawing Books"]
      },
      {
        name: "Office Supplies",
        productTypes: ["Files", "Folders", "Staplers"]
      }
    ]
  }
];

const seedDefaultCatalog = async (storeId) => {
  try {
    let catIndex = 0;
    for (const catData of DEFAULT_CATALOG) {
      const cat = await StoreCategory.create({
        storeId,
        name: catData.category,
        displayOrder: catIndex++,
        icon: "",
        isActive: true
      });

      let subIndex = 0;
      for (const subData of catData.subCategories) {
        const sub = await StoreSubCategory.create({
          storeId,
          categoryId: cat._id,
          name: subData.name,
          displayOrder: subIndex++,
          isActive: true
        });

        let typeIndex = 0;
        for (const typeName of subData.productTypes) {
          await StoreProductType.create({
            storeId,
            subCategoryId: sub._id,
            name: typeName,
            displayOrder: typeIndex++,
            isActive: true
          });
        }
      }
    }
    console.log(`✅ Default catalog successfully seeded for store: ${storeId}`);
  } catch (err) {
    console.error("❌ Catalog seeding error:", err.message);
  }
};

module.exports = { seedDefaultCatalog };
