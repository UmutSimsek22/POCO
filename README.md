# 📦 POCO - Mobil POS, Barkodlu Kasa & Mağaza Yönetim Sistemi

<p align="center">
  <b>İşletmeler ve Esnaflar İçin Çoklu Cihaz Destekli, Rol Tabanlı, Hızlı ve Güvenilir Mobil Kasa Çözümü</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-v3.0.0-10B981?style=for-the-badge&logo=android" alt="POCO Version" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000000?style=for-the-badge&logo=expo" alt="Expo SDK 54" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

---

## 📱 Proje Hakkında

**POCO**, küçük ve orta ölçekli işletmelerin (market, büfe, kırtasiye, butik vb.) pahalı donanımsal barkod okuyuculara ihtiyaç duymadan, akıllı telefon kameralarıyla **ürün taramasına, stok/fiyat sorgulamasına, kâr marjı takibine ve hızlı kasa satışlarına** imkan tanıyan yeni nesil mobil otomasyon sistemidir.

---

## 📜 Sürüm Geçmişi ve Değişiklikler (Changelog)

### 🚀 POCO v3.0.0 (Gelişmiş Rol Yönetimi & UX Güncellemesi)
- 👥 **Rol Tabanlı Erişim Yönetimi (RBAC):** `Admin` (Yönetici), `Müdür` ve `Kasiyer` olmak üzere 3 farklı rol entegre edildi.
- 🔒 **Geliş (Maliyet) Fiyatı ve Kâr Marjı Gizleme:** Kasiyer rolündeki çalışanların ekranlarında alış fiyatları ve kâr marjları tamamen gizlendi.
- 📝 **Ürün Düzenleme (Edit) & Güvenli Silme (Soft Delete):** Ürün adı, barkodu, fiyatları, markası ve kategorisini tek tıkla güncelleme modalı eklendi. Ürün silme işlemleri geçmiş satış raporları bozulmasın diye `is_deleted` (Soft Delete) güvencesine alındı.
- 🏷️ **Kategori, Marka & Esnek Ürün Şeması:** Sadece **Ürün Adı** ve **Satış Fiyatı** zorunlu tutuldu (Barkod, Maliyet, Görsel, Marka, Kategori opsiyonel yapıldı). Arama ekranına kategori filtreleme çipleri eklendi.
- 🛒 **Kasada "+ Manuel Tutar" / Hızlı Satış:** Kaydı olmayan ürünler için kasada anında tutar girip sepete ekleme imkanı sağlandı.
- 🎯 **Barkod Kamerasını Yeşil Kutuya Kilitleme (ROI Boundary):** Barkod okuyucu kamera, kadrajdaki diğer barkodları yanlışlıkla okumamak için sadece ortadaki yeşil kılavuz kutunun içindeki barkodlara kilitlendi.
- 🖼️ **Ürün Görseli Fix & Storage Migration:** Yüklenen ürün fotoğraflarının listelerde ve detaylarda görünmesi sağlandı; tek tıkla çalıştırılabilir `supabase_v3_migration.sql` betiği projeye eklendi.

---

### 🎨 POCO v2.0.0 (Tasarım Ergonomisi & SDK 54 Upgrade)
- ⚙️ **Expo SDK 54 & React 19 Geçişi:** React Native 0.81.5, React 19.1.0 ve Hermes JS derleyici optimize edildi.
- 📱 **Ekran Taşıntısı Düzeltmeleri (Safe Area Padding):** Android durum çubuğu (Status Bar) ve çentik kaymalarını önlemek için güvenli alan boşlukları uygulandı.
- 🖐️ **Ergonomik Butonlar:** Tüm dokunmatik butonlar 44x44px yüksek kontrastlı kart tasarımlarına yükseltildi.
- 📸 **Kamera ile Doğrudan Ürün Fotoğrafı Çekme:** `expo-image-picker` ile 1:1 oranlı ürün fotoğrafı çekme ve galeriden görsel seçme aktifleşti.
- ⚡ **Ana Ekran Hızlı Kamera Kısayolu:** Ana ekrana doğrudan barkod tarayıcıyı başlatan buton yerleştirildi.
- 🔍 **Detay Modalı Çıkış Deneyimi:** Sorgulama ekranına "Tamam / Listeye Dön" butonu ve arka plana dokunarak kapatma (backdrop dismiss) eklendi.

---

### 📦 POCO v1.0.0 (Temel Sürüm / Main Branch)
- ⚡ **Supabase Cloud Entegrasyonu:** PostgreSQL veritabanı yapısı ve Tablo oluşturma.
- 🔑 **Mağaza Giriş Mantığı:** Mağaza Kodu ve PIN ile oturum açma / Yeni mağaza kurma.
- 📸 **Kamera Barkod Okuyucu:** `expo-camera` ve `expo-av` ile sesli (Bip) barkod okuma.
- 🛒 **Kasa & Hesapla Modülü:** Ürün sepeti, toplam tutar, alınan nakit ve para üstü hesaplama.
- 🔄 **Realtime Senkronizasyon:** Aynı mağaza hesabını açan tüm cihazlarda canlı ürün ve stok eşitlemesi.
- 📶 **Offline Desteği:** İnternet koptuğunda kesintisiz çalışma için `@react-native-async-storage/async-storage` önbellekleme.
- 🛠️ **CI/CD Pipeline:** GitHub Actions ile otomatik standalone Android `.apk` derleme iş akışı.

---

## 🛠️ Teknolojiler ve Mimari

- **Ön Yüz (Frontend):** React Native (Expo SDK 54), TypeScript, React 19.1.0
- **Arka Yüz (Backend / DB):** Supabase Cloud (PostgreSQL, Realtime WebSockets, Cloud Storage)
- **Derleyici (Engine):** Hermes JS Engine, Babel (`babel-preset-expo ~54.0.10`)
- **Medya & İzinler:** `expo-camera`, `expo-image-picker`, `expo-av`
- **Yerel Depolama (Offline Cache):** `@react-native-async-storage/async-storage`
- **CI/CD Build Pipeline:** GitHub Actions (Ubuntu 22.04, Java 17, Gradle 8.14, Kotlin 2.0.21)

---

## 📥 Güncel APK İndir ve Kur

En güncel derlenmiş **POCO Android APK** dosyasını telefonunuza indirip doğrudan kullanabilirsiniz:

👉 **[POCO Android APK İndir (GitHub Releases v3.0.0)](https://github.com/UmutSimsek22/POCO/releases)**

---

## 💻 Geliştirici Kurulumu (Local Setup)

Projeyi kendi bilgisayarınızda çalıştırmak için:

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/UmutSimsek22/POCO.git
   cd POCO
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Supabase SQL Migration Çalıştırın:**
   Supabase Dashboard -> **SQL Editor** sayfasına gidin ve projedeki [`supabase_v3_migration.sql`](file:///c:/Users/kbomu/OneDrive/Masaüstü/PoCo/supabase_v3_migration.sql) betiğini yapıştırıp çalıştırın.

4. **Ortam Değişkenlerini (`.env`) Oluşturun:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://nvzvttrjqbdsicmgjkiv.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Uygulamayı Başlatın:**
   ```bash
   npx expo start
   ```

---

## 📜 Lisans

Bu proje **MIT Lisansı** altında geliştirilmektedir.
