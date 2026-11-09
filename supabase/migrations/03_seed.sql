-- ============================================================
-- Melisco Gadgets E-commerce Schema
-- Migration 03: Seed Demonstration Products & Images
-- All images reference local project relative paths.
-- ============================================================

DO $$
DECLARE
    p_id_ip11_purple UUID := '11111111-1111-4111-8111-111111111111';
    p_id_ip11_black  UUID := '11111111-1111-4111-8111-222222222222';
    p_id_s24fe       UUID := '22222222-2222-4222-8222-111111111111';
    p_id_ip15pm      UUID := '33333333-3333-4333-8333-111111111111';
    p_id_s10         UUID := '44444444-4444-4444-8444-111111111111';
    p_id_a55         UUID := '55555555-5555-4555-8555-111111111111';
    p_id_hp840       UUID := '66666666-6666-4666-8666-111111111111';
    p_id_macbook     UUID := '77777777-7777-4777-8777-111111111111';
    p_id_ipad10      UUID := '88888888-8888-4888-8888-111111111111';
    p_id_jbl6        UUID := '99999999-9999-4999-8999-111111111111';
    p_id_oraimo      UUID := 'aaaaaaaa-aaaa-4aaa-8aaa-111111111111';
    p_id_sony        UUID := 'bbbbbbbb-bbbb-4bbb-8bbb-111111111111';
    p_id_watch6      UUID := 'cccccccc-cccc-4ccc-8ccc-111111111111';
    p_id_watch7      UUID := 'dddddddd-dddd-4ddd-8ddd-111111111111';
    p_id_anker       UUID := 'eeeeeeee-eeee-4eee-8eee-111111111111';
    p_id_baseus      UUID := 'ffffffff-ffff-4fff-8fff-111111111111';
BEGIN

    -- 1. Insert Products
    INSERT INTO public.products (
        id, name, brand, model, category, subcategory, price,
        condition, model_age, inventory_type, stock_quantity,
        battery_health, cosmetic_condition, faults, accessories_included,
        description, specs, status, featured
    ) VALUES
    -- Used iPhone 11 (Unit A - Purple, 128GB, 86% BH)
    (
        p_id_ip11_purple,
        'Apple iPhone 11 – 128GB (Purple)',
        'Apple',
        'iPhone 11',
        'smartphones',
        'iphone',
        260000.00,
        'Fairly Used',
        'Older Model',
        'individual',
        1,
        86,
        'Clean 9/10, minimal pocket signs on rim, screen pristine with protector',
        'None. Face ID, True Tone, cameras, speakers 100% verified',
        'Comes with fast-charging cable and transparent protective case',
        'Authentic UK-used iPhone 11 Purple in excellent condition. Factory unlocked to all Nigerian networks (MTN, Airtel, Glo, 9mobile). Tested thoroughly with warranty.',
        '{"Storage": "128 GB", "RAM": "4 GB", "Battery Health": "86%", "Display": "6.1-inch Liquid Retina HD", "Cameras": "12 MP dual wide/ultra-wide", "Chip": "A13 Bionic", "SIM": "Physical Nano-SIM + eSIM"}'::jsonb,
        'published',
        true
    ),
    -- Used iPhone 11 (Unit B - Black, 64GB, 81% BH) - Distinct listing for identical model
    (
        p_id_ip11_black,
        'Apple iPhone 11 – 64GB (Space Black)',
        'Apple',
        'iPhone 11',
        'smartphones',
        'iphone',
        235000.00,
        'Fairly Used',
        'Older Model',
        'individual',
        1,
        81,
        'Clean 8.5/10, slight paint wear near charging port, zero screen cracks',
        'None. All sensors & buttons tested working',
        'Comes with Lightning cable',
        'Budget-friendly UK-used iPhone 11 Space Black. Great everyday battery life, crisp cameras, solid device for social media and daily work.',
        '{"Storage": "64 GB", "RAM": "4 GB", "Battery Health": "81%", "Display": "6.1-inch Liquid Retina HD", "Cameras": "12 MP dual", "Chip": "A13 Bionic"}'::jsonb,
        'published',
        false
    ),
    -- Brand New Samsung Galaxy S24 FE
    (
        p_id_s24fe,
        'Samsung Galaxy S24 FE 5G (256GB)',
        'Samsung',
        'Galaxy S24 FE',
        'smartphones',
        'android',
        420000.00,
        'Brand New',
        'Current Model',
        'quantity',
        5,
        NULL,
        'Factory sealed box with Samsung original warranty tamper seal intact',
        NULL,
        'Full original retail pack: USB-C to USB-C cable, SIM ejector tool, manuals',
        'Brand new factory sealed Samsung Galaxy S24 FE with Galaxy AI features, pro-grade 50MP triple camera system and super bright 120Hz Dynamic AMOLED display.',
        '{"Storage": "256 GB", "RAM": "8 GB", "Display": "6.7-inch Dynamic AMOLED 2X, 120Hz", "Processor": "Exynos 2400e", "Battery": "4,700 mAh", "Cameras": "50 MP + 12 MP + 8 MP 3x Optical"}'::jsonb,
        'published',
        true
    ),
    -- Brand New iPhone 15 Pro Max
    (
        p_id_ip15pm,
        'Apple iPhone 15 Pro Max – 256GB Natural Titanium',
        'Apple',
        'iPhone 15 Pro Max',
        'smartphones',
        'iphone',
        1250000.00,
        'Brand New',
        'Current Model',
        'quantity',
        3,
        NULL,
        'Brand new in sealed box with Apple 1-Year International Warranty',
        NULL,
        'Sealed box with USB-C Braided Charge Cable',
        'The powerhouse iPhone 15 Pro Max in aerospace-grade Natural Titanium. Powered by A17 Pro chip with 5x optical telephoto lens and customizable Action Button.',
        '{"Storage": "256 GB", "RAM": "8 GB", "Display": "6.7-inch Super Retina XDR OLED ProMotion 120Hz", "Chip": "A17 Pro (3nm)", "Camera": "48 MP Main + 12 MP 5x Telephoto + 12 MP Ultra-Wide"}'::jsonb,
        'published',
        true
    ),
    -- Fairly Used Samsung Galaxy S10 (Older Model demonstration)
    (
        p_id_s10,
        'Samsung Galaxy S10 – 128GB Prism Black',
        'Samsung',
        'Galaxy S10',
        'smartphones',
        'android',
        145000.00,
        'Fairly Used',
        'Older Model',
        'individual',
        1,
        NULL,
        'Clean 9/10 body, no screen burn-in, crisp Quad HD Dynamic AMOLED',
        'None. Ultrasonic fingerprint scanner and cameras fully functional',
        'Includes fast wall charger and Type-C cable',
        'Classic flagship Galaxy S10 offering remarkable value. Quad HD display, triple cameras, 3.5mm headphone jack and expandable MicroSD storage.',
        '{"Storage": "128 GB", "RAM": "8 GB", "Display": "6.1-inch Dynamic AMOLED Quad HD+", "Processor": "Snapdragon 855 / Exynos 9820", "Battery": "3,400 mAh", "Headphone Jack": "Yes (3.5mm)"}'::jsonb,
        'published',
        false
    ),
    -- Brand New Samsung Galaxy A55 5G
    (
        p_id_a55,
        'Samsung Galaxy A55 5G – 128GB Awesome Iceblue',
        'Samsung',
        'Galaxy A55 5G',
        'smartphones',
        'android',
        350000.00,
        'Brand New',
        'Current Model',
        'quantity',
        4,
        NULL,
        'Factory sealed pack',
        NULL,
        'Original box, USB-C cable, SIM tool',
        'Premium metal frame and Gorilla Glass Victus+ design. 50MP optical image stabilization camera with nightography, 5000mAh 2-day battery.',
        '{"Storage": "128 GB", "RAM": "8 GB", "Display": "6.6-inch Super AMOLED 120Hz", "Battery": "5,000 mAh", "Camera": "50 MP OIS + 12 MP + 5 MP"}'::jsonb,
        'published',
        false
    ),
    -- Fairly Used HP EliteBook 840 G5 (Used Laptop Individual Device)
    (
        p_id_hp840,
        'HP EliteBook 840 G5 – Intel Core i5 8th Gen, 16GB RAM, 512GB SSD',
        'HP',
        'EliteBook 840 G5',
        'laptops',
        'windows',
        280000.00,
        'Fairly Used',
        'Older Model',
        'individual',
        1,
        NULL,
        'Clean aluminium unibody 9/10, keyboard backlit, battery backup 4-5 hours',
        'None. Bang & Olufsen sound, webcam, ports 100% verified',
        'Original HP 65W smart AC adapter',
        'Durable corporate business laptop ideal for programming, business management, students and remote work. Upgraded to 16GB RAM and fast 512GB NVMe SSD.',
        '{"Processor": "Intel Core i5-8350U (Quad Core up to 3.6GHz)", "RAM": "16 GB DDR4", "Storage": "512 GB NVMe SSD", "Display": "14-inch Full HD IPS Anti-glare", "Audio": "Bang & Olufsen Dual Stereo", "OS": "Windows 11 Pro 64-bit"}'::jsonb,
        'published',
        true
    ),
    -- Brand New MacBook Air M2
    (
        p_id_macbook,
        'Apple MacBook Air 13.6-inch M2 – 8GB / 256GB Midnight',
        'Apple',
        'MacBook Air M2',
        'laptops',
        'macbook',
        1150000.00,
        'Brand New',
        'Current Model',
        'quantity',
        2,
        NULL,
        'Brand new in sealed box',
        NULL,
        '30W USB-C Power Adapter, 2m MagSafe 3 Cable',
        'Redesigned thin aluminium enclosure featuring Apple M2 silicon with all-day 18-hour battery life, 1080p FaceTime HD camera and Liquid Retina display.',
        '{"Chip": "Apple M2 (8-Core CPU, 8-Core GPU)", "RAM": "8 GB Unified Memory", "Storage": "256 GB SSD", "Display": "13.6-inch Liquid Retina with True Tone", "Battery": "Up to 18 hours"}'::jsonb,
        'published',
        true
    ),
    -- Brand New iPad 10th Generation
    (
        p_id_ipad10,
        'Apple iPad 10.9-inch (10th Generation) – 64GB Wi-Fi Blue',
        'Apple',
        'iPad 10th Gen',
        'tablets',
        'ipad',
        490000.00,
        'Brand New',
        'Current Model',
        'quantity',
        4,
        NULL,
        'Factory sealed box',
        NULL,
        'USB-C Charge Cable, 20W USB-C Power Adapter',
        'All-screen design with 10.9-inch Liquid Retina display, A14 Bionic chip, landscape 12MP Ultra Wide front camera with Center Stage.',
        '{"Chip": "A14 Bionic", "Display": "10.9-inch Liquid Retina (2360x1640)", "Storage": "64 GB", "Camera": "12 MP Wide rear, 12 MP Ultra-Wide front", "Port": "USB-C"}'::jsonb,
        'published',
        false
    ),
    -- Brand New JBL Flip 6 (Quantity-based audio gadget)
    (
        p_id_jbl6,
        'JBL Flip 6 Portable Waterproof Bluetooth Speaker',
        'JBL',
        'Flip 6',
        'audio',
        'speaker',
        85000.00,
        'Brand New',
        'Current Model',
        'quantity',
        6,
        NULL,
        'Brand new in retail box with seal',
        NULL,
        'Type-C USB cable, Quick Start Guide',
        'Bold JBL Original Pro Sound with 2-way speaker system. IP67 waterproof and dustproof with up to 12 hours playtime on a single charge.',
        '{"Output Power": "30 W (20W woofer + 10W tweeter)", "Battery Life": "Up to 12 hours", "Water Resistance": "IP67 waterproof and dustproof", "Bluetooth": "5.1"}'::jsonb,
        'published',
        true
    ),
    -- Brand New Oraimo FreePods 4 (High quantity accessory)
    (
        p_id_oraimo,
        'Oraimo FreePods 4 True Wireless Earbuds (ANC)',
        'Oraimo',
        'FreePods 4',
        'audio',
        'earbuds',
        35000.00,
        'Brand New',
        'Current Model',
        'quantity',
        15,
        NULL,
        'Original Oraimo tamper-evident retail package',
        NULL,
        'Charging case, Type-C cable, 3 pairs of silicone ear tips',
        'Active Noise Cancellation, signature HavyBass sound, up to 35.5 hours total battery life with companion Oraimo Sound app equalizer support.',
        '{"Noise Cancellation": "Up to 30dB Active Noise Cancellation", "Battery Life": "Up to 35.5 hours total", "Bluetooth": "5.2", "Waterproof": "IPX5 splash proof"}'::jsonb,
        'published',
        true
    ),
    -- Brand New Sony WH-1000XM5
    (
        p_id_sony,
        'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
        'Sony',
        'WH-1000XM5',
        'audio',
        'headphones',
        185000.00,
        'Brand New',
        'Current Model',
        'quantity',
        3,
        NULL,
        'Original Sony sealed box',
        NULL,
        'Carrying case, 1.2m headphone cable, USB charging cable',
        'Industry-leading noise cancellation with two processors and 8 microphones. Hi-Res Audio wireless, 30-hour battery life with quick charge.',
        '{"Battery": "Up to 30 hours (ANC ON)", "Driver": "30mm precision-engineered", "Microphones": "8 microphones with beamforming", "Weight": "250g"}'::jsonb,
        'published',
        false
    ),
    -- Brand New Samsung Galaxy Watch 6
    (
        p_id_watch6,
        'Samsung Galaxy Watch 6 (44mm, Bluetooth) Graphite',
        'Samsung',
        'Galaxy Watch 6',
        'wearables',
        'smartwatch',
        165000.00,
        'Brand New',
        'Current Model',
        'quantity',
        3,
        NULL,
        'Original retail box with seals',
        NULL,
        'Galaxy Watch 6, Fast Wireless Charger puck',
        '20% larger display with thinner bezel. Advanced sleep tracking, personalized heart rate zones and body composition measurement on your wrist.',
        '{"Display": "1.5-inch Super AMOLED Sapphire Crystal", "Battery": "425 mAh", "Water Resistance": "5ATM + IP68 / MIL-STD-810H", "OS": "Wear OS powered by Samsung"}'::jsonb,
        'published',
        true
    ),
    -- Fairly Used Apple Watch Series 7 (Used Wearable Individual Device)
    (
        p_id_watch7,
        'Apple Watch Series 7 – 45mm Midnight Aluminium (Used)',
        'Apple',
        'Watch Series 7',
        'wearables',
        'smartwatch',
        190000.00,
        'Fairly Used',
        'Older Model',
        'individual',
        1,
        89,
        'Clean 9/10, subtle micro-marks on clasp, screen immaculate',
        'None. ECG, Blood Oxygen sensor, haptics 100% functional',
        'Includes magnetic fast charger cable and original sport band',
        'Pre-owned Apple Watch Series 7 45mm. Crack-resistant front crystal, fast charging capability, Always-On Retina display with full QWERTY keyboard.',
        '{"Size": "45 mm", "Battery Health": "89%", "Connectivity": "GPS, Wi-Fi, Bluetooth 5.0", "Sensors": "Blood Oxygen, ECG, Optical Heart Rate", "Water Resistance": "50 metres"}'::jsonb,
        'published',
        false
    ),
    -- Brand New Anker 65W GaN Fast Charger (Quantity accessory)
    (
        p_id_anker,
        'Anker 65W GaN Fast Charger (Nano II)',
        'Anker',
        'Nano II 65W',
        'accessories',
        'charger',
        22000.00,
        'Brand New',
        'Current Model',
        'quantity',
        20,
        NULL,
        'Brand new in Anker blister box',
        NULL,
        'Charger, User Guide',
        'Powered by GaN II technology. Super-compact high-speed charger capable of charging phones, tablets and USB-C notebooks including MacBook and Dell XPS.',
        '{"Wattage": "65 W Power Delivery", "Port": "1x USB-C", "Technology": "Gallium Nitride (GaN II)", "Compatibility": "iPhone, Samsung, MacBooks, Laptops"}'::jsonb,
        'published',
        false
    ),
    -- Brand New Baseus 20,000mAh Power Bank (Quantity accessory)
    (
        p_id_baseus,
        'Baseus 20,000mAh 65W Fast Charging Power Bank',
        'Baseus',
        'Blade 65W',
        'accessories',
        'powerbank',
        35000.00,
        'Brand New',
        'Current Model',
        'quantity',
        12,
        NULL,
        'Brand new in retail box with warranty card',
        NULL,
        'Power Bank, 100W USB-C to USB-C cable, velvet pouch',
        'Ultra-slim digital display 65W laptop and smartphone power bank. Charge an iPhone up to 4.5 times or full charge an M2 MacBook Air.',
        '{"Capacity": "20,000 mAh / 74Wh", "Max Output": "65 W PD Fast Charge", "Ports": "2x USB-C + 2x USB-A", "Digital Display": "Shows battery %, voltage, wattage"}'::jsonb,
        'published',
        true
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Images linked to Products
    INSERT INTO public.product_images (product_id, url, is_primary, display_order) VALUES
    -- iPhone 11 Purple (Multiple images)
    (p_id_ip11_purple, 'assets/images/products/iphone-11-purple-demo.jpg', true, 1),
    (p_id_ip11_purple, 'assets/images/products/iphone-11-purple-demo-2.jpg', false, 2),
    -- iPhone 11 Black
    (p_id_ip11_black,  'assets/images/products/iphone-11-black-demo.jpg', true, 1),
    -- Galaxy S24 FE (Multiple images)
    (p_id_s24fe,       'assets/images/products/galaxy-s24-fe-demo.jpg', true, 1),
    (p_id_s24fe,       'assets/images/products/galaxy-s24-fe-demo-2.jpg', false, 2),
    -- iPhone 15 Pro Max
    (p_id_ip15pm,      'assets/images/products/iphone-15-promax-demo.jpg', true, 1),
    -- Galaxy S10
    (p_id_s10,         'assets/images/products/galaxy-s10-demo.jpg', true, 1),
    -- Galaxy A55
    (p_id_a55,         'assets/images/products/galaxy-a55-demo.jpg', true, 1),
    -- HP EliteBook 840
    (p_id_hp840,       'assets/images/products/hp-elitebook-840-demo.jpg', true, 1),
    -- MacBook Air M2
    (p_id_macbook,     'assets/images/products/macbook-air-m2-demo.jpg', true, 1),
    -- iPad 10th Gen
    (p_id_ipad10,      'assets/images/products/ipad-10th-gen-demo.jpg', true, 1),
    -- JBL Flip 6
    (p_id_jbl6,        'assets/images/products/jbl-flip-6-demo.jpg', true, 1),
    -- Oraimo FreePods
    (p_id_oraimo,      'assets/images/products/oraimo-freepods-demo.jpg', true, 1),
    -- Sony XM5
    (p_id_sony,        'assets/images/products/sony-xm5-demo.jpg', true, 1),
    -- Galaxy Watch 6
    (p_id_watch6,      'assets/images/products/galaxy-watch-6-demo.jpg', true, 1),
    -- Apple Watch S7
    (p_id_watch7,      'assets/images/products/apple-watch-s7-demo.jpg', true, 1),
    -- Anker Charger
    (p_id_anker,       'assets/images/products/anker-65w-charger-demo.jpg', true, 1),
    -- Baseus Power Bank
    (p_id_baseus,      'assets/images/products/baseus-powerbank-demo.jpg', true, 1)
    ON CONFLICT (id) DO NOTHING;

    -- 3. Default Store Settings
    INSERT INTO public.store_settings (key, value) VALUES
    ('business_info', '{
        "name": "Melisco Gadgets",
        "tagline": "Quality New & Fairly Used Gadgets in Nigeria",
        "description": "Your trusted source for tested, authentic smartphones, laptops, audio devices and everyday tech essentials.",
        "whatsappNumber": "2348000000000",
        "email": "orders@meliscogadgets.com",
        "address": "Computer Village / Ikeja, Lagos, Nigeria",
        "instagram": "https://instagram.com",
        "facebook": "https://facebook.com",
        "twitter": "https://twitter.com"
    }'::jsonb)
    ON CONFLICT (key) DO NOTHING;

END $$;
