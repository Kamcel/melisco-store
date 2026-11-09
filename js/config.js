/**
 * config.js — Central Configuration & Utilities
 * ===============================================
 * Central store settings, Supabase connection details,
 * category taxonomy, and shared helper utilities.
 */

// ─────────────────────────────────────────────
// 1. CENTRAL STORE CONFIGURATION
// Update these details to change your store branding,
// contact channels and social media presence.
// ─────────────────────────────────────────────
const STORE_CONFIG = {
  name: "Melisco Gadgets",
  tagline: "Quality New & Fairly Used Gadgets in Nigeria",
  description: "Your trusted destination for thoroughly tested smartphones, high-performance laptops, premium audio, and authentic electronics.",
  
  // WhatsApp phone number in international format without '+' or leading '0'
  // Example for Nigeria (+234): '2348012345678'
  whatsappNumber: "2348000000000",
  
  email: "hello@meliscogadgets.ng",
  address: "Computer Village, Ikeja, Lagos, Nigeria",
  
  // Social media profiles (set to "#" or custom URL)
  instagram: "https://instagram.com/meliscogadgets",
  facebook: "https://facebook.com/meliscogadgets",
  twitter: "https://twitter.com/meliscogadgets",
  
  // Currency formatting
  currency: {
    symbol: "₦",
    code: "NGN",
    locale: "en-NG",
  },
  
  // Free delivery or delivery terms notice
  deliveryNote: "Nationwide delivery available. Delivery fee confirmed via WhatsApp.",
};

// ─────────────────────────────────────────────
// 2. SUPABASE BACKEND CONFIGURATION
// Enter your Supabase Project URL and Anon Public Key here.
// Find these in your Supabase Dashboard: Project Settings > API
//
// NOTE: Only public anon keys belong here. NEVER place your
// service-role key or database password in frontend JavaScript!
// ─────────────────────────────────────────────
const SUPABASE_CONFIG = {
  url: "", // e.g. "https://xyzcompany.supabase.co"
  anonKey: "", // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  storageBucket: "product-images",
};

// ─────────────────────────────────────────────
// 3. CATEGORIES & TAXONOMY
// ─────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "smartphones",
    label: "Smartphones",
    icon: "📱",
    description: "New & clean used iPhones & Android",
    image: "assets/images/products/galaxy-s24-fe-demo.jpg",
    subcategories: [
      { id: "iphone", label: "iPhones" },
      { id: "android", label: "Android Phones" },
    ],
  },
  {
    id: "laptops",
    label: "Laptops",
    icon: "💻",
    description: "Windows laptops & MacBooks",
    image: "assets/images/products/hp-elitebook-840-demo.jpg",
    subcategories: [
      { id: "windows", label: "Windows Laptops" },
      { id: "macbook", label: "MacBooks" },
    ],
  },
  {
    id: "tablets",
    label: "Tablets",
    icon: "⬛",
    description: "iPads & Android Tablets",
    image: "assets/images/products/ipad-10th-gen-demo.jpg",
    subcategories: [
      { id: "ipad", label: "iPads" },
      { id: "android", label: "Android Tablets" },
    ],
  },
  {
    id: "audio",
    label: "Audio & Sound",
    icon: "🎧",
    description: "Earbuds, speakers & headphones",
    image: "assets/images/products/oraimo-freepods-demo.jpg",
    subcategories: [
      { id: "earbuds", label: "Wireless Earbuds" },
      { id: "speaker", label: "Bluetooth Speakers" },
      { id: "headphones", label: "Headphones" },
    ],
  },
  {
    id: "wearables",
    label: "Smartwatches",
    icon: "⌚",
    description: "Apple Watch, Galaxy Watch & fitness bands",
    image: "assets/images/products/galaxy-watch-6-demo.jpg",
    subcategories: [
      { id: "smartwatch", label: "Smartwatches" },
      { id: "fitness", label: "Fitness Trackers" },
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "🔌",
    description: "Fast chargers, power banks, cases & cables",
    image: "assets/images/products/baseus-powerbank-demo.jpg",
    subcategories: [
      { id: "charger", label: "Chargers & Adapters" },
      { id: "powerbank", label: "Power Banks" },
      { id: "cable", label: "Cables" },
      { id: "case", label: "Cases & Protection" },
    ],
  },
];

// ─────────────────────────────────────────────
// 4. SHARED UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Format numeric amount into Nigerian Naira currency format (e.g., ₦450,000)
 */
function formatPrice(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${STORE_CONFIG.currency.symbol}0`;
  }
  return (
    STORE_CONFIG.currency.symbol +
    Number(amount).toLocaleString(STORE_CONFIG.currency.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

/**
 * Clean & validate phone number for WhatsApp link
 */
function isConfiguredWhatsApp(number) {
  if (!number) return false;
  const cleaned = String(number).replace(/[^0-9]/g, "");
  // Must be at least 10 digits and not the placeholder
  return cleaned.length >= 10 && cleaned !== "2348000000000";
}

/**
 * Fallback neutral placeholder image
 */
const PLACEHOLDER_IMAGE = "assets/images/placeholder.svg";

/**
 * Safe image URL helper (resolves relative vs Supabase storage URL)
 */
function resolveProductImage(url) {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return PLACEHOLDER_IMAGE;
  }
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") || url.startsWith("assets/")) {
    return url;
  }
  // If stored in assets relative path
  return url;
}
