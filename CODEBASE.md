# 📘 POCO Codebase & Project Context

> Bu dosya Antigravity ve geliştiriciler için projenin güncel mimarisini, teknik kararlarını, kurallarını ve sürüm durumunu özetler. Diğer bilgisayarda bu depoyu cloneladığınızda Antigravity projeyi doğrudan tanır.

---

## 🚀 Proje Özeti
**POCO**, küçük ve orta ölçekli işletmeler için geliştirilmiş mobil barkod okuyucu, ürün arama, kâr/zarar ve kasa otomasyonu uygulamasıdır.

- **Frontend:** React Native (Expo SDK 54), TypeScript, React 19.1.0, React Native 0.81.5
- **Backend / Database:** Supabase (PostgreSQL, Realtime Sync, Storage)
- **CI/CD:** GitHub Actions (Automated Standalone Android APK Release workflow)
- **Aktif Çalışma Branch'i:** `pocoV2up`

---

## 🛠️ Temel Proje Yapısı

```text
PoCo/
├── assets/                  # İkonlar, splash ekranı ve görseller
├── src/
│   ├── context/
│   │   └── StoreContext.tsx # Supabase bağlantısı, mağaza oturumu, ürün & eşitleme state'i
│   ├── screens/
│   │   ├── StoreLoginScreen.tsx # Mağaza kodu ve PIN ile giriş / Yeni mağaza kurma
│   │   ├── HomeScreen.tsx       # Ana kontrol ekranı (Sorgula, Ekle, Hesapla butonları)
│   │   ├── AddProductScreen.tsx  # Ürün ekleme, kamerayla barkod okuma & fotoğraf çekme
│   │   ├── QueryScreen.tsx       # Barkod/isimle ürün arama & kâr marjı detay modalı
│   │   └── CashierScreen.tsx     # Kasa hesabı, sepet, toplam tutar ve para üstü hesabı
│   ├── services/
│   │   └── supabase.ts      # Supabase istemci yapılandırması
│   └── types/               # TypeScript tip tanımları (Product, Store vb.)
├── .github/workflows/
│   └── build-apk.yml        # GitHub Actions APK derleme ve v2.0.0 Release iş akışı
├── app.json                 # Expo konfigürasyonu (Permissions, Plugins, Build properties)
├── babel.config.js          # Babel preset (babel-preset-expo ~54.0.10)
├── package.json             # Bağımlılıklar (SDK 54 uyumlu)
├── pocov2.md                # v2 sürümünde yapılan UI/UX ve sistem iyileştirmeleri
└── pocov3.md                # v3 (Rol/Admin Paneli) ve v4 (Stok/Satış Analitiği) yol haritası
```

---

## 🔑 Test Veritabanı & Giriş Bilgileri

Supabase canlı test mağazası bilgileri:
- **Mağaza Kodu:** `TEST123`
- **PIN Kodu:** `1234`
- **Mağaza Adı:** `Test`

---

## 🔒 Git & Çalışma Kuralları (MANDATORY RULES)

1. **ASLA OTOMATİK COMMIT / PUSH YAPILMAZ:** Antigravity veya geliştirici, kullanıcı açıkça "commit yapabilirsin" veya "push yapabilirsin" demeden GitHub'a hiçbir push işlemi yapamaz.
2. **Yerel Çalışma:** Değişiklikler önce yerel ortamda yapılır, TypeScript kontrolleri (`npx tsc --noEmit`) sağlanır.
3. **CI/CD:** Yayınlama istendiğinde `pocoV2up` branch'ine push yapılır. GitHub Actions otomatik `POCO-v2.0.apk` dosyasını derleyip Releases sekmesine yükler.

---

## 📌 Sürüm Durumları

- **v1.0.0 (Tamamlandı):** Temel Supabase entegrasyonu, barkod tarama, kasa hesabı.
- **v2.0.0 (Tamamlandı & Yayınlandı):**
  - Expo SDK 54 upgrade.
  - Durum çubuğu (Status Bar) taşma düzeltmeleri ve 44x44px dokunmatik alanlar.
  - Doğrudan kameradan ürün fotoğrafı çekme.
  - Ana ekranda hızlı barkod ikonu.
  - Ürün sorgulama ekranında "Tamam / Listeye Dön" butonu ve backdrop kapanması.
- **v3.0.0 (Planlandı - Not Alındı):**
  - Rol bazlı yetkilendirme (Admin, Müdür, Kasiyer).
  - Süper Admin kontrol paneli.
  - Ürün silme ve güncelleme (Soft delete).
  - Maliyet gizleme (Kasiyer rolü için).
- **v4.0.0 (Planlandı - Not Alındı):**
  - Otomatik stok takibi.
  - Satış geçmişi, net kâr analitiği ve günlük kasa raporları.
