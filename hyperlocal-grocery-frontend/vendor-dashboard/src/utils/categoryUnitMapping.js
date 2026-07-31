export const CATEGORY_UNIT_MAPPING = {
  "Fruits & Vegetables": ["kg", "g"],
  "Dairy & Breakfast": ["liter", "ml", "piece", "pack"],
  "Snacks & Beverages": ["g", "ml", "piece", "pack"],
  "Stationery": ["piece", "pack"],
  "Household Essentials": ["piece", "pack"],
  "Cleaning Supplies": ["liter", "ml", "piece", "pack"],
  "Personal Care": ["ml", "g", "piece", "pack"],
  "Baby Care": ["piece", "pack", "g", "ml"],
  "Pet Care": ["kg", "g", "piece", "pack"],
  "Frozen Foods": ["g", "kg", "pack"],
  "Bakery": ["g", "piece", "pack"],
  "Meat & Seafood": ["kg", "g"],
  "Electronics": ["piece", "pack"],
  "Home & Kitchen": ["piece", "pack"],
  "Others": ["kg", "g", "liter", "ml", "piece", "pack"]
};

export const CATEGORIES = Object.keys(CATEGORY_UNIT_MAPPING);

export const getUnitsForCategory = (category) => {
  return CATEGORY_UNIT_MAPPING[category] || [];
};

export const validateCategoryUnit = (category, unit) => {
  const validUnits = CATEGORY_UNIT_MAPPING[category];
  if (!validUnits) {
    return false;
  }
  return validUnits.includes(unit);
};
