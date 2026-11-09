# Melisco Gadgets — Production E-commerce Platform

A modern, fast, and accessible electronics e-commerce storefront and mobile-first owner administration dashboard for **Melisco Gadgets** (Nigeria). Built with clean HTML, CSS, JavaScript, Supabase PostgreSQL, Supabase Auth, Supabase Storage, and deployed via Cloudflare Pages.

---

## 1. Project Folder Structure

```text
melisco-store/
├── index.html                   # Customer storefront homepage
├── _headers                     # Cloudflare Pages security headers and cache rules
├── _redirects                   # Cloudflare Pages routing redirects
├── .env.example                 # Environment configuration template
├── README.md                    # Complete setup and deployment documentation
│
├── admin/                       # Owner administration portal
│   ├── index.html               # Mobile-first Android admin dashboard
│   └── admin.js                 # Admin management & Supabase Auth logic
│
├── assets/                      # Static assets & images
│   └── images/
│       ├── ATTRIBUTION.md       # Demonstration image sources and CC licenses
│       ├── placeholder.svg      # Neutral fallback vector image
│       └── products/            # Local product demonstration images (100% offline-ready)
│           ├── iphone-11-purple-demo.jpg
│           ├── iphone-11-purple-demo-2.jpg
│           ├── iphone-11-black-demo.jpg
│           ├── galaxy-s24-fe-demo.jpg
│           ├── galaxy-s10-demo.jpg
│           ├── hp-elitebook-840-demo.jpg
│           ├── macbook-air-m2-demo.jpg
│           ├── oraimo-freepods-demo.jpg
│           └── ... (all demonstration images stored locally)
│
├── css/                         # Stylesheets
│   ├── style.css                # Storefront styling (Samsung-inspired aesthetic)
│   └── admin.css                # Mobile-first Android dashboard styles
│
├── js/                          # Frontend application logic
│   ├── config.js                # Central store & Supabase configuration
│   ├── supabase-client.js       # Supabase client + offline fallback adapter
│   ├── cart.js                  # Cart logic, inventory rules & WhatsApp order generator
│   └── main.js                  # Storefront catalogue, filters & multi-image modal
│
└── supabase/                    # Database setup & migrations
    └── migrations/
        ├── 01_schema.sql        # Products, images, settings & RLS security policies
        ├── 02_storage.sql       # Storage bucket 'product-images' configuration
        └── 03_seed.sql          # Seed dataset with Nigerian gadget inventory
```

---

## 2. How to Run the Website Locally

You can run the storefront and admin panel locally using any standard HTTP server or by opening `index.html` directly.

### Option A: Using Node / npx (Recommended)
Open your terminal in the `melisco-store` directory:
```bash
npx serve .
```
or
```bash
npx http-server -p 8080
```
Then visit:
- **Customer Storefront:** `http://localhost:8080/`
- **Owner Admin Portal:** `http://localhost:8080/admin/`

### Option B: Using Python
```bash
# Python 3
python -m http.server 8080
```

### Option C: Direct Browser Opening
Because all demonstration images and scripts use relative paths, you can open `index.html` directly in Google Chrome, Microsoft Edge, or Firefox.

> **Offline/Demo Mode Notice:**
> The project includes a built-in fallback data adapter in `js/supabase-client.js`. If Supabase credentials have not been configured yet, the store runs immediately with pre-loaded local demonstration inventory. You can browse, test the cart, test WhatsApp checkout, and sign into the admin portal (`owner@melisco.ng` / `Melisco2024!`) straight out of the box!

---

## 3. How to Create a Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**.
3. Choose an organization, enter a name (e.g. `melisco-gadgets`), and create a secure database password.
4. Select the region closest to Nigeria (e.g. `eu-west-1` London or `eu-central-1` Frankfurt).
5. Click **Create new project** and wait ~2 minutes for provisioning to complete.

---

## 4. How to Run the SQL Migrations

1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation menu.
2. Click **New Query**.
3. Open `supabase/migrations/01_schema.sql` from this repository, copy its entire contents, paste it into the SQL Editor, and click **Run**.
   - This creates the `products`, `product_images`, and `store_settings` tables, indexes, updated_at triggers, and enables Row Level Security (RLS).
4. Create another new query, copy the contents of `supabase/migrations/02_storage.sql`, paste it, and click **Run**.
   - This creates the public `product-images` storage bucket and security policies.
5. Create a third new query, copy `supabase/migrations/03_seed.sql`, paste it, and click **Run**.
   - This seeds realistic Nigerian gadget store inventory (used iPhone 11s, S10, laptops, earbuds, chargers).

---

## 5. How to Configure Supabase Storage

1. Navigate to **Storage** in your Supabase Dashboard.
2. Verify that the bucket named `product-images` is listed.
3. Confirm that **Public bucket** is enabled (so product images can be read by visitors' browsers).
4. Verify RLS policies on `storage.objects`:
   - `Public can view product images` allows anonymous `SELECT`.
   - `Owner can upload product images` restricts `INSERT` to authenticated users (`auth.role() = 'authenticated'`).
   - `Owner can delete product images` restricts `DELETE` to authenticated users.

---

## 6. How to Create the Owner's First Account Securely

Public user registration is disabled to ensure only the authorized store owner can access management functions.

To create the owner's account:
1. In the Supabase Dashboard, navigate to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter the store owner's email (e.g., `owner@meliscogadgets.ng`) and set a strong, unique password.
4. Ensure **Auto Confirm User** is checked.
5. Click **Create User**.
6. The owner can now sign in at `https://your-domain.com/admin/`.

---

## 7. How to Configure the Business WhatsApp Number

Open `js/config.js` in a text editor:

```javascript
const STORE_CONFIG = {
  name: "Melisco Gadgets",
  tagline: "Quality New & Fairly Used Gadgets in Nigeria",
  
  // Enter international format WITHOUT '+' or spaces
  // Example for Nigerian number 08012345678:
  whatsappNumber: "2348012345678",
  
  email: "hello@meliscogadgets.ng",
  address: "Computer Village, Ikeja, Lagos, Nigeria",
  instagram: "https://instagram.com/meliscogadgets",
  // ...
};
```

If the default placeholder number (`2348000000000`) is left in place, checkout displays a helpful alert prompting the owner to update the number.

---

## 8. Connecting GitHub to Cloudflare Pages

Cloudflare Pages provides global CDN hosting, high performance, and automatic SSL certificates.

### Step 1: Push code to GitHub
```bash
git init
git add .
git commit -m "Initial commit of Melisco Gadgets E-commerce website"
git remote add origin https://github.com/your-username/melisco-gadgets.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Cloudflare Pages
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your GitHub repository (`melisco-gadgets`).
4. In **Set up builds and deployments**:
   - **Project name:** `melisco-gadgets`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `.` (root directory)
5. Click **Save and Deploy**.
6. Cloudflare Pages will build and deploy your site to `https://melisco-gadgets.pages.dev`.

---

## 9. How to Configure Supabase in Frontend

Open `js/config.js` and enter your project credentials:

```javascript
const SUPABASE_CONFIG = {
  url: "https://your-project-id.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  storageBucket: "product-images",
};
```

> **Security Reminder:**
> Only use your public `anonKey`. Never use or expose your `service_role` key in frontend JavaScript.

---

## 10. How to Replace Demonstration Images with Real Product Photographs

The store owner does not need to edit any code to update images:

1. Open `https://your-domain.com/admin/` on an Android phone or computer.
2. Sign in with the owner credentials.
3. Find the product in the inventory list and tap **Edit**.
4. In the **Photographs** section, tap the upload area to choose photos from the phone's gallery or take a live picture with the camera.
5. The photos are automatically uploaded to Supabase Storage and linked to the listing.
6. Tap **Publish Product**. The customer storefront updates immediately.

---

## 11. How the Owner Uses the Admin Dashboard

The dashboard is built mobile-first for quick management on an Android phone:

1. **Dashboard Home:** Shows immediate counters for **Published**, **Total Stock**, **Sold Out**, and **Drafts**.
2. **Add Individual Used Phone:**
   - Tap **Add New Product**.
   - Enter name (e.g. `Apple iPhone 11 – 128GB (Purple)`).
   - Condition: Select `Fairly Used`.
   - Inventory Type: Select `Individual Unique Device`.
   - Fill in **Battery Health (%)**, **Cosmetic Condition**, **Defects / Faults**, and **Included Accessories**.
   - Tap **Publish Product**.
3. **Add Quantity-Based Accessory:**
   - Condition: Select `Brand New`.
   - Inventory Type: Select `Product with Quantity`.
   - Enter **Available Quantity in Stock** (e.g. `15`).
4. **Marking a Device as Sold:**
   - In the product list, tap the red **Mark as Sold** button on any individual device.
   - The device immediately shows a `SOLD OUT` badge on the storefront and can no longer be added to cart.
5. **Deleting a Gadget:**
   - Tap **Delete**. A confirmation modal prevents accidental deletion.

---

## 12. Deployment Checklist

- [x] All demonstration images downloaded and saved locally in `assets/images/products/`
- [x] SQL schema, storage setup, and seed migration files verified
- [x] Row Level Security (RLS) policies tested
- [x] Mobile-first admin dashboard created with touch targets ≥ 48px
- [x] Cart stock validation implemented (individual devices capped at 1, accessories capped at available stock)
- [x] WhatsApp order message format strictly configured with encoded URL
- [x] Central store configuration file `js/config.js` created
- [x] Neutral SVG fallback `assets/images/placeholder.svg` implemented
- [x] Cloudflare Pages `_headers` and `_redirects` files generated
- [x] No service-role keys or secret credentials exposed in client code
