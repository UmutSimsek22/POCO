# 🚀 POCO v3 & v4 - Gelecek Sürümler Yol Haritası & Fikir Havuzu

**Oluşturulma Tarihi:** 2026-08-31  
**Son Güncelleme:** 2026-09-07  
**Durum:** Fikir Aşaması & Taslak (Not Alındı, Henüz Kodlamaya Başlanmadı)

---

## 🖼️ UYGULAMA PLANİ: Ürün Görsellerinin Görünmemesi Sorunu (Image Fix Plan)

### 📋 Sorunun Teşhisi
Kullanıcı ürün eklerken fotoğraf yüklemesine rağmen, **Ürün Sorgulama (`QueryScreen`)** detay modalında ve **Kasa (`CashierScreen`)** ekranında ürünün görseli yerine kutu ikonu (`cube-outline` placeholder) görünmektedir.

### 🔍 Kök Neden Hipotezleri
1. **Supabase Storage Public İzni (En Yüksek İhtimal):** Supabase Storage üzerindeki `product-images` bucket'ı "Public" olarak işaretlenmemiş veya RLS (Row Level Security) politikalarında anonim kullanıcılar için `SELECT/READ` izni açık değil. Bu nedenle `getPublicUrl` adresinden çekilen resim 403 Forbidden hatası verip yüklenemiyor.
2. **Resim Yükleme Hatası (Upload Error):** `uploadProductImage` fonksiyonunda `fetch(uri)` ile blob oluşturulurken cihazın dosya erişim izni veya contentType uyumsuzluğu sebebiyle `finalImageUrl` veritabanına varsayılan olarak `null` kaydoluyor.
3. **React Native `<Image>` Handling:** Mobil `<Image>` bileşeninde `onError` kontrolü olmadığı için yükleme başarısız olduğunda sessizce placeholder'a düşüyor.

---

### 🛠️ v3 Çözüm Planı Adımları

#### 1. Supabase Storage İzinlerinin Yapılandırılması
- Supabase Dashboard -> **Storage** sekmesine gidilir.
- `product-images` bucket'ının **Public Bucket** seçeneği aktif edilir.
- `anon` ve `authenticated` rollerine resimleri okuma (`SELECT`) izni veren RLS politikası tanımlanır.

#### 2. `StoreContext.tsx` Görsel Yükleme Kontrolü
- `uploadProductImage` fonksiyonuna detaylı loglama ve hata yakalama (`try-catch`) eklenir.
- Yüklenen resmi doğrulamak için veritabanına kaydedilen `image_url` bağlantısının `https://` ile başlayıp başlamadığı kontrol edilir.

#### 3. Frontend `<Image>` Bileşeni Güçlendirmesi (`QueryScreen` & `CashierScreen`)
- `<Image source={{ uri: selectedProduct.image_url }} />` bileşenlerine `onError={(e) => console.log('Resim yüklenemedi:', e.nativeEvent.error)}` ve `resizeMode="cover"` eklenir.
- `image_url` boş gelirse veya yüklenemezse daha şık ve yumuşak bir placeholder tasarımı gösterilir.

#### 4. Test & Doğrulama
- Yeni bir ürün fotoğrafı kameradan çekilip eklenir.
- Hem `QueryScreen` detay modalında hem de `CashierScreen` sepetinde fotoğrafın net şekilde görüntülendiği doğrulanır.

---

## 🔒 POCO v3: Rol Tabanlı Erişim, UX İyileştirmeleri & Gelişmiş Ürün Yönetimi

### 1. 👥 Rol Tabanlı Erişim (RBAC) & Mağaza Onay Sistemi
- **3 Farklı Kullanıcı Rolü:**
  - 👑 **Admin (Mağaza Sahibi):** Tam yetki (Ürün Ekle/Düzenle/Sil, Personel/Rol Kodlarını Yönet).
  - 👔 **Müdür:** Maliyet görme, Ürün Ekleme & Düzenleme yetkisi (Silme ve Personel/Erişim Kodu yönetimi hariç).
  - 🛒 **Kasiyer / Çalışan:** Sadece ürün arama, satış fiyatı görme ve kasada ürün satma yetkisi (Maliyet görme, Ürün Ekleme/Düzenleme/Silme tamamen kapalı).
- **Süper Admin Mağaza Onay Mekanizması:**
  - Yeni mağaza kaydolduğunda durumu `pending_approval` (Onay Bekliyor) olacak.
  - Sistem sahibi (Siz) onaylamadan mağaza aktifleşmeyecek, veritabanı gereksiz/izinsiz mağazalarla dolmayacak.
- **Rol Kodları (Access Codes) İle Giriş:**
  - Mağaza Kodu + Mağaza PIN + Çalışan Rol Kodu (Örn: Admin = `a44hj`, Müdür = `tw56p`, Kasiyer = `sp12`).

### 2. 📝 Ürün Yapısı, Görsel Görünürlüğü (Fix) & Kategori/Marka
- **Zorunlu ve İsteğe Bağlı (Nullable) Alanlar:**
  - 🔴 **Zorunlu Alanlar:** Sadece **Ürün Adı** ve **Satış Fiyatı**.
  - 🟢 **İsteğe Bağlı (Optional/Null):** Barkod, Alış (Geliş) Fiyatı, Fotoğraf, Kategori, Marka, Stok.
- **Kategori & Marka Desteği:**
  - Ürün ekleme ve düzenleme ekranında Kategori (mevcut kategorilerden seçme veya yeni ekleme) ve Marka tanımlayabilme.
- **Gelişmiş Ürün Düzenleme & Silme:**
  - Admin ve Müdür ürün düzenleyebilecek (Edit).
  - Yalnızca Admin ürün silebilecek (Soft Delete).
- **Arama Ekranında Filtreleme (`QueryScreen`):**
  - Ürün arama ekranına Kategoriye, Markaya veya Fiyat aralığına göre filtreleme butonları.

### 3. 🛒 Kasa Ekranı & Barkod Okuma İyileştirmeleri
- **Hızlı "Artı Ürün / Manuel Tutar" Butonu (`CashierScreen`):**
  - Yoğun anlarda sistemde kaydı olmayan bir ürün için kasaya hızlıca manuel tutar (ör. +50 TL "İsimsiz Ürün") ekleyebilme.
- **Kamera Odaklama Alanı (Bounding Box ROI Fix):**
  - Barkod okuyucu kamerası sadece ekrandaki yeşil kılavuz dörtgenin içindeki barkodları okuyacak. Dışarıdaki barkodların veya yanlış etiketlerin okunması engellenecek.

---

## 📊 POCO v4: Stok Takibi, Satış Analitiği & İstatistikler

### 1. 📦 Ürün Stok Takibi
- Her ürün için opsiyonel stok miktarı (adet/kg).
- Kasa satışında otomatik stok düşme.
- Kritik stok uyarısı.

### 2. 💰 Satış Geçmişi & Kasa Raporları
- Anlık ve günlük satış hafızası.
- Günlük ürün bazlı satış dökümü.
- Toplam ciro, toplam maliyet, net kâr hesabı.
- Verilen para üstü düşülmüş net kasa bakiyesi.
- Grafikler ve İstatistik Paneli.
