-- ============================================================
-- Melisco Gadgets E-commerce Schema
-- Migration 01: Core Tables, Indexes, and Row Level Security
-- ============================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- Supports:
--   - Both 'individual' (unique used phone/laptop) and 'quantity' (accessories/new stock)
--   - Condition: 'Brand New' or 'Fairly Used'
--   - Model Age: 'Current Model' or 'Older Model'
--   - Status: 'draft', 'published', 'sold', 'archived'
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
    stock_quantity INTEGER NOT NULL DEFAULT 1 CHECK (stock_quantity >= 0),
    
    -- Used / Individual device specific fields
    battery_health INTEGER CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
    cosmetic_condition TEXT,
    faults TEXT,
    accessories_included TEXT,
    
    description TEXT,
    specs JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'sold', 'archived')),
    featured BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
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
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------
-- 2. PRODUCT IMAGES TABLE
-- Supports multiple photos per product with primary selection & ordering
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- ------------------------------------------------------------
-- 3. STORE SETTINGS TABLE (Configurable store parameters)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict security model:
--   - Unauthenticated visitors can ONLY SELECT published products
--   - Authenticated owner can SELECT, INSERT, UPDATE, DELETE all records
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
    USING (status = 'published');

DROP POLICY IF EXISTS "Owner has full access to products" ON public.products;
CREATE POLICY "Owner has full access to products"
    ON public.products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

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
    );

DROP POLICY IF EXISTS "Owner has full access to product images" ON public.product_images;
CREATE POLICY "Owner has full access to product images"
    ON public.product_images
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Store Settings Policies
DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
CREATE POLICY "Public can read store settings"
    ON public.store_settings
    FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Owner can modify store settings" ON public.store_settings;
CREATE POLICY "Owner can modify store settings"
    ON public.store_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
