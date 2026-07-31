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

    variants: [
      {
        weight: { type: String, required: true }, // e.g. "250g", "500g", "1kg", "Pieces", "Packets"
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        stock: { type: Number, required: true, default: 0 },
      }
    ],

    deliveryTime: {
      type: String,
      default: "30 mins",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sku: {
      type: String,
      default: "",
    },

    barcode: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreCategory",
      default: null,
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreSubCategory",
      default: null,
    },

    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreProductType",
      default: null,
    },

    productType: {
      type: String,
      default: "",
    },

    shelfLife: {
      type: String,
      default: "",
    },

    countryOfOrigin: {
      type: String,
      default: "",
    },

    manufacturer: {
      type: String,
      default: "",
    },

    storageInstructions: {
      type: String,
      default: "",
    },

    nutrition: {
      energy: { type: String, default: "" },
      protein: { type: String, default: "" },
      carbohydrates: { type: String, default: "" },
      fat: { type: String, default: "" },
      fiber: { type: String, default: "" },
      sugar: { type: String, default: "" },
      sodium: { type: String, default: "" },
      vitaminC: { type: String, default: "" },
      calcium: { type: String, default: "" },
      iron: { type: String, default: "" }
    },

    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.availableWeights = this.variants.map(v => v.weight);
    this.stock = this.variants.reduce((sum, v) => sum + Number(v.stock), 0);
    const firstVar = this.variants[0];
    this.price = Number(firstVar.price);
    this.sellingPrice = Number(firstVar.price);
    this.mrp = Number(firstVar.mrp);
  } else {
    // Sync sellingPrice and price to avoid breaking existing logic
    if (this.sellingPrice != null) {
      this.price = this.sellingPrice;
    } else if (this.price != null) {
      this.sellingPrice = this.price;
    }

    if (this.mrp == null && this.sellingPrice != null) {
      this.mrp = this.sellingPrice;
    }
  }

  // Update availability based on stock
  if (this.stock <= 0) {
    this.isAvailable = false;
  } else if (this.isAvailable === undefined) {
    this.isAvailable = true;
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);

