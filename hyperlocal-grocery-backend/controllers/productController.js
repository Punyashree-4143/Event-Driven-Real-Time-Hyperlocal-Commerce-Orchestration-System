const Product = require("../models/Product");
const Store = require("../models/Store");

const getStoreQueryConditions = async (storeId) => {
  if (!storeId) return null;

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(storeId)) {
    return null;
  }

  try {
    const store = await Store.findById(storeId);
    if (store) {
      return store._id;
    } else {
      const storeByOwner = await Store.findOne({ owner: storeId });
      if (storeByOwner) {
        return storeByOwner._id;
      }
    }
  } catch (e) {
    try {
      const storeByOwner = await Store.findOne({ owner: storeId });
      if (storeByOwner) {
        return storeByOwner._id;
      }
    } catch (e2) {}
  }
  return storeId;
};

// ===============================
// CUSTOMER SIDE – GET PRODUCTS BY STORE
// ===============================
exports.getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log("Incoming storeId:", storeId);

    const storeConditions = await getStoreQueryConditions(storeId);
    if (!storeConditions) {
      console.log("Mongo query: N/A (invalid storeId)");
      console.log("Returned products: []");
      return res.json({ products: [] });
    }

    const query = {
      isAvailable: true,
      storeId: storeConditions
    };

    console.log("Mongo query:", JSON.stringify(query));

    const products = await Product.find(query);

    console.log("Returned products:", products.map(p => ({ name: p.name, storeId: p.storeId })));

    res.json({ products });
  } catch (err) {
    console.error("PRODUCT FETCH ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// VENDOR SIDE – GET ALL PRODUCTS
// ===============================
exports.getVendorProducts = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({
      storeId: store._id,
    });

    res.json({ products });
  } catch (err) {
    console.error("VENDOR PRODUCT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// ADD PRODUCT (VENDOR)
// ===============================
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      category,
      image,
      subCategory,
      brand,
      description,
      mrp,
      sellingPrice,
      unit,
      availableWeights,
      deliveryTime,
      isFeatured,
      isAvailable
    } = req.body;

    if (!name || (price == null && sellingPrice == null) || stock == null) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await Product.create({
      storeId: store._id,
      name,
      price: price != null ? price : sellingPrice,
      stock,
      category: category || "Others",
      image,
      subCategory,
      brand,
      description,
      mrp: mrp != null ? mrp : (sellingPrice != null ? sellingPrice : price),
      sellingPrice: sellingPrice != null ? sellingPrice : price,
      unit: unit || "kg",
      availableWeights: availableWeights || ["1 kg"],
      deliveryTime: deliveryTime || "30 mins",
      isFeatured: isFeatured === true || isFeatured === "true",
      isAvailable: isAvailable !== false && isAvailable !== "false"
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// UPDATE PRODUCT (VENDOR)
// ===============================
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("storeId");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ownership check
    if (product.storeId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(product, req.body);
    await product.save(); // triggers pre-save hook

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// DELETE PRODUCT (VENDOR)
// ===============================
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).populate("storeId");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.storeId.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// CATEGORY TAXONOMY
// ===============================
const { TAXONOMY } = require("../utils/categories");

exports.getCategories = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      return res.json([]);
    }
    res.json({ categories: TAXONOMY });
  } catch (err) {
    res.json({ categories: TAXONOMY || {} });
  }
};

// ===============================
// GET PRODUCTS BY CATEGORY
// ===============================
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { storeId, subCategory, sort } = req.query;
    console.log("Incoming storeId:", storeId);

    if (!storeId) {
      console.log("Mongo query: N/A (missing storeId)");
      console.log("Returned products: []");
      return res.status(400).json({ message: "Store ID is required" });
    }

    const storeConditions = await getStoreQueryConditions(storeId);
    if (!storeConditions) {
      console.log("Mongo query: N/A (invalid storeId)");
      console.log("Returned products: []");
      return res.json({ products: [] });
    }

    const query = { category, isAvailable: true, storeId: storeConditions };
    if (subCategory) {
      query.subCategory = subCategory;
    }

    let sortObj = {};
    if (sort === "price_asc") sortObj.price = 1;
    else if (sort === "price_desc") sortObj.price = -1;
    else if (sort === "name_asc") sortObj.name = 1;
    else if (sort === "name_desc") sortObj.name = -1;

    console.log("Mongo query:", JSON.stringify(query));

    const products = await Product.find(query).sort(sortObj);

    console.log("Returned products:", products.map(p => ({ name: p.name, storeId: p.storeId })));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// SEARCH PRODUCTS
// ===============================
exports.searchProducts = async (req, res) => {
  try {
    const { storeId, q } = req.query;
    console.log("Incoming storeId:", storeId);
    if (!q) {
      return res.json({ products: [] });
    }

    if (!storeId) {
      console.log("Mongo query: N/A (missing storeId)");
      console.log("Returned products: []");
      return res.status(400).json({ message: "Store ID is required" });
    }

    const storeConditions = await getStoreQueryConditions(storeId);
    if (!storeConditions) {
      console.log("Mongo query: N/A (invalid storeId)");
      console.log("Returned products: []");
      return res.json({ products: [] });
    }

    const searchRegex = new RegExp(q, "i");
    const query = {
      isAvailable: true,
      storeId: storeConditions,
      $or: [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subCategory: searchRegex }
      ]
    };

    console.log("Mongo query:", JSON.stringify(query));

    const products = await Product.find(query);

    console.log("Returned products:", products.map(p => ({ name: p.name, storeId: p.storeId })));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// FILTER PRODUCTS
// ===============================
exports.filterProducts = async (req, res) => {
  try {
    const { storeId, category, subCategory, brand, minPrice, maxPrice, isFeatured, search, sort } = req.query;
    console.log("Incoming storeId:", storeId);

    if (!storeId) {
      console.log("Mongo query: N/A (missing storeId)");
      console.log("Returned products: []");
      return res.status(400).json({ message: "Store ID is required" });
    }

    const storeConditions = await getStoreQueryConditions(storeId);
    if (!storeConditions) {
      console.log("Mongo query: N/A (invalid storeId)");
      console.log("Returned products: []");
      return res.json({ products: [] });
    }

    const query = { isAvailable: true, storeId: storeConditions };
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (brand) query.brand = new RegExp(brand, "i");
    if (isFeatured === "true" || isFeatured === true) query.isFeatured = true;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subCategory: searchRegex }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortObj = {};
    if (sort === "price_asc") sortObj.price = 1;
    else if (sort === "price_desc") sortObj.price = -1;
    else if (sort === "name_asc") sortObj.name = 1;
    else if (sort === "name_desc") sortObj.name = -1;

    console.log("Mongo query:", JSON.stringify(query));

    const products = await Product.find(query).sort(sortObj);

    console.log("Returned products:", products.map(p => ({ name: p.name, storeId: p.storeId })));

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

