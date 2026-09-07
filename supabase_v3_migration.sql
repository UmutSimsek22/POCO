-- ==============================================================================
-- POCO v3.0 Supabase Veritabanı & Depolama (Storage) Güncellemesi (Migration)
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor bölümüne yapıştırıp "Run" diyerek
-- tüm v3 veritabanı ve depolama gereksinimlerini tek seferde kurabilirsiniz.
-- ==============================================================================

-- 1. Storage Bucket: Ürün Fotoğrafları için 'product-images' (Public Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket için Herkese Açık Okuma (SELECT) Politikası
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Public Access for Product Images'
  ) THEN
    CREATE POLICY "Public Access for Product Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Bucket için Anonim/Yetkili Kullanıcı Yükleme (INSERT/UPDATE) Politikası
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow Upload Product Images'
  ) THEN
    CREATE POLICY "Allow Upload Product Images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow Update Product Images'
  ) THEN
    CREATE POLICY "Allow Update Product Images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- 2. 'stores' Tablosuna v3 Rol ve Onay Sütunları
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_code VARCHAR(20) DEFAULT 'ADMIN',
ADD COLUMN IF NOT EXISTS manager_code VARCHAR(20) DEFAULT 'MUDUR',
ADD COLUMN IF NOT EXISTS staff_code VARCHAR(20) DEFAULT 'KASA';

-- Mevcut mağazaları otomatik onaylı yap
UPDATE public.stores SET is_approved = true WHERE is_approved IS NULL;

-- 3. 'products' Tablosuna v3 Marka ve Soft-Delete Sütunları
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Mevcut ürünlerin is_deleted değerini false yap
UPDATE public.products SET is_deleted = false WHERE is_deleted IS NULL;

-- 4. Performans ve Arama İndeksleri
CREATE INDEX IF NOT EXISTS idx_products_store_deleted ON public.products(store_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(store_id, category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(store_id, brand);
