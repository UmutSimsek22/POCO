# 📱 PoCo - Mobil Barkod & Kasa Uygulaması

PoCo, küçük ve orta ölçekli işletmeler (market, butik, kırtasiye, hırdavat, kafe vb.) için geliştirilmiş; telefon kamerasını akıllı barkod tarayıcıya dönüştüren, çoklu cihaz destekli mobil kasa ve envanter yönetim sistemidir.

---

## ✨ Özellikler

- 🔐 **Mağaza Kodu & PIN Sistemi:** Karmaşık üyelik formları olmadan, tek bir Mağaza Kodu ve PIN ile aynı işletmedeki tüm telefonlar saniyeler içinde ortak veritabanına bağlanır.
- ⚡ **Supabase Realtime Sync:** A telefonunun eklediği ürün veya yaptığı işlem, B telefonunda anında görünür.
- 📶 **Offline-First:** İnternet kopsa dahi veriler cihazda önbelleğe alınır, kasa satışı aksamadan devam eder.
- 📷 **Hızlı Kamera Barkod Tarama:** Karanlık ortamlar için fener/flaş butonu, bipleme geri bildirimi ve manuel barkod girme seçeneği.
- ➕ **Ürün Yönetimi:** Ürün Adı, Barkod, Geliş Fiyatı (Maliyet), Satış Fiyatı ve Fotoğraf yükleme (Supabase Storage).
- 🔍 **Detaylı Ürün Sorgulama:** Barkod okutarak veya arama yaparak ürün kartlarını inceleme, birim kar ve kar marjı (%) hesaplaması.
- 🧮 **Akıllı Kasa & Ödeme:**
  - Sepet listesi ve tek tıkla satır silme.
  - Okutulan ürün bulunamadığında mevcut sepet sıfırlanmadan ürün ekleme ekranına geçiş.
  - Alınan para girişi, hızlı TL butonları ve **Para Üstü** hesaplama.
  - Satış tamamlandığında satış geçmişine kayıt ve sepet sıfırlama.

---

## 🛠️ Kurulum & Yerel Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npx expo start
```

---

## 📲 Android APK İndirme

Uygulamanın hazır Android APK sürümünü telefonunuza indirmek için [GitHub Releases](https://github.com/UmutSimsek22/PoCO/releases) sayfamızı ziyaret edebilirsiniz.
