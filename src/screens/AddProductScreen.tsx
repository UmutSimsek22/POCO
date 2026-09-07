import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../context/StoreContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface AddProductScreenProps {
  onBack: () => void;
  initialBarcode?: string;
}

const PRESET_CATEGORIES = [
  'Genel',
  'Gıda',
  'İçecek',
  'Atıştırmalık',
  'Temizlik',
  'Kırtasiye',
  'Kozmetik',
  'Teknoloji',
];

export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  onBack,
  initialBarcode = '',
}) => {
  const { addProduct, products } = useStore();

  const [name, setName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>(initialBarcode);
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('Genel');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  // Mevcut ürünlerden benzersiz kategorileri topla
  const existingCategories = Array.from(
    new Set([
      ...PRESET_CATEGORIES,
      ...products.map((p) => p.category).filter(Boolean),
    ])
  ) as string[];

  const handlePickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Kamera İzni Gerekli 📷',
            'Ürün fotoğrafı çekebilmek için kamera iznini onaylamanız gerekmektedir.'
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Galeri İzni Gerekli 🖼️',
            'Galeriden fotoğraf seçebilmek için galeri iznini onaylamanız gerekmektedir.'
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (e: any) {
      console.error('Görsel seçme hatası:', e);
      Alert.alert('Fotoğraf Hatası', e?.message || 'Fotoğraf eklenirken bir sorun oluştu.');
    }
  };

  const handleSave = async () => {
    // Sadece Ürün Adı ve Satış Fiyatı zorunlu
    if (!name.trim()) {
      Alert.alert('Eksik Bilgi ⚠️', 'Lütfen ürün adını giriniz.');
      return;
    }
    if (!sellPrice.trim() || isNaN(Number(sellPrice))) {
      Alert.alert('Eksik Bilgi ⚠️', 'Lütfen geçerli bir satış fiyatı giriniz.');
      return;
    }

    const parsedBuyPrice = buyPrice.trim() && !isNaN(Number(buyPrice)) ? Number(buyPrice) : 0;
    const parsedSellPrice = Number(sellPrice);
    const finalCategory = customCategory.trim() || category || 'Genel';

    setIsSubmitting(true);

    const res = await addProduct(
      {
        barcode: barcode.trim(),
        name: name.trim(),
        buy_price: parsedBuyPrice,
        sell_price: parsedSellPrice,
        category: finalCategory,
        brand: brand.trim() || null,
      },
      imageUri
    );

    setIsSubmitting(false);

    if (res.success) {
      Alert.alert('Başarılı! 🎉', `"${name.trim()}" ürünü başarıyla eklendi.`, [
        { text: 'Tamam', onPress: onBack },
      ]);
    } else {
      Alert.alert('Hata ⚠️', res.error || 'Ürün kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Üst Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" color="#0F172A" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Ürün Ekle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Fotoğraf Seçim Alanı */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.imagePreviewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="trash" color="#FFFFFF" size={18} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#94A3B8" />
                <Text style={styles.imagePlaceholderText}>Ürün Fotoğrafı (İsteğe Bağlı)</Text>
              </View>
            )}

            <View style={styles.imageButtonsRow}>
              <TouchableOpacity
                style={styles.imageActionBtn}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" color="#059669" size={20} />
                <Text style={styles.imageActionBtnText}>Fotoğraf Çek</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageActionBtn, styles.galleryBtn]}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="images" color="#2563EB" size={20} />
                <Text style={[styles.imageActionBtnText, { color: '#2563EB' }]}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Alanları */}
          <View style={styles.formCard}>
            {/* Ürün Adı (ZORUNLU) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Ürün Adı *</Text>
                <Text style={styles.requiredBadge}>Zorunlu</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Örn: 12'li Kuru Boya, Çay vb."
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Barkod (OPSİYONEL - Boş bırakılırsa otomatik üretilir) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Barkod Numarası</Text>
                <Text style={styles.optionalBadge}>Boşsa Otomatik Üretilir</Text>
              </View>
              <View style={styles.barcodeInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Barkod okutun veya boş bırakın"
                  placeholderTextColor="#94A3B8"
                  value={barcode}
                  onChangeText={setBarcode}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.scanBarcodeBtn}
                  onPress={() => setScannerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="barcode-outline" color="#FFFFFF" size={22} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Fiyat Alanları (Satış ZORUNLU, Geliş OPSİYONEL) */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Geliş Fiyatı</Text>
                  <Text style={styles.optionalBadge}>Opsiyonel</Text>
                </View>
                <View style={styles.priceInputWrapper}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    value={buyPrice}
                    onChangeText={setBuyPrice}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.currencySuffix}>TL</Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Satış Fiyatı *</Text>
                  <Text style={styles.requiredBadge}>Zorunlu</Text>
                </View>
                <View style={[styles.priceInputWrapper, styles.sellPriceWrapper]}>
                  <TextInput
                    style={[styles.priceInput, { color: '#059669' }]}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    value={sellPrice}
                    onChangeText={setSellPrice}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.currencySuffix, { color: '#059669' }]}>TL</Text>
                </View>
              </View>
            </View>

            {/* Marka (OPSİYONEL) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Marka</Text>
                <Text style={styles.optionalBadge}>Opsiyonel</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Örn: Fatih, Eti, Ülker, Faber-Castell"
                placeholderTextColor="#94A3B8"
                value={brand}
                onChangeText={setBrand}
              />
            </View>

            {/* Kategori Seçimi & Yeni Kategori (OPSİYONEL) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Kategori</Text>
                <Text style={styles.optionalBadge}>Opsiyonel</Text>
              </View>

              {/* Kategori Etiketleri (Hızlı Seçim) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPills}
              >
                {existingCategories.map((cat) => {
                  const isSelected = category === cat && !customCategory.trim();
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, isSelected && styles.catPillActive]}
                      onPress={() => {
                        setCategory(cat);
                        setCustomCategory('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Yeni Özel Kategori Girişi */}
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Veya yeni kategori adı yazın..."
                placeholderTextColor="#94A3B8"
                value={customCategory}
                onChangeText={setCustomCategory}
              />
            </View>

            {/* Kaydet Butonu */}
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" color="#FFFFFF" size={22} />
                  <Text style={styles.saveButtonText}>Ürünü Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barkod Okuma Modalı */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={(scanned) => {
          setScannerVisible(false);
          setBarcode(scanned);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  imageButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  imageActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  galleryBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  imageActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  requiredBadge: {
    fontSize: 11,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  optionalBadge: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  barcodeInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scanBarcodeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  sellPriceWrapper: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  currencySuffix: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
    marginLeft: 4,
  },
  categoryPills: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  catPillText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
