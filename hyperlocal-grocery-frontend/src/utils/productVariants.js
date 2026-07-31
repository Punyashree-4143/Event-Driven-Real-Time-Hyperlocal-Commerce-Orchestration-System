export const getVariantsForUnit = (unit) => {
  switch (unit) {
    case "kg":
      return ["250 g", "500 g", "1 kg"];
    case "g":
      return ["100 g", "250 g", "500 g"];
    case "liter":
      return ["250 ml", "500 ml", "1 liter"];
    case "ml":
      return ["100 ml", "250 ml", "500 ml"];
    case "piece":
      return ["1 piece", "2 pieces", "5 pieces"];
    case "pack":
      return ["1 pack", "2 packs", "5 packs"];
    default:
      return ["1 unit"];
  }
};

export const getDisplayPrice = (price, variant, baseUnit) => {
  // Convert variant to base unit multiplier
  let multiplier = 1;
  
  if (variant.includes("250") && baseUnit === "kg") multiplier = 0.25;
  else if (variant.includes("500") && baseUnit === "kg") multiplier = 0.5;
  else if (variant.includes("250") && baseUnit === "liter") multiplier = 0.25;
  else if (variant.includes("500") && baseUnit === "liter") multiplier = 0.5;
  else if (variant.includes("100") && baseUnit === "g") multiplier = 0.1;
  else if (variant.includes("250") && baseUnit === "g") multiplier = 0.25;
  else if (variant.includes("500") && baseUnit === "g") multiplier = 0.5;
  else if (variant.includes("100") && baseUnit === "ml") multiplier = 0.1;
  else if (variant.includes("250") && baseUnit === "ml") multiplier = 0.25;
  else if (variant.includes("500") && baseUnit === "ml") multiplier = 0.5;
  else if (variant.includes("2") && baseUnit === "piece") multiplier = 2;
  else if (variant.includes("5") && baseUnit === "piece") multiplier = 5;
  else if (variant.includes("2") && baseUnit === "pack") multiplier = 2;
  else if (variant.includes("5") && baseUnit === "pack") multiplier = 5;
  
  return Math.round(price * multiplier);
};
