const CATEGORY_UNIT_MAPPING = {
  "Fruits & Vegetables": ["kg", "g"],
  "Dairy": ["liter", "ml"],
  "Packaged Goods": ["piece", "pack"],
  "Stationery": ["piece"],
  "Others": ["kg", "g", "liter", "ml", "piece", "pack"]
};

const validateCategoryUnit = (category, unit) => {
  const validUnits = CATEGORY_UNIT_MAPPING[category];
  if (!validUnits) {
    return false;
  }
  return validUnits.includes(unit);
};

const getUnitsForCategory = (category) => {
  return CATEGORY_UNIT_MAPPING[category] || [];
};

module.exports = {
  CATEGORY_UNIT_MAPPING,
  validateCategoryUnit,
  getUnitsForCategory
};
