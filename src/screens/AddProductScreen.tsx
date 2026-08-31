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

export const AddProductScreen: React.FC<AddProductScreenProps> = ({
  onBack,
  initialBarcode = '',
}) => {
  const { addProduct } = useStore();

  const [name, setName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>(initialBarcode);
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

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
    if (!name.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen ürün adını giriniz.');
      return;
    }
    if (!barcode.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen barkod numarasını giriniz veya taratınız.');
      return;
    }
    if (!sellPrice.trim() || isNaN(Number(sellPrice))) {
      Alert.alert('Eksik Bilgi', 'Lütfen geçerli bir satış fiyatı giriniz.');
      return;
    }

    const parsedBuyPrice = buyPrice.trim() ? Number(buyPrice) : 0;
    const parsedSellPrice = Number(sellPrice);

    setIsSubmitting(true);

    const res = await addProduct(
      {
        barcode: barcode.trim(),
        name: name.trim(),
        buy_price: parsedBuyPrice,
        sell_price: parsedSellPrice,
      },
      imageUri
    );

    setIsSubmitting(false);

    if (res.success) {
      Alert.alert('Başarılı! 🎉', `"${name.trim()}" ürünü sisteme eklendi.`, [
        { text: 'Tamam', onPress: onBack },
      ]);
    } else {
      Alert.alert('Hata', res.error || 'Ürün kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Sol Üst 44x44 Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" color="#0F172A" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ürün Ekle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Fotoğraf Seçim Alanı */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.changeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="trash-outline" color="#EF4444" size={16} />
                  <Text style={styles.changeImageBtnText}>Kaldır / Değiştir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderIconBadge}>
                  <Ionicons name="camera-outline" color="#10B981" size={36} />
                </View>
                <Text style={styles.imagePlaceholderText}>Ürün Fotoğrafı Ekleyin</Text>
                <View style={styles.imageBtnGroup}>
                  <TouchableOpacity
                    style={[styles.photoBtn, styles.cameraPhotoBtn]}
                    onPress={() => handlePickImage(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" color="#047857" size={20} />
                    <Text style={styles.cameraPhotoBtnText}>Fotoğraf Çek</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoBtn, styles.galleryPhotoBtn]}
                    onPress={() => handlePickImage(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images" color="#1D4ED8" size={20} />
                    <Text style={styles.galleryPhotoBtnText}>Galeriden Seç</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Form Alanları */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ürün Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Çay 1KG, Kırmızı Tişört vb."
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barkod No *</Text>
              <View style={styles.barcodeInputWrapper}>
                <TextInput
                  style={[styles.input, styles.barcodeInput]}
                  placeholder="Barkod Okutun veya Elle Girin..."
                  placeholderTextColor="#9CA3AF"
                  value={barcode}
                  onChangeText={setBarcode}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setScannerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="qr-code" color="#FFFFFF" size={22} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Geliş Fiyatı (TL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Satış Fiyatı (TL) *</Text>
                <TextInput
                  style={[styles.input, styles.sellInput]}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={sellPrice}
                  onChangeText={setSellPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Kaydet Butonu */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Ionicons name="checkmark-circle" color="#FFFFFF" size={22} />
                  <Text style={styles.submitButtonText}>Ürünü Kaydet</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Barkod Okuma Modalı */}
        <BarcodeScannerModal
          visible={scannerVisible}
          onClose={() => setScannerVisible(false)}
          onBarcodeScanned={(scannedCode) => {
            setBarcode(scannedCode);
            setScannerVisible(false);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 0,
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
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    gap: 10,
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  changeImageBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  imagePlaceholderText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  imageBtnGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cameraPhotoBtn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cameraPhotoBtnText: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize: 14,
  },
  galleryPhotoBtn: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  galleryPhotoBtnText: {
    color: '#1E40AF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  barcodeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  scanButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  sellInput: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
