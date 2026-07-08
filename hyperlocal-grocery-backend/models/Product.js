const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      default: "Others",
    },

    image: {
      type: String, // image URL
    },

    stock: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    subCategory: {
      type: String,
      default: "",
    },

    brand: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    mrp: {
      type: Number,
      default: 0,
    },

    sellingPrice: {
      type: Number,
      default: 0,
    },

    unit: {
      type: String,
      default: "kg",
    },

    availableWeights: {
      type: [String],
      default: ["1 kg"],
    },

    deliveryTime: {
      type: String,
      default: "30 mins",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🔥 Auto-update availability based on stock, and sync price/sellingPrice
productSchema.pre("save", function (next) {
  if (this.stock <= 0) {
    this.isAvailable = false;
  } else if (this.isAvailable === undefined) {
    this.isAvailable = true;
  }

  // Map legacy category names to parent and subcategory
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

  if (this.category && legacyMap[this.category]) {
    const mapped = legacyMap[this.category];
    this.category = mapped.category;
    this.subCategory = mapped.subCategory;
  }

  if (!this.category) {
    this.category = "Others";
  }

  // Sync sellingPrice and price to avoid breaking existing logic
  if (this.sellingPrice != null) {
    this.price = this.sellingPrice;
  } else if (this.price != null) {
    this.sellingPrice = this.price;
  }

  if (this.mrp == null && this.sellingPrice != null) {
    this.mrp = this.sellingPrice;
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);

