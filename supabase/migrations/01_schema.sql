-- ============================================================
-- Melisco Gadgets E-commerce Schema
-- Migration 01: Core Tables, Security & Owner Authorization
-- ============================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. OWNER AUTHORIZATION TABLE & SECURITY DEFINER FUNCTION
-- Dedicated owner allowlist: avoids RLS recursion, guarantees
-- only designated store owner(s) receive admin access.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_owners (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on store_owners allowlist
ALTER TABLE public.store_owners ENABLE ROW LEVEL SECURITY;

-- Security Definer check: avoids recursion and executes with elevated privilege
-- to safely check the allowlist without exposing it to the public.
CREATE OR REPLACE FUNCTION public.is_store_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.store_owners
            WHERE user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow authenticated owners to read their own allowlist row
DROP POLICY IF EXISTS "Owners can view owner allowlist" ON public.store_owners;
CREATE POLICY "Owners can view owner allowlist"
    ON public.store_owners
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 2. PRODUCTS TABLE
-- Enforces:
--   - For 'individual' devices: stock_quantity MUST be 0 (sold) or 1 (available)
--   - For 'quantity' items: stock_quantity must be >= 0
--   - Strict condition, model age, inventory type, status & price checks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    condition TEXT NOT NULL CHECK (condition IN ('Brand New', 'Fairly Used')),
    model_age TEXT NOT NULL DEFAULT 'Current Model' CHECK (model_age IN ('Current Model', 'Older Model')),
    inventory_type TEXT NOT NULL DEFAULT 'quantity' CHECK (inventory_type IN ('individual', 'quantity')),
    stock_quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Used / Individual device specific fields
    battery_health INTEGER CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
    cosmetic_condition TEXT,
    faults TEXT,
    accessories_included TEXT,
    
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Independent database-level inventory constraints
    CONSTRAINT chk_inventory_stock_limits CHECK (
        (inventory_type = 'individual' AND stock_quantity IN (0, 1)) OR
        (inventory_type = 'quantity' AND stock_quantity >= 0)
    )
);

-- Index commonly queried columns
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_condition ON public.products(condition);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- 3. PRODUCT IMAGES TABLE
-- Supports multiple photos per product with primary selection & ordering.
-- Unique constraint prevents duplicate image records on repeated seeds.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_images_product_url UNIQUE (product_id, url)
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- ------------------------------------------------------------
-- 4. STORE SETTINGS TABLE
-- Configurable store parameters with explicit is_public visibility flag.
-- Public visitors can only view rows where is_public = true.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict security model:
--   - Unauthenticated visitors can ONLY SELECT published products,
--     images of published products, and public store settings.
--   - ONLY authenticated users listed in public.store_owners can
--     insert, update, delete, or view unpublished records.
-- ------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published' OR public.is_store_owner());

DROP POLICY IF EXISTS "Owner has full access to products" ON public.products;
DROP POLICY IF EXISTS "Owner can insert products" ON public.products;
CREATE POLICY "Owner can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_store_owner());

DROP POLICY IF EXISTS "Owner can update products" ON public.products;
CREATE POLICY "Owner can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (public.is_store_owner())
    WITH CHECK (public.is_store_owner());

DROP POLICY IF EXISTS "Owner can delete products" ON public.products;
CREATE POLICY "Owner can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (public.is_store_owner());

-- Product Images Policies
DROP POLICY IF EXISTS "Public can view images for published products" ON public.product_images;
CREATE POLICY "Public can view images for published products"
    ON public.product_images
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_images.product_id
            AND p.status = 'published'
        )
        OR public.is_store_owner()
    );

DROP POLICY IF EXISTS "Owner has full access to product images" ON public.product_images;
DROP POLICY IF EXISTS "Owner can insert product images" ON public.product_images;
CREATE POLICY "Owner can insert product images"
    ON public.product_images
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_store_owner());

DROP POLICY IF EXISTS "Owner can update product images" ON public.product_images;
CREATE POLICY "Owner can update product images"
    ON public.product_images
    FOR UPDATE
    TO authenticated
    USING (public.is_store_owner())
    WITH CHECK (public.is_store_owner());

DROP POLICY IF EXISTS "Owner can delete product images" ON public.product_images;
CREATE POLICY "Owner can delete product images"
    ON public.product_images
    FOR DELETE
    TO authenticated
    USING (public.is_store_owner());

-- Store Settings Policies
DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can read public store settings" ON public.store_settings;
CREATE POLICY "Public can read public store settings"
    ON public.store_settings
    FOR SELECT
    TO anon, authenticated
    USING (is_public = true OR public.is_store_owner());

DROP POLICY IF EXISTS "Owner can modify store settings" ON public.store_settings;
CREATE POLICY "Owner can modify store settings"
    ON public.store_settings
    FOR ALL
    TO authenticated
    USING (public.is_store_owner())
    WITH CHECK (public.is_store_owner());
