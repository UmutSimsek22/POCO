-- ==============================================================================
-- POCO v3.0 Supabase Veritabanı, Roller & Depolama (Storage) Güncellemesi
-- ==============================================================================
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor bölümüne yapıştırıp "Run" butonuna
-- basarak tüm v3 gereksinimlerini, Yaren Kırtasiye kodlarını ve TEST123 silme işlemini
-- tek seferde yapabilirsiniz.
-- ==============================================================================

-- 1. Storage Bucket: Ürün Fotoğrafları için 'product-images' (Public Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket Güvenlik Politikaları (Eski politikalar varsa kaldırılır ve yenisi eklenir)
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
CREATE POLICY "Public Access for Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow Upload Product Images" ON storage.objects;
CREATE POLICY "Allow Upload Product Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow Update Product Images" ON storage.objects;
CREATE POLICY "Allow Update Product Images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 2. 'stores' Tablosuna v3 Rol ve Onay Sütunları
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_code VARCHAR(20) DEFAULT '0059',
ADD COLUMN IF NOT EXISTS manager_code VARCHAR(20) DEFAULT '2858',
ADD COLUMN IF NOT EXISTS staff_code VARCHAR(20) DEFAULT '2014';

-- 3. 'products' Tablosuna v3 Marka ve Soft-Delete Sütunları
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

UPDATE public.products SET is_deleted = false WHERE is_deleted IS NULL;

-- 4. 👑 Yaren Kırtasiye İşletmesi Kodlarını ve Onayını Tanımla
UPDATE public.stores 
SET 
  admin_code = '0059',
  manager_code = '2858',
  staff_code = '2014',
  is_approved = true
WHERE store_code = 'YAREN2005' OR name ILIKE '%yaren%';

-- 5. 🗑️ TEST123 Mağazasını ve Eklediği Tüm Ürün/Satışları Sistemden Sil
DELETE FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE store_code = 'TEST123');
DELETE FROM public.sale_items WHERE sale_id IN (SELECT id FROM public.sales WHERE store_id IN (SELECT id FROM public.stores WHERE store_code = 'TEST123'));
DELETE FROM public.sales WHERE store_id IN (SELECT id FROM public.stores WHERE store_code = 'TEST123');
DELETE FROM public.stores WHERE store_code = 'TEST123';

-- 6. Yeni Mağazalar İçin Onay Mekanizması:
-- Bundan sonra açılacak her yeni mağaza siz onaylayana kadar kilitli kalır (is_approved = false)
ALTER TABLE public.stores ALTER COLUMN is_approved SET DEFAULT false;

-- 7. Performans ve Arama İndeksleri
CREATE INDEX IF NOT EXISTS idx_products_store_deleted ON public.products(store_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(store_id, category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(store_id, brand);
