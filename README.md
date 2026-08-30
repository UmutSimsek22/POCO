# 📦 PoCo - Mobil POS & Barkodlu Kasa Yönetim Sistemi

<p align="center">
  <b>İşletmeler ve Küçük Esnaflar İçin Hızlı, Güvenilir ve Çoklu Cihaz Destekli Mobil Kasa Çözümü</b>
</p>

---

## 🚀 Öne Çıkan Özellikler

- 📸 **Kamera ile Hızlı Barkod Tarama:** Telefon kamerasını yüksek hızlı barkod okuyucuya dönüştürür. Sesli geri bildirim (Beep) ve flaş desteği içerir.
- 🛒 **Gelişmiş Kasa & Satış Ekranı:** Barkod okutuldukça ürünleri listeye ekler, nakit üstü hesaplar, satışları anında veritabanına kaydeder.
- 🔄 **Gerçek Zamanlı Çoklu Cihaz Senkronizasyonu (Supabase Realtime):** Aynı dükkan kodu ve PIN ile giriş yapan tüm telefonlarda stoklar ve ürünler anında senkronize olur.
- 📊 **Kâr & Marj Hesaplama:** Ürün alış ve satış fiyatına göre net kâr tutarını ve kâr marjı yüzdesini otomatik hesaplar.
- 📶 **Offline Desteği:** İnternet kesilse bile yerel önbellek (AsyncStorage) sayesinde ürün sorgulama ve liste işlemleri kesintisiz devam eder.
- ⚡ **Tanımsız Barkod Yönetimi:** Kasada okutulan ürün sistemde yoksa, sepet sıfırlanmadan doğrudan "Yeni Ürün Ekle" ekranına aktarır.

---

## 🛠️ Teknolojiler & Mimarisi

- **Frontend:** React Native (Expo SDK 52) & TypeScript
- **Backend / Database:** Supabase Cloud (PostgreSQL + RLS Güvenlik Politikaları)
- **Realtime Engine:** Supabase Realtime Subscriptions
- **Depolama:** Supabase Storage (`product-images` bucket)
- **Local Cache:** `@react-native-async-storage/async-storage`
- **Kamera & Ses:** `expo-camera`, `expo-av`
- **CI/CD Build:** GitHub Actions (Otomatik Android APK Derleme)

---

## 📲 APK İndir ve Kullan

En güncel derlenmiş Android APK dosyasını telefonunuza indirip doğrudan kurabilirsiniz:

👉 **[PoCo Android APK İndir (GitHub Releases)](https://github.com/UmutSimsek22/PoCO/releases)**

---

## 💻 Geliştirici Kurulumu (Local Setup)

Projeyi kendi bilgisayarınızda çalıştırmak için:

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/UmutSimsek22/PoCO.git
   cd PoCO
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Ortam değişkenlerini (`.env`) tanımlayın:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://nvzvttrjqbdsicmgjkiv.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Uygulamayı başlatın:
   ```bash
   npx expo start
   ```

---

## 📜 Lisans

Bu proje MIT Lisansı altında geliştirilmiştir.
