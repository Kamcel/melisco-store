-- ============================================================
-- Melisco Gadgets E-commerce Schema
-- Migration 02: Storage Bucket Configuration & Owner RLS
-- ============================================================

-- Create public storage bucket for product images if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB maximum file upload size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ------------------------------------------------------------
-- Storage Policies
--   - Public (anon + authenticated) can view/download images
--   - ONLY the authorized store owner (via public.is_store_owner())
--     can upload, update or delete images.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Owner can upload product images" ON storage.objects;
CREATE POLICY "Owner can upload product images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'product-images' AND
        public.is_store_owner()
    );

DROP POLICY IF EXISTS "Owner can update product images" ON storage.objects;
CREATE POLICY "Owner can update product images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'product-images' AND
        public.is_store_owner()
    )
    WITH CHECK (
        bucket_id = 'product-images' AND
        public.is_store_owner()
    );

DROP POLICY IF EXISTS "Owner can delete product images" ON storage.objects;
CREATE POLICY "Owner can delete product images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'product-images' AND
        public.is_store_owner()
    );
