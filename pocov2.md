# 📋 POCO v2 - Kararlaştırılan Geliştirme & İyileştirme Planı

**Tarih:** 2026-08-30  
**Hedef Sürüm:** POCO v2.0.0  
**Durum:** Planlandı & Onay Bekliyor (Henüz Koda Başlanmadı)

---

## 🎯 Kesinleşen Tasarım & Fonksiyonel Kararlar

### 1. 👑 Size Özel Süper Admin Kontrol Paneli (İlerleyen Aşamada)
- **Gizli Süper Admin Girişi:** Sadece sizin belirleyeceğiniz özel bir Süper Admin PIN / Giriş mekanizması.
- **İşletme Metrikleri:** Sistemdeki toplam aktif dükkan sayısı, toplam ürün kalemi ve toplam satış cirosunu anlık görüntüleme.
- **Dükkan Listesi & Detaylar:** Kayıtlı dükkanların kodlarını, açılış tarihlerini ve son aktivite zamanlarını inceleme.
- **Dükkan Yönetimi:** İstenmeyen veya pasif dükkanları askıya alma / silme yetkisi.

---

### 2. 🖼️ Ana Ekran Simge & Hızlı Kamera Butonu (Daha sonra detaylandırılacak)
- **Üst Bar Hızlı Kamera:** Ana ekranın üst çubuğuna (sağ üste) hızlı bir kamera/barkod tarama simge butonu eklenecek.
- **Sorgula Kartı:** Canlı mavi zemin, belirgin arama/tarama ikonu (`search` / `scan`).
- **Ekle Kartı:** Zümrüt yeşili zemin, ürün ekleme ikonu (`add-circle` / `cube`).
- **Hesapla Kartı:** Kehribar sarısı zemin, kasa/hesaplama ikonu (`calculator` / `cash`).
- *(Not: Simgeler ve ikon değişiklikleri sizinle birlikte ayrıca detaylandırılacaktır)*

---

### 3. 📸 Ürün Fotoğrafı Eklemede Kamera Düzeltmesi (`AddProductScreen`)
- `app.json` eklentilerine `expo-image-picker` için kamera izni ve açıklaması eklenecek.
- `ImagePicker.launchCameraAsync` çağrısı Expo SDK 52 standartlarına (`mediaTypes: ['images']`) güncellenecek.
- Fotoğraf çekiminde olası kamera izni durumları için açıklayıcı bildirim eklenecek.

---

### 4. 📱 Üst Bar & Geri / Çıkış Butonları Ergonomisi (Tüm Ekranlar)
- Android durum çubuğu (`StatusBar.currentHeight`) ve kamera çentiği altına taşmaları önlemek için güvenli alan boşluğu (Safe Area Padding) uygulanacak.
- Üst bardaki Geri ve Çıkış butonları **44x44px geniş dokunmatik alana**, yuvarlatılmış kart stiline ve yüksek kontrastlı simgelere dönüştürülecek.

---

### 5. 🔍 Ürün Sorgulama Ekranı Detay Modalı Çıkış Deneyimi (`QueryScreen`)
- Ürün detay kartının altına geniş ve belirgin **"Kapat"** butonu eklenecek.
- Karartılmış arka plana (backdrop) dokunulduğunda modal otomatik kapanacak.
- Sağ üstteki kapatma (X) butonu büyütülecek (minimum 36x36px dokunma alanı).

---

## 🔒 Git & Çalışma Protokolü
- **KURAL 1:** Kod yazımına kullanıcı hazır olduğunu söyleyene kadar başlanmayacaktır.
- **KURAL 2:** Tüm değişiklikler yalnızca yerel ortamda (`local`) yapılacaktır. Kullanıcıdan açıkça "commit yapabilirsin / push yapabilirsin" komutu gelene kadar hiçbir Git işlemi yapılmayacaktır.
