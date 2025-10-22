import { Item } from "@/types";

export const Categories = {
  chairsAndSofas: "Chairs & Sofas",
  shamiyanas: "Shamiyanas",
  pandiri: "Pandiri",
  backdropsAndSideWalls: "Backdrops & Sidewalls",
  floorCarpets: "Floor Carpets",
  poojaItems: "Pooja Items",
  fansAndCoolers: "Fans & Coolers",
  tablesAndStage: "Tables & Stage",
  dabarlu: "Dabarlu/Vessels",
  lightings: "Lightings",
  cookingAndServingItems: "Cooking & Serving Items",
  specialItems: "Special Items",
} as const;

export const ALL_CATEGORIES = [
  Categories.chairsAndSofas,
  Categories.shamiyanas,
  Categories.pandiri,
  Categories.backdropsAndSideWalls,
  Categories.floorCarpets,
  Categories.poojaItems,
  Categories.fansAndCoolers,
  Categories.tablesAndStage,
  Categories.dabarlu,
  Categories.lightings,
  Categories.cookingAndServingItems,
  Categories.specialItems,
];

// ✅ Catalog Data
export const kCatalog: Item[] = [
  // ─────────────────────────── Shamiyanas ───────────────────────────
  { id: "sha1", name: "12x9 Shamiyana", imageAssets: ["./images/shamiyana1.jpg","./images/placeholder.jpeg","./images/placeholder.jpeg"], previewImage: "/images/placeholder.jpeg", price: 599, category: Categories.shamiyanas },
  { id: "sha2", name: "12x12 Shamiyana", imageAssets: ["./images/shamiyana2.jpg"], price: 599, category: Categories.shamiyanas },
  { id: "sha3", name: "15x12 Shamiyana", imageAssets: ["./images/shamiyana3.jpg"], price: 599, category: Categories.shamiyanas },
  { id: "sha4", name: "18x9 Shamiyana", imageAssets: ["./images/shamiyana1.jpg"], price: 799, category: Categories.shamiyanas },
  { id: "sha5", name: "18x12 Shamiyana", imageAssets: ["./images/shamiyana2.jpg"], price: 899, category: Categories.shamiyanas },
  { id: "sha6", name: "24x12 Shamiyana", imageAssets: ["./images/shamiyana3.jpg"], price: 999, category: Categories.shamiyanas },
  { id: "sha7", name: "30x15 Shamiyana", imageAssets: ["./images/shamiyana1.jpg"], price: 1199, category: Categories.shamiyanas },
  { id: "sha8", name: "36x18 Shamiyana", imageAssets: ["./images/shamiyana2.jpg"], price: 1399, category: Categories.shamiyanas },
  { id: "sha9", name: "30x30 Jumbo Shamiyana", imageAssets: ["./images/shamiyana3.jpg"], price: 2999, category: Categories.shamiyanas },
  { id: "sha10", name: "36x36 Jumbo Shamiyana", imageAssets: ["./images/shamiyana1.jpg"], price: 3999, category: Categories.shamiyanas },
  { id: "sha11", name: "24x12 Waterproof Shamiyana", imageAssets: ["./images/shamiyana2.jpg"], price: 1999, category: Categories.shamiyanas },
  { id: "sha12", name: "24x18 Waterproof Shamiyana", imageAssets: ["./images/shamiyana3.jpg"], price: 2499, category: Categories.shamiyanas },
  { id: "sha13", name: "30x15 Waterproof Shamiyana", imageAssets: ["./images/shamiyana1.jpg"], price: 2999, category: Categories.shamiyanas },
  { id: "sha14", name: "36x18 Waterproof Shamiyana", imageAssets: ["./images/shamiyana2.jpg"], price: 3500, category: Categories.shamiyanas },
  { id: "sha15", name: "30x30 Waterproof Shamiyana", imageAssets: ["./images/shamiyana3.jpg"], price: 3999, category: Categories.shamiyanas },

  // ─────────────────────────── Pandiri ───────────────────────────
  { id: "pan1", name: "12x12 Pandiri", imageAssets: ["./images/Pandiri/"], price: 1199, category: Categories.pandiri },
  { id: "pan2", name: "15x12 Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 1399, category: Categories.pandiri },
  { id: "pan3", name: "15x15 Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 1799, category: Categories.pandiri },
  { id: "pan4", name: "18x12 Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 1799, category: Categories.pandiri },
  { id: "pan5", name: "18x15 Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 1999, category: Categories.pandiri },
  { id: "pan6", name: "18x18 Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 2499, category: Categories.pandiri },
  { id: "pan7", name: "12x12 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 2499, category: Categories.pandiri },
  { id: "pan8", name: "15x12 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 2999, category: Categories.pandiri },
  { id: "pan9", name: "15x15 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 3499, category: Categories.pandiri },
  { id: "pan10", name: "18x12 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 3999, category: Categories.pandiri },
  { id: "pan11", name: "18x15 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 4499, category: Categories.pandiri },
  { id: "pan12", name: "18x18 Waterproof Pandiri", imageAssets: ["./images/shamiyana3.jpg"], price: 4999, category: Categories.pandiri },

  // ─────────────────────────── Pooja Items ───────────────────────────
  { id: "pi1", name: "Wood Mandapam", imageAssets: ["./images/PoojaItems/WoodMandapam.jpg"], price: 500, category: Categories.poojaItems },
  { id: "pi2", name: "Metal Mandapam", imageAssets: ["./images/PoojaItems/Metal Mandapam.jpg"], price: 799, category: Categories.poojaItems },
  { id: "pi3", name: "Homam", imageAssets: ["./images/PoojaItems/Homam.jpg"], price: 200, category: Categories.poojaItems },
  { id: "pi4", name: "Peeta", imageAssets: ["./images/PoojaItems/Peeta.jpg"], price: 50, category: Categories.poojaItems },
  { id: "pi5", name: "1F Kundena", imageAssets: ["./images/PoojaItems/Kundena.jpg"], price: 50, category: Categories.poojaItems },
  { id: "pi6", name: "1.5F Kundena", imageAssets: ["./images/PoojaItems/Kundena1.jpg"], price: 100, category: Categories.poojaItems },
  { id: "pi7", name: "2F Kundena", imageAssets: ["./images/PoojaItems/kundena2.jpeg"], price: 150, category: Categories.poojaItems },
  { id: "pi8", name: "3.5F Kundena", imageAssets: ["./images/PoojaItems/Kundena3.jpg"], price: 300, category: Categories.poojaItems },

  // ─────────────────────────── Backdrops & Sidewalls ───────────────────────────
  { id: "bs1", name: "Side Curtain 1", imageAssets: ["./images/shamiyana3.jpg"], price: 499, category: Categories.backdropsAndSideWalls },
  { id: "bs2", name: "Side Curtain 2", imageAssets: ["./images/shamiyana3.jpg"], price: 600, category: Categories.backdropsAndSideWalls },
  { id: "bs3", name: "Colour Curtain 15F", imageAssets: ["./images/shamiyana3.jpg"], price: 50, category: Categories.backdropsAndSideWalls },
  { id: "bs4", name: "Colour Curtain 30F", imageAssets: ["./images/shamiyana3.jpg"], price: 100, category: Categories.backdropsAndSideWalls },
  { id: "bs5", name: "White Curtain 15F", imageAssets: ["./images/shamiyana3.jpg"], price: 100, category: Categories.backdropsAndSideWalls },
  { id: "bs6", name: "White Curtain 30F", imageAssets: ["./images/shamiyana3.jpg"], price: 200, category: Categories.backdropsAndSideWalls },

  // ─────────────────────────── Chairs & Sofas ───────────────────────────
  { id: "cs1", name: "Blue Chair", imageAssets: ["./images/placeholder.jpeg"], price: 5, category: Categories.chairsAndSofas },
  { id: "cs2", name: "White Chair", imageAssets: ["./images/placeholder.jpeg"], price: 10, category: Categories.chairsAndSofas },
  { id: "cs3", name: "HL Chair with Cloth", imageAssets: ["./images/placeholder.jpeg"], price: 20, category: Categories.chairsAndSofas },
  { id: "cs4", name: "Handle Chair with Cloth", imageAssets: ["./images/placeholder.jpeg"], price: 20, category: Categories.chairsAndSofas },
  { id: "cs5", name: "Steel Sofa", imageAssets: ["./images/placeholder.jpeg"], price: 299, category: Categories.chairsAndSofas },
  { id: "cs6", name: "Steel Sofa with Cloth", imageAssets: ["./images/placeholder.jpeg"], price: 399, category: Categories.chairsAndSofas },
  { id: "cs7", name: "Single Raja Chair (1)", imageAssets: ["./images/placeholder.jpeg"], price: 499, category: Categories.chairsAndSofas },
  { id: "cs8", name: "Double Raja Sofa (1)", imageAssets: ["./images/placeholder.jpeg"], price: 999, category: Categories.chairsAndSofas },

  // ─────────────────────────── Tables & Stage ───────────────────────────
  { id: "tss1", name: "Single Stall Set", imageAssets: ["./images/placeholder.jpeg"], price: 399, category: Categories.tablesAndStage },
  { id: "tss2", name: "Double Stall Set", imageAssets: ["./images/placeholder.jpeg"], price: 799, category: Categories.tablesAndStage },
  { id: "tss3", name: "Dining Table", imageAssets: ["./images/placeholder.jpeg"], price: 50, category: Categories.tablesAndStage },
  { id: "tss4", name: "Round Table", imageAssets: ["./images/placeholder.jpeg"], price: 299, category: Categories.tablesAndStage },
  { id: "tss5", name: "3x3 1F Stage", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.tablesAndStage },
  { id: "tss6", name: "4x4 3F Stage", imageAssets: ["./images/placeholder.jpeg"], price: 300, category: Categories.tablesAndStage },

  // ─────────────────────────── Floor Carpets ───────────────────────────
  { id: "fc1", name: "15x6 Green Mat", imageAssets: ["./images/placeholder.jpeg"], price: 250, category: Categories.floorCarpets },
  { id: "fc2", name: "30x6 Green Mat", imageAssets: ["./images/placeholder.jpeg"], price: 250, category: Categories.floorCarpets },
  { id: "fc3", name: "12x6 Jamkanam", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.floorCarpets },
  { id: "fc4", name: "12x9 Tiwachi", imageAssets: ["./images/placeholder.jpeg"], price: 500, category: Categories.floorCarpets },

  // ─────────────────────────── Fans & Coolers ───────────────────────────
  { id: "fac1", name: "Fan", imageAssets: ["./images/placeholder.jpeg"], price: 150, category: Categories.fansAndCoolers },
  { id: "fac2", name: "Mini Cooler", imageAssets: ["./images/placeholder.jpeg"], price: 500, category: Categories.fansAndCoolers },
  { id: "fac3", name: "Jumbo Cooler", imageAssets: ["./images/placeholder.jpeg"], price: 1500, category: Categories.fansAndCoolers },

  // ─────────────────────────── Special Items ───────────────────────────
  { id: "spi1", name: "Uyyala", imageAssets: ["./images/placeholder.jpeg"], price: 599, category: Categories.specialItems },
  { id: "spi2", name: "Tea Flask", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.specialItems },
  { id: "spi3", name: "Podium", imageAssets: ["./images/placeholder.jpeg"], price: 500, category: Categories.specialItems },
  { id: "spi4", name: "Wash Basin", imageAssets: ["./images/placeholder.jpeg"], price: 300, category: Categories.specialItems },
  { id: "spi5", name: "Water Drum", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.specialItems },
  { id: "spi6", name: "Dust Bin", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.specialItems },
  { id: "spi7", name: "Haldi Set", imageAssets: ["./images/placeholder.jpeg"], price: 2500, category: Categories.specialItems },
  { id: "spi8", name: "Teapoy", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.specialItems },

  // ─────────────────────────── Lightings ───────────────────────────
  { id: "L1", name: "Lamp", imageAssets: ["./images/placeholder.jpeg"], price: 300, category: Categories.lightings },
  { id: "L2", name: "90F Thoranalu", imageAssets: ["./images/placeholder.jpeg"], price: 999, category: Categories.lightings },

  // ─────────────────────────── Dabarlu/Vessels ───────────────────────────
  { id: "d1", name: "5kg Dabara", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.dabarlu },
  { id: "d2", name: "10kg Dabara", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.dabarlu },
  { id: "d3", name: "15kg Dabara", imageAssets: ["./images/placeholder.jpeg"], price: 200, category: Categories.dabarlu },
  { id: "d4", name: "20kg Dabara", imageAssets: ["./images/placeholder.jpeg"], price: 200, category: Categories.dabarlu },
  { id: "d5", name: "30kg Dabara", imageAssets: ["./images/placeholder.jpeg"], price: 250, category: Categories.dabarlu },

  // ─────────────────────────── Cooking & Serving Items ───────────────────────────
  { id: "csi1", name: "Gangalam", imageAssets: ["./images/placeholder.jpeg"], price: 150, category: Categories.cookingAndServingItems },
  { id: "csi2", name: "Ring Stand", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi3", name: "Theddu", imageAssets: ["./images/placeholder.jpeg"], price: 50, category: Categories.cookingAndServingItems },
  { id: "csi4", name: "Jelly Garite", imageAssets: ["./images/placeholder.jpeg"], price: 50, category: Categories.cookingAndServingItems },
  { id: "csi5", name: "Kuripi", imageAssets: ["./images/placeholder.jpeg"], price: 50, category: Categories.cookingAndServingItems },
  { id: "csi6", name: "Bandili", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi7", name: "Jangiri Bandili", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi8", name: "No.1 Pallem", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi9", name: "Sweet Tray", imageAssets: ["./images/placeholder.jpeg"], price: 80, category: Categories.cookingAndServingItems },
  { id: "csi10", name: "Bucket", imageAssets: ["./images/placeholder.jpeg"], price: 30, category: Categories.cookingAndServingItems },
  { id: "csi11", name: "Deesu", imageAssets: ["./images/placeholder.jpeg"], price: 30, category: Categories.cookingAndServingItems },
  { id: "csi12", name: "Jug", imageAssets: ["./images/placeholder.jpeg"], price: 30, category: Categories.cookingAndServingItems },
  { id: "csi13", name: "Garite", imageAssets: ["./images/placeholder.jpeg"], price: 10, category: Categories.cookingAndServingItems },
  { id: "csi14", name: "Fiber Plate", imageAssets: ["./images/placeholder.jpeg"], price: 5, category: Categories.cookingAndServingItems },
  { id: "csi15", name: "Kaada Ginne", imageAssets: ["./images/placeholder.jpeg"], price: 50, category: Categories.cookingAndServingItems },
  { id: "csi16", name: "Idly Patra", imageAssets: ["./images/placeholder.jpeg"], price: 300, category: Categories.cookingAndServingItems },
  { id: "csi17", name: "Single Gas Stove", imageAssets: ["./images/placeholder.jpeg"], price: 150, category: Categories.cookingAndServingItems },
  { id: "csi18", name: "Double Gas Stove", imageAssets: ["./images/placeholder.jpeg"], price: 200, category: Categories.cookingAndServingItems },
  { id: "csi19", name: "15ltr Hot Box", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi20", name: "20ltr Hot Box", imageAssets: ["./images/placeholder.jpeg"], price: 150, category: Categories.cookingAndServingItems },
  { id: "csi21", name: "10ltr Hot Box", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
  { id: "csi22", name: "Grinder", imageAssets: ["./images/placeholder.jpeg"], price: 600, category: Categories.cookingAndServingItems },
  { id: "csi23", name: "Dosa Stove", imageAssets: ["./images/placeholder.jpeg"], price: 1200, category: Categories.cookingAndServingItems },
  { id: "csi24", name: "Water Drum", imageAssets: ["./images/placeholder.jpeg"], price: 100, category: Categories.cookingAndServingItems },
];
