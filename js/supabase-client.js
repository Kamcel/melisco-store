/**
 * supabase-client.js — Backend Data Layer
 * =========================================
 * Manages all communication with Supabase PostgreSQL,
 * Supabase Auth, and Supabase Storage.
 *
 * Includes an automated Local Storage fallback adapter
 * so the application works seamlessly offline or before
 * the Supabase project credentials are set up.
 */

const Database = (() => {
  let client = null;
  let isConnected = false;

  // Local storage fallback key
  const LOCAL_STORAGE_PRODUCTS_KEY = "melisco_catalog_products";
  const LOCAL_STORAGE_SESSION_KEY = "melisco_admin_demo_session";

  // ── Initial Seed Data for Instant Local Fallback ──────────────────────────
  const SEED_PRODUCTS = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Apple iPhone 11 – 128GB (Purple)",
      brand: "Apple",
      model: "iPhone 11",
      category: "smartphones",
      subcategory: "iphone",
      price: 260000,
      condition: "Fairly Used",
      model_age: "Older Model",
      inventory_type: "individual",
      stock_quantity: 1,
      battery_health: 86,
      cosmetic_condition: "Clean 9/10, minimal pocket signs on rim, screen pristine with protector",
      faults: "None. Face ID, True Tone, cameras, speakers 100% verified",
      accessories_included: "Comes with fast-charging cable and transparent protective case",
      description: "Authentic UK-used iPhone 11 Purple in excellent condition. Factory unlocked to all Nigerian networks. Tested thoroughly with 14-day warranty.",
      specs: {
        "Storage": "128 GB",
        "RAM": "4 GB",
        "Battery Health": "86%",
        "Display": "6.1-inch Liquid Retina HD",
        "Cameras": "12 MP dual wide/ultra-wide",
        "Chip": "A13 Bionic",
        "SIM": "Physical Nano-SIM + eSIM"
      },
      images: [
        "assets/images/products/iphone-11-purple-demo.jpg",
        "assets/images/products/iphone-11-purple-demo-2.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: "11111111-1111-4111-8111-222222222222",
      name: "Apple iPhone 11 – 64GB (Space Black)",
      brand: "Apple",
      model: "iPhone 11",
      category: "smartphones",
      subcategory: "iphone",
      price: 235000,
      condition: "Fairly Used",
      model_age: "Older Model",
      inventory_type: "individual",
      stock_quantity: 1,
      battery_health: 81,
      cosmetic_condition: "Clean 8.5/10, slight paint wear near charging port, zero screen cracks",
      faults: "None. All sensors & buttons tested working",
      accessories_included: "Comes with Lightning cable",
      description: "Budget-friendly UK-used iPhone 11 Space Black. Solid battery performance, crisp cameras, perfect for daily social media and business use.",
      specs: {
        "Storage": "64 GB",
        "RAM": "4 GB",
        "Battery Health": "81%",
        "Display": "6.1-inch Liquid Retina HD",
        "Cameras": "12 MP dual wide/ultra-wide",
        "Chip": "A13 Bionic"
      },
      images: [
        "assets/images/products/iphone-11-black-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 30).toISOString()
    },
    {
      id: "22222222-2222-4222-8222-111111111111",
      name: "Samsung Galaxy S24 FE 5G (256GB)",
      brand: "Samsung",
      model: "Galaxy S24 FE",
      category: "smartphones",
      subcategory: "android",
      price: 420000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 5,
      battery_health: null,
      cosmetic_condition: "Factory sealed box with Samsung original warranty tamper seal intact",
      faults: null,
      accessories_included: "Full original retail pack: USB-C to USB-C cable, SIM ejector tool, manuals",
      description: "Brand new factory sealed Samsung Galaxy S24 FE with Galaxy AI features, pro-grade 50MP triple camera system and super bright 120Hz Dynamic AMOLED display.",
      specs: {
        "Storage": "256 GB",
        "RAM": "8 GB",
        "Display": "6.7-inch Dynamic AMOLED 2X, 120Hz",
        "Processor": "Exynos 2400e",
        "Battery": "4,700 mAh",
        "Cameras": "50 MP + 12 MP + 8 MP 3x Optical"
      },
      images: [
        "assets/images/products/galaxy-s24-fe-demo.jpg",
        "assets/images/products/galaxy-s24-fe-demo-2.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: "33333333-3333-4333-8333-111111111111",
      name: "Apple iPhone 15 Pro Max – 256GB Natural Titanium",
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      category: "smartphones",
      subcategory: "iphone",
      price: 1250000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 3,
      battery_health: null,
      cosmetic_condition: "Brand new in sealed box with Apple 1-Year International Warranty",
      faults: null,
      accessories_included: "Sealed box with USB-C Braided Charge Cable",
      description: "The powerhouse iPhone 15 Pro Max in aerospace-grade Natural Titanium. Powered by A17 Pro chip with 5x optical telephoto lens and customizable Action Button.",
      specs: {
        "Storage": "256 GB",
        "RAM": "8 GB",
        "Display": "6.7-inch Super Retina XDR OLED ProMotion 120Hz",
        "Chip": "A17 Pro (3nm)",
        "Camera": "48 MP Main + 12 MP 5x Telephoto + 12 MP Ultra-Wide"
      },
      images: [
        "assets/images/products/iphone-15-promax-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: "44444444-4444-4444-8444-111111111111",
      name: "Samsung Galaxy S10 – 128GB Prism Black",
      brand: "Samsung",
      model: "Galaxy S10",
      category: "smartphones",
      subcategory: "android",
      price: 145000,
      condition: "Fairly Used",
      model_age: "Older Model",
      inventory_type: "individual",
      stock_quantity: 1,
      battery_health: null,
      cosmetic_condition: "Clean 9/10 body, no screen burn-in, crisp Quad HD Dynamic AMOLED",
      faults: "None. Ultrasonic fingerprint scanner and cameras fully functional",
      accessories_included: "Includes fast wall charger and Type-C cable",
      description: "Classic flagship Galaxy S10 offering remarkable value. Quad HD display, triple cameras, 3.5mm headphone jack and expandable MicroSD storage.",
      specs: {
        "Storage": "128 GB",
        "RAM": "8 GB",
        "Display": "6.1-inch Dynamic AMOLED Quad HD+",
        "Processor": "Snapdragon 855 / Exynos 9820",
        "Battery": "3,400 mAh",
        "Headphone Jack": "Yes (3.5mm)"
      },
      images: [
        "assets/images/products/galaxy-s10-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: "55555555-5555-4555-8555-111111111111",
      name: "Samsung Galaxy A55 5G – 128GB Awesome Iceblue",
      brand: "Samsung",
      model: "Galaxy A55 5G",
      category: "smartphones",
      subcategory: "android",
      price: 350000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 4,
      battery_health: null,
      cosmetic_condition: "Factory sealed retail pack",
      faults: null,
      accessories_included: "Original box, USB-C cable, SIM tool",
      description: "Premium metal frame and Gorilla Glass Victus+ design. 50MP optical image stabilization camera with nightography, 5000mAh 2-day battery.",
      specs: {
        "Storage": "128 GB",
        "RAM": "8 GB",
        "Display": "6.6-inch Super AMOLED 120Hz",
        "Battery": "5,000 mAh",
        "Camera": "50 MP OIS + 12 MP + 5 MP"
      },
      images: [
        "assets/images/products/galaxy-a55-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 36).toISOString()
    },
    {
      id: "66666666-6666-4666-8666-111111111111",
      name: "HP EliteBook 840 G5 – Intel Core i5 8th Gen, 16GB RAM, 512GB SSD",
      brand: "HP",
      model: "EliteBook 840 G5",
      category: "laptops",
      subcategory: "windows",
      price: 280000,
      condition: "Fairly Used",
      model_age: "Older Model",
      inventory_type: "individual",
      stock_quantity: 1,
      battery_health: null,
      cosmetic_condition: "Clean aluminium unibody 9/10, keyboard backlit, battery backup 4-5 hours",
      faults: "None. Bang & Olufsen sound, webcam, ports 100% verified",
      accessories_included: "Original HP 65W smart AC adapter",
      description: "Durable corporate business laptop ideal for programming, business management, students and remote work. Upgraded to 16GB RAM and fast 512GB NVMe SSD.",
      specs: {
        "Processor": "Intel Core i5-8350U (Quad Core up to 3.6GHz)",
        "RAM": "16 GB DDR4",
        "Storage": "512 GB NVMe SSD",
        "Display": "14-inch Full HD IPS Anti-glare",
        "Audio": "Bang & Olufsen Dual Stereo",
        "OS": "Windows 11 Pro 64-bit"
      },
      images: [
        "assets/images/products/hp-elitebook-840-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      id: "77777777-7777-4777-8777-111111111111",
      name: "Apple MacBook Air 13.6-inch M2 – 8GB / 256GB Midnight",
      brand: "Apple",
      model: "MacBook Air M2",
      category: "laptops",
      subcategory: "macbook",
      price: 1150000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 2,
      battery_health: null,
      cosmetic_condition: "Brand new in sealed box with Apple international warranty",
      faults: null,
      accessories_included: "30W USB-C Power Adapter, 2m MagSafe 3 Cable",
      description: "Redesigned thin aluminium enclosure featuring Apple M2 silicon with all-day 18-hour battery life, 1080p FaceTime HD camera and Liquid Retina display.",
      specs: {
        "Chip": "Apple M2 (8-Core CPU, 8-Core GPU)",
        "RAM": "8 GB Unified Memory",
        "Storage": "256 GB SSD",
        "Display": "13.6-inch Liquid Retina with True Tone",
        "Battery": "Up to 18 hours"
      },
      images: [
        "assets/images/products/macbook-air-m2-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: "88888888-8888-4888-8888-111111111111",
      name: "Apple iPad 10.9-inch (10th Generation) – 64GB Wi-Fi Blue",
      brand: "Apple",
      model: "iPad 10th Gen",
      category: "tablets",
      subcategory: "ipad",
      price: 490000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 4,
      battery_health: null,
      cosmetic_condition: "Factory sealed retail box",
      faults: null,
      accessories_included: "USB-C Charge Cable, 20W USB-C Power Adapter",
      description: "All-screen design with 10.9-inch Liquid Retina display, A14 Bionic chip, landscape 12MP Ultra Wide front camera with Center Stage.",
      specs: {
        "Chip": "A14 Bionic",
        "Display": "10.9-inch Liquid Retina (2360x1640)",
        "Storage": "64 GB",
        "Camera": "12 MP Wide rear, 12 MP Ultra-Wide front",
        "Port": "USB-C"
      },
      images: [
        "assets/images/products/ipad-10th-gen-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: "99999999-9999-4999-8999-111111111111",
      name: "JBL Flip 6 Portable Waterproof Bluetooth Speaker",
      brand: "JBL",
      model: "Flip 6",
      category: "audio",
      subcategory: "speaker",
      price: 85000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 6,
      battery_health: null,
      cosmetic_condition: "Brand new in retail box with seal",
      faults: null,
      accessories_included: "Type-C USB cable, Quick Start Guide",
      description: "Bold JBL Original Pro Sound with 2-way speaker system. IP67 waterproof and dustproof with up to 12 hours playtime on a single charge.",
      specs: {
        "Output Power": "30 W (20W woofer + 10W tweeter)",
        "Battery Life": "Up to 12 hours",
        "Water Resistance": "IP67 waterproof and dustproof",
        "Bluetooth": "5.1"
      },
      images: [
        "assets/images/products/jbl-flip-6-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 22).toISOString()
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-111111111111",
      name: "Oraimo FreePods 4 True Wireless Earbuds (ANC)",
      brand: "Oraimo",
      model: "FreePods 4",
      category: "audio",
      subcategory: "earbuds",
      price: 35000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 15,
      battery_health: null,
      cosmetic_condition: "Original Oraimo tamper-evident retail package",
      faults: null,
      accessories_included: "Charging case, Type-C cable, 3 pairs of silicone ear tips",
      description: "Active Noise Cancellation, signature HavyBass sound, up to 35.5 hours total battery life with companion Oraimo Sound app equalizer support.",
      specs: {
        "Noise Cancellation": "Up to 30dB Active Noise Cancellation",
        "Battery Life": "Up to 35.5 hours total",
        "Bluetooth": "5.2",
        "Waterproof": "IPX5 splash proof"
      },
      images: [
        "assets/images/products/oraimo-freepods-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 14).toISOString()
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-111111111111",
      name: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
      brand: "Sony",
      model: "WH-1000XM5",
      category: "audio",
      subcategory: "headphones",
      price: 185000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 3,
      battery_health: null,
      cosmetic_condition: "Original Sony sealed box",
      faults: null,
      accessories_included: "Carrying case, 1.2m headphone cable, USB charging cable",
      description: "Industry-leading noise cancellation with two processors and 8 microphones. Hi-Res Audio wireless, 30-hour battery life with quick charge.",
      specs: {
        "Battery": "Up to 30 hours (ANC ON)",
        "Driver": "30mm precision-engineered",
        "Microphones": "8 microphones with beamforming",
        "Weight": "250g"
      },
      images: [
        "assets/images/products/sony-xm5-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 32).toISOString()
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-111111111111",
      name: "Samsung Galaxy Watch 6 (44mm, Bluetooth) Graphite",
      brand: "Samsung",
      model: "Galaxy Watch 6",
      category: "wearables",
      subcategory: "smartwatch",
      price: 165000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 3,
      battery_health: null,
      cosmetic_condition: "Original retail box with seals",
      faults: null,
      accessories_included: "Galaxy Watch 6, Fast Wireless Charger puck",
      description: "20% larger display with thinner bezel. Advanced sleep tracking, personalized heart rate zones and body composition measurement on your wrist.",
      specs: {
        "Display": "1.5-inch Super AMOLED Sapphire Crystal",
        "Battery": "425 mAh",
        "Water Resistance": "5ATM + IP68 / MIL-STD-810H",
        "OS": "Wear OS powered by Samsung"
      },
      images: [
        "assets/images/products/galaxy-watch-6-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 16).toISOString()
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-111111111111",
      name: "Apple Watch Series 7 – 45mm Midnight Aluminium (Used)",
      brand: "Apple",
      model: "Watch Series 7",
      category: "wearables",
      subcategory: "smartwatch",
      price: 190000,
      condition: "Fairly Used",
      model_age: "Older Model",
      inventory_type: "individual",
      stock_quantity: 1,
      battery_health: 89,
      cosmetic_condition: "Clean 9/10, subtle micro-marks on clasp, screen immaculate",
      faults: "None. ECG, Blood Oxygen sensor, haptics 100% functional",
      accessories_included: "Includes magnetic fast charger cable and original sport band",
      description: "Pre-owned Apple Watch Series 7 45mm. Crack-resistant front crystal, fast charging capability, Always-On Retina display with full QWERTY keyboard.",
      specs: {
        "Size": "45 mm",
        "Battery Health": "89%",
        "Connectivity": "GPS, Wi-Fi, Bluetooth 5.0",
        "Sensors": "Blood Oxygen, ECG, Optical Heart Rate",
        "Water Resistance": "50 metres"
      },
      images: [
        "assets/images/products/apple-watch-s7-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 40).toISOString()
    },
    {
      id: "eeeeeeee-eeee-4eee-8eee-111111111111",
      name: "Anker 65W GaN Fast Charger (Nano II)",
      brand: "Anker",
      model: "Nano II 65W",
      category: "accessories",
      subcategory: "charger",
      price: 22000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 20,
      battery_health: null,
      cosmetic_condition: "Brand new in Anker blister box",
      faults: null,
      accessories_included: "Charger, User Guide",
      description: "Powered by GaN II technology. Super-compact high-speed charger capable of charging phones, tablets and USB-C notebooks including MacBook and Dell XPS.",
      specs: {
        "Wattage": "65 W Power Delivery",
        "Port": "1x USB-C",
        "Technology": "Gallium Nitride (GaN II)",
        "Compatibility": "iPhone, Samsung, MacBooks, Laptops"
      },
      images: [
        "assets/images/products/anker-65w-charger-demo.jpg"
      ],
      featured: false,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 50).toISOString()
    },
    {
      id: "ffffffff-ffff-4fff-8fff-111111111111",
      name: "Baseus 20,000mAh 65W Fast Charging Power Bank",
      brand: "Baseus",
      model: "Blade 65W",
      category: "accessories",
      subcategory: "powerbank",
      price: 35000,
      condition: "Brand New",
      model_age: "Current Model",
      inventory_type: "quantity",
      stock_quantity: 12,
      battery_health: null,
      cosmetic_condition: "Brand new in retail box with warranty card",
      faults: null,
      accessories_included: "Power Bank, 100W USB-C to USB-C cable, velvet pouch",
      description: "Ultra-slim digital display 65W laptop and smartphone power bank. Charge an iPhone up to 4.5 times or full charge an M2 MacBook Air.",
      specs: {
        "Capacity": "20,000 mAh / 74Wh",
        "Max Output": "65 W PD Fast Charge",
        "Ports": "2x USB-C + 2x USB-A",
        "Digital Display": "Shows battery %, voltage, wattage"
      },
      images: [
        "assets/images/products/baseus-powerbank-demo.jpg"
      ],
      featured: true,
      status: "published",
      created_at: new Date(Date.now() - 3600000 * 26).toISOString()
    }
  ];

  // ── Init & Connection ───────────────────────────────────────────────────────
  function init() {
    if (
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      SUPABASE_CONFIG.url !== "https://xyzcompany.supabase.co" &&
      window.supabase
    ) {
      try {
        client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        isConnected = true;
        console.log("Connected to Supabase PostgreSQL.");
      } catch (err) {
        console.warn("Supabase initialization error, falling back to local adapter:", err);
        isConnected = false;
      }
    } else {
      isConnected = false;
      console.log("Supabase credentials not set or SDK not loaded. Operating in local storage mode.");
    }

    // Ensure fallback local storage has products initialized
    if (!localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY)) {
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(SEED_PRODUCTS));
    }
  }

  function isLive() {
    return isConnected && client !== null;
  }

  // ── Local Adapter Helpers ───────────────────────────────────────────────────
  function getLocalProducts() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
      return data ? JSON.parse(data) : [...SEED_PRODUCTS];
    } catch {
      return [...SEED_PRODUCTS];
    }
  }

  function setLocalProducts(products) {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  }

  // ── Public Storefront Query API ─────────────────────────────────────────────

  /**
   * Fetch all published products for customer storefront
   */
  async function getPublishedProducts() {
    if (isLive()) {
      try {
        // Query products with joined images
        const { data, error } = await client
          .from("products")
          .select(`
            *,
            images:product_images(url, is_primary, display_order)
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Normalize images array
        return data.map((item) => {
          const imgList = item.images && item.images.length > 0
            ? [...item.images]
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order)
                .map((img) => img.url)
            : [PLACEHOLDER_IMAGE];
          return {
            ...item,
            images: imgList,
            image: imgList[0] || PLACEHOLDER_IMAGE,
          };
        });
      } catch (err) {
        console.error("Error fetching published products from Supabase, using local fallback:", err);
      }
    }

    // Fallback: local products with status === 'published'
    const list = getLocalProducts().filter((p) => p.status === "published");
    return list.map((p) => ({
      ...p,
      image: (p.images && p.images[0]) || PLACEHOLDER_IMAGE,
    }));
  }

  /**
   * Fetch a single product by ID
   */
  async function getProductById(id) {
    if (isLive()) {
      try {
        const { data, error } = await client
          .from("products")
          .select(`
            *,
            images:product_images(url, is_primary, display_order)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          const imgList = data.images && data.images.length > 0
            ? [...data.images]
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order)
                .map((img) => img.url)
            : [PLACEHOLDER_IMAGE];
          return {
            ...data,
            images: imgList,
            image: imgList[0] || PLACEHOLDER_IMAGE,
          };
        }
      } catch (err) {
        console.warn("Error fetching single product from Supabase, checking local:", err);
      }
    }

    const item = getLocalProducts().find((p) => String(p.id) === String(id));
    if (item) {
      return {
        ...item,
        image: (item.images && item.images[0]) || PLACEHOLDER_IMAGE,
      };
    }
    return null;
  }

  // ── Admin Management API ───────────────────────────────────────────────────

  /**
   * Fetch all products including drafts, sold and archived for Admin Dashboard
   */
  async function getAllProductsForAdmin() {
    if (isLive()) {
      try {
        const { data, error } = await client
          .from("products")
          .select(`
            *,
            images:product_images(url, is_primary, display_order)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data.map((item) => {
          const imgList = item.images && item.images.length > 0
            ? [...item.images]
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.display_order - b.display_order)
                .map((img) => img.url)
            : [PLACEHOLDER_IMAGE];
          return {
            ...item,
            images: imgList,
            image: imgList[0] || PLACEHOLDER_IMAGE,
          };
        });
      } catch (err) {
        console.error("Admin fetch error from Supabase, falling back to local:", err);
      }
    }

    return getLocalProducts().map((p) => ({
      ...p,
      image: (p.images && p.images[0]) || PLACEHOLDER_IMAGE,
    }));
  }

  /**
   * Save a new product
   */
  async function createProduct(productData, uploadedImageUrls = []) {
    const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "p-" + Date.now();
    const finalImages = uploadedImageUrls.length > 0 ? uploadedImageUrls : [PLACEHOLDER_IMAGE];

    if (isLive()) {
      try {
        // Insert product record
        const { data: insertedProduct, error: prodErr } = await client
          .from("products")
          .insert({
            name: productData.name,
            brand: productData.brand,
            model: productData.model || null,
            category: productData.category,
            subcategory: productData.subcategory || null,
            price: Number(productData.price),
            condition: productData.condition,
            model_age: productData.model_age || "Current Model",
            inventory_type: productData.inventory_type || "quantity",
            stock_quantity: Number(productData.stock_quantity || 1),
            battery_health: productData.battery_health ? Number(productData.battery_health) : null,
            cosmetic_condition: productData.cosmetic_condition || null,
            faults: productData.faults || null,
            accessories_included: productData.accessories_included || null,
            description: productData.description || "",
            specs: productData.specs || {},
            status: productData.status || "published",
            featured: Boolean(productData.featured),
          })
          .select()
          .single();

        if (prodErr) throw prodErr;

        // Insert image records
        if (uploadedImageUrls.length > 0) {
          const imageRecords = uploadedImageUrls.map((url, index) => ({
            product_id: insertedProduct.id,
            url,
            is_primary: index === 0,
            display_order: index + 1,
          }));
          await client.from("product_images").insert(imageRecords);
        }

        return { success: true, product: insertedProduct };
      } catch (err) {
        console.error("Failed to create product in Supabase:", err);
        throw err;
      }
    }

    // Local Storage fallback
    const products = getLocalProducts();
    const localItem = {
      id: newId,
      ...productData,
      price: Number(productData.price),
      stock_quantity: Number(productData.stock_quantity || 1),
      battery_health: productData.battery_health ? Number(productData.battery_health) : null,
      featured: Boolean(productData.featured),
      images: finalImages,
      created_at: new Date().toISOString(),
    };
    products.unshift(localItem);
    setLocalProducts(products);
    return { success: true, product: localItem };
  }

  /**
   * Update an existing product
   */
  async function updateProduct(id, productData, updatedImageUrls = null) {
    if (isLive()) {
      try {
        const updatePayload = {
          name: productData.name,
          brand: productData.brand,
          model: productData.model || null,
          category: productData.category,
          subcategory: productData.subcategory || null,
          price: Number(productData.price),
          condition: productData.condition,
          model_age: productData.model_age || "Current Model",
          inventory_type: productData.inventory_type || "quantity",
          stock_quantity: Number(productData.stock_quantity || 0),
          battery_health: productData.battery_health ? Number(productData.battery_health) : null,
          cosmetic_condition: productData.cosmetic_condition || null,
          faults: productData.faults || null,
          accessories_included: productData.accessories_included || null,
          description: productData.description || "",
          specs: productData.specs || {},
          status: productData.status,
          featured: Boolean(productData.featured),
        };

        const { error: prodErr } = await client
          .from("products")
          .update(updatePayload)
          .eq("id", id);

        if (prodErr) throw prodErr;

        // If new images provided, sync images table
        if (updatedImageUrls && Array.isArray(updatedImageUrls)) {
          // Delete old images and reinsert
          await client.from("product_images").delete().eq("product_id", id);
          if (updatedImageUrls.length > 0) {
            const imageRecords = updatedImageUrls.map((url, index) => ({
              product_id: id,
              url,
              is_primary: index === 0,
              display_order: index + 1,
            }));
            await client.from("product_images").insert(imageRecords);
          }
        }

        return { success: true };
      } catch (err) {
        console.error("Failed to update product in Supabase:", err);
        throw err;
      }
    }

    // Local Storage fallback
    const products = getLocalProducts();
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) {
      const existing = products[idx];
      products[idx] = {
        ...existing,
        ...productData,
        price: Number(productData.price),
        stock_quantity: Number(productData.stock_quantity || 0),
        battery_health: productData.battery_health ? Number(productData.battery_health) : null,
        featured: Boolean(productData.featured),
        images: updatedImageUrls !== null ? updatedImageUrls : existing.images,
        updated_at: new Date().toISOString(),
      };
      setLocalProducts(products);
      return { success: true, product: products[idx] };
    }
    throw new Error("Product not found");
  }

  /**
   * Fast status update (e.g., mark as sold, archive, publish)
   */
  async function setProductStatus(id, newStatus) {
    if (isLive()) {
      try {
        const payload = { status: newStatus };
        // If an individual device is marked sold, update stock_quantity to 0
        if (newStatus === "sold") {
          payload.stock_quantity = 0;
        } else if (newStatus === "published") {
          const { data: cur } = await client.from("products").select("inventory_type, stock_quantity").eq("id", id).single();
          if (cur && cur.inventory_type === "individual" && cur.stock_quantity === 0) {
            payload.stock_quantity = 1;
          }
        }
        const { error } = await client.from("products").update(payload).eq("id", id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error("Error setting product status:", err);
        throw err;
      }
    }

    // Local fallback
    const products = getLocalProducts();
    const item = products.find((p) => String(p.id) === String(id));
    if (item) {
      item.status = newStatus;
      if (newStatus === "sold" && item.inventory_type === "individual") {
        item.stock_quantity = 0;
      } else if (newStatus === "published" && item.inventory_type === "individual" && item.stock_quantity === 0) {
        item.stock_quantity = 1;
      }
      setLocalProducts(products);
      return { success: true };
    }
    throw new Error("Product not found");
  }

  /**
   * Delete a product permanently
   */
  async function deleteProduct(id) {
    if (isLive()) {
      try {
        const { error } = await client.from("products").delete().eq("id", id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        console.error("Failed to delete product in Supabase:", err);
        throw err;
      }
    }

    // Local fallback
    let products = getLocalProducts();
    products = products.filter((p) => String(p.id) !== String(id));
    setLocalProducts(products);
    return { success: true };
  }

  // ── Image Uploading API (Supabase Storage) ──────────────────────────────────

  /**
   * Upload an image file from smartphone camera / gallery
   * In live mode: uploads to 'product-images' bucket in Supabase
   * In fallback mode: converts to DataURL or relative URL for preview
   */
  async function uploadImageFile(file) {
    if (isLive()) {
      try {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await client.storage
          .from(SUPABASE_CONFIG.storageBucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        // Retrieve public URL
        const { data: publicUrlData } = client.storage
          .from(SUPABASE_CONFIG.storageBucket)
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      } catch (err) {
        console.error("Supabase Storage upload failed, falling back to local base64:", err);
      }
    }

    // Fallback: convert file to local Base64 Data URL so the owner can preview & test immediately
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // ── Authentication API ─────────────────────────────────────────────────────

  /**
   * Owner sign in via Supabase Auth
   */
  async function signIn(email, password) {
    if (isLive()) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    }

    // Demo/offline mode authentication:
    // If not connected to live Supabase, allows demo credentials or owner passphrase
    if (
      (email === "owner@melisco.ng" && password === "Melisco2024!") ||
      (email === "admin" && password === "admin") ||
      password.length >= 6
    ) {
      const demoSession = {
        user: { id: "demo-owner-id", email: email || "owner@melisco.ng" },
        expires_at: Date.now() + 86400000,
      };
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(demoSession));
      return { session: demoSession, user: demoSession.user };
    }
    throw new Error("Invalid credentials. In demo mode, use email: owner@melisco.ng, password: Melisco2024!");
  }

  /**
   * Owner sign out
   */
  async function signOut() {
    if (isLive()) {
      await client.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }

  /**
   * Get currently logged-in user / session
   */
  async function getCurrentUser() {
    if (isLive()) {
      try {
        const { data } = await client.auth.getUser();
        if (data && data.user) return data.user;
      } catch (err) {
        console.warn("Auth check error:", err);
      }
    }

    // Check local demo session
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expires_at > Date.now()) {
          return parsed.user;
        }
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    } catch {}
    return null;
  }

  /**
   * Check if the currently logged-in user is listed in store_owners
   */
  async function checkOwnerAuthorization() {
    if (isLive()) {
      try {
        const { data: userData } = await client.auth.getUser();
        if (!userData || !userData.user) return false;

        const { data, error } = await client
          .from("store_owners")
          .select("user_id")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (error || !data) {
          console.warn("User is authenticated but not registered in store_owners table.");
          return false;
        }
        return true;
      } catch (err) {
        console.error("Owner authorization check error:", err);
        return false;
      }
    }

    // In local fallback mode
    return Boolean(localStorage.getItem(LOCAL_STORAGE_SESSION_KEY));
  }

  return {
    init,
    isLive,
    getPublishedProducts,
    getProductById,
    getAllProductsForAdmin,
    createProduct,
    updateProduct,
    setProductStatus,
    deleteProduct,
    uploadImageFile,
    signIn,
    signOut,
    getCurrentUser,
    checkOwnerAuthorization,
  };
})();

// Auto-initialize when script loads
if (typeof window !== "undefined") {
  Database.init();
}
