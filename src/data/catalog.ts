import { Item } from "@/types";

export const Categories = {
  chairsAndSofas: "Chairs & Sofas",
  pooja: "Pooja Items",
  tents: "Tents & Side Walls",
  cooking: "Cooking Items",
} as const;

export const ALL_CATEGORIES = [
  Categories.chairsAndSofas,
  Categories.pooja,
  Categories.tents,
  Categories.cooking,
];

export const kCatalog: Item[] = [
  // Chairs & Sofas
  { id: "cs1", name: "Single Sofa", imageAsset: "/images/chairs_sofa_1.png", price: 1200, category: Categories.chairsAndSofas },
  { id: "cs2", name: "Plastic Chair", imageAsset: "/images/placeholder.png", price: 80, category: Categories.chairsAndSofas },

  // Pooja Items
  { id: "pj1", name: "Pooja Thali", imageAsset: "/images/pooja_1.png", price: 250, category: Categories.pooja },
  { id: "pj2", name: "Brass Diya", imageAsset: "/images/pooja2.png", price: 150, category: Categories.pooja },

  // Tents & Side Walls
  { id: "tn1", name: "Basic Tent", imageAsset: "/images/tent_1.png", price: 3000, category: Categories.tents },
  { id: "tn2", name: "Side Wall (per panel)", imageAsset: "/images/side_wall.png", price: 400, category: Categories.tents },

  // Cooking Items
  { id: "ck1", name: "Large Vessel", imageAsset: "/images/cooking_1.png", price: 900, category: Categories.cooking },
  { id: "ck2", name: "Gas Stove (2 burner)", imageAsset: "/images/gas_stove.png", price: 700, category: Categories.cooking },
];

