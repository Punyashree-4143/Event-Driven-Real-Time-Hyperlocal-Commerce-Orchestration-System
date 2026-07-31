const Product = require("../models/Product");
const Store = require("../models/Store");
const StoreCategory = require("../models/StoreCategory");
const StoreSubCategory = require("../models/StoreSubCategory");
const StoreProductType = require("../models/StoreProductType");

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
// ON-THE-FLY AUTOMATIC MIGRATION
// ===============================
const migrateStoreProducts = async (storeId) => {
  try {
    const products = await Product.find({ storeId });
    for (const p of products) {
      let changed = false;

      // 1. Map Category
      if (!p.categoryId) {
        const catName = p.category || "Others";
        let cat = await StoreCategory.findOne({ storeId, name: catName });
        if (!cat) {
          cat = await StoreCategory.create({
            storeId,
            name: catName,
            displayOrder: await StoreCategory.countDocuments({ storeId }),
            icon: "",
            isActive: true
          });
        }
        p.categoryId = cat._id;
        p.category = cat.name;
        changed = true;
      }

      // 2. Map SubCategory
      if (!p.subCategoryId) {
        const cat = await StoreCategory.findById(p.categoryId);
        const subName = p.subCategory || (cat ? cat.name : "General");
        let sub = await StoreSubCategory.findOne({ storeId, categoryId: p.categoryId, name: subName });
        if (!sub) {
          sub = await StoreSubCategory.create({
            storeId,
            categoryId: p.categoryId,
            name: subName,
            displayOrder: await StoreSubCategory.countDocuments({ storeId, categoryId: p.categoryId }),
            isActive: true
          });
        }
        p.subCategoryId = sub._id;
        p.subCategory = sub.name;
        changed = true;
      }

      // 3. Map Product Type
      if (!p.productTypeId) {
        const sub = await StoreSubCategory.findById(p.subCategoryId);
        const typeName = sub ? sub.name : "General";
        let type = await StoreProductType.findOne({ storeId, subCategoryId: p.subCategoryId, name: typeName });
        if (!type) {
          type = await StoreProductType.create({
            storeId,
            subCategoryId: p.subCategoryId,
            name: typeName,
            displayOrder: await StoreProductType.countDocuments({ storeId, subCategoryId: p.subCategoryId }),
            isActive: true
          });
        }
        p.productTypeId = type._id;
        changed = true;
      }

      if (changed) {
        await p.save();
      }
    }
  } catch (err) {
    console.error("❌ Product migration error:", err.message);
  }
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

    // Trigger migration helper
    await migrateStoreProducts(storeConditions);

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

    // Trigger migration helper
    await migrateStoreProducts(store._id);

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


const validateProductData = (data) => {
  const { name, category, subCategory, image, mrp, sellingPrice, stock, variants } = data;

  if (!name || !name.trim()) return "Product Name is required";
  if (!category || !category.trim()) return "Category is required";
  if (!subCategory || !subCategory.trim()) return "Subcategory is required";
  if (!image || !image.trim()) return "Primary Image URL is required";

  if (variants && variants.length > 0) {
    for (const v of variants) {
      if (!v.weight || !v.weight.trim()) return "Variant weight is required";
      if (v.price == null || v.mrp == null) return "Variant price and MRP are required";
      if (Number(v.price) < 0 || Number(v.mrp) < 0) return "Variant price and MRP must be positive numbers";
      if (Number(v.price) > Number(v.mrp)) return "Variant Selling Price cannot be greater than MRP";
      if (Number(v.stock) < 0) return "Variant stock cannot be negative";
    }
  } else {
    if (sellingPrice != null && mrp != null && Number(sellingPrice) > Number(mrp)) {
      return "Selling Price cannot be greater than MRP";
    }
    if (stock != null && Number(stock) < 0) {
      return "Stock cannot be negative";
    }
  }
  return null;
};

// ===============================
// ADD PRODUCT (VENDOR)
// ===============================
exports.addProduct = async (req, res) => {
  try {
    const valError = validateProductData(req.body);
    if (valError) {
      return res.status(400).json({ message: valError });
    }

    const {
      name,
      price,
      mrp,
      sellingPrice,
      stock,
      category,
      image,
      subCategory,
      brand,
      description,
      unit,
      availableWeights,
      deliveryTime,
      isFeatured,
      isAvailable,
      sku,
      barcode,
      images,
      categoryId,
      subCategoryId,
      productTypeId,
      productType,
      shelfLife,
      countryOfOrigin,
      manufacturer,
      storageInstructions,
      nutrition,
      attributes,
      variants
    } = req.body;

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    let finalPrice = price != null ? price : sellingPrice;
    let finalSellingPrice = sellingPrice != null ? sellingPrice : price;
    let finalMrp = mrp != null ? mrp : finalSellingPrice;
    let finalStock = stock != null ? stock : 0;
    let finalWeights = availableWeights || ["1 kg"];

    if (variants && variants.length > 0) {
      finalWeights = variants.map(v => v.weight);
      finalStock = variants.reduce((sum, v) => sum + Number(v.stock), 0);
      const firstVar = variants[0];
      finalPrice = Number(firstVar.price);
      finalSellingPrice = Number(firstVar.price);
      finalMrp = Number(firstVar.mrp);
    }

    const product = await Product.create({
      storeId: store._id,
      name,
      price: finalPrice,
      stock: finalStock,
      category: category || "Others",
      image: image || "",
      subCategory: subCategory || "",
      brand: brand || "",
      description: description || "",
      mrp: finalMrp,
      sellingPrice: finalSellingPrice,
      unit: unit || "kg",
      availableWeights: finalWeights,
      deliveryTime: deliveryTime || "30 mins",
      isFeatured: isFeatured === true || isFeatured === "true",
      isAvailable: isAvailable !== false && isAvailable !== "false",
      sku: sku || "",
      barcode: barcode || "",
      images: images || [],
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      productTypeId: productTypeId || null,
      productType: productType || "",
      shelfLife: shelfLife || "",
      countryOfOrigin: countryOfOrigin || "",
      manufacturer: manufacturer || "",
      storageInstructions: storageInstructions || "",
      nutrition: nutrition || {},
      attributes: attributes || {},
      variants: variants || []
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
    const valError = validateProductData(req.body);
    if (valError) {
      return res.status(400).json({ message: valError });
    }

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

    // Trigger migration helper
    await migrateStoreProducts(storeConditions);

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

    // Trigger migration helper
    await migrateStoreProducts(storeConditions);

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
    const { storeId, category, subCategory, brand, minPrice, maxPrice, isFeatured, search, sort, categoryId, subCategoryId, productTypeId } = req.query;
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

    // Trigger migration helper
    await migrateStoreProducts(storeConditions);

    const query = { isAvailable: true, storeId: storeConditions };
    
    if (categoryId) {
      query.categoryId = categoryId;
    } else if (category) {
      query.category = category;
    }

    if (subCategoryId) {
      query.subCategoryId = subCategoryId;
    } else if (subCategory) {
      query.subCategory = subCategory;
    }

    if (productTypeId) {
      query.productTypeId = productTypeId;
    }

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

// ===============================
// GET PRODUCT BY ID (CUSTOMER)
// ===============================
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const product = await Product.findById(productId).populate("storeId");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product });
  } catch (err) {
    console.error("GET PRODUCT BY ID ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
