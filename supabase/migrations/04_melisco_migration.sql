-- ============================================================
-- Melisco Gadgets
-- Migration 04: Integrity, timestamps, and explicit privileges
--
-- Apply this AFTER migrations 01, 02 and 03.
-- This is an additive migration: it does not replace the originals.
-- ============================================================

BEGIN;

-- 1. Product specifications must always be a JSON object.
UPDATE public.products
SET specs = '{}'::jsonb
WHERE specs IS NULL;

ALTER TABLE public.products
    ALTER COLUMN specs SET DEFAULT '{}'::jsonb;

ALTER TABLE public.products
    ALTER COLUMN specs SET NOT NULL;

-- 2. A product marked sold must have no remaining stock.
-- Zero stock does not automatically mean sold: a product may be
-- published but temporarily out of stock.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.products
        WHERE status = 'sold' AND stock_quantity <> 0
    ) THEN
        RAISE EXCEPTION
            'Cannot add sold-stock constraint: products marked sold still have stock. Correct those rows first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_sold_products_zero_stock'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT chk_sold_products_zero_stock
            CHECK (status <> 'sold' OR stock_quantity = 0);
    END IF;
END;
$$;

-- 3. At most one primary image per product.
DO $$
BEGIN
    IF EXISTS (
        SELECT product_id
        FROM public.product_images
        WHERE is_primary = true
        GROUP BY product_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot create primary-image index: some products have multiple primary images. Correct those rows first.';
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_product_images_one_primary_per_product
ON public.product_images (product_id)
WHERE is_primary = true;

-- 4. Automatically maintain store_settings.updated_at.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_store_settings_updated_at
    ON public.store_settings;

CREATE TRIGGER trigger_store_settings_updated_at
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Explicit table privileges. These do not bypass RLS.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT
ON public.products, public.product_images, public.store_settings
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
ON public.products, public.product_images, public.store_settings
TO authenticated;

-- RLS still limits owners to their own allowlist row.
GRANT SELECT ON public.store_owners TO authenticated;

-- RLS policies call this function for anonymous and authenticated
-- requests. It returns false for anonymous users.
GRANT EXECUTE ON FUNCTION public.is_store_owner()
TO anon, authenticated;

COMMIT;

-- ============================================================
-- APPLICATION REQUIREMENTS (not SQL-only operations)
--
-- 1. When changing a product to status='sold', update its
--    stock_quantity to 0 in the same database update.
--
-- 2. A zero-stock product may remain published if it is
--    temporarily out of stock. Show "Out of stock" in the UI.
--
-- 3. When changing the primary image, unset the old primary
--    before setting the new one. The unique index prevents two
--    primary images from being committed.
--
-- 4. Deleting a product_images row does NOT delete its actual
--    Supabase Storage object. The dashboard must remove the
--    object using the Storage API, then delete the DB row.
--    Do not directly DELETE from storage.objects.
--
-- 5. Use a predictable path, e.g.:
--    products/<product-uuid>/<unique-filename>.webp
--    Compress/resize Android photos before upload and validate
--    MIME type and size in the frontend.
--
-- 6. Never put the Supabase service_role key in browser code.
-- ============================================================
