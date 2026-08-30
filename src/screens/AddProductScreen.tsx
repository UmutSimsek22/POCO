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
          Alert.alert('İzin Gerekli', 'Fotoğraf çekebilmek için kamera izni vermelisiniz.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          setImageUri(result.assets[0].uri);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (e) {
      console.error('Görsel seçme hatası:', e);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Sol Üst Geri Tuşu ve Başlık */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" color="#0F172A" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ürün Ekle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Fotoğraf Seçim Alanı */}
          <View style={styles.imageSection}>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.changeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Text style={styles.changeImageBtnText}>Kaldır / Değiştir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" color="#94A3B8" size={40} />
                <Text style={styles.imagePlaceholderText}>Ürün Fotoğrafı Ekleyin</Text>
                <View style={styles.imageBtnGroup}>
                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickImage(true)}
                  >
                    <Ionicons name="camera" color="#10B981" size={18} />
                    <Text style={styles.photoBtnText}>Kamera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => handlePickImage(false)}
                  >
                    <Ionicons name="images" color="#2563EB" size={18} />
                    <Text style={styles.photoBtnText}>Galeri</Text>
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
                  style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  placeholder="Barkod Okutun veya Elle Girin..."
                  placeholderTextColor="#9CA3AF"
                  value={barcode}
                  onChangeText={setBarcode}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setScannerVisible(true)}
                >
                  <Ionicons name="qr-code" color="#FFFFFF" size={20} />
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

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" color="#FFFFFF" size={20} />
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
        onBarcodeScanned={(scannedCode) => {
          setBarcode(scannedCode);
          setScannerVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 16,
  },
  imagePlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
  },
  imageBtnGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  previewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  changeImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeImageBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  sellInput: {
    borderColor: '#10B981',
    fontWeight: 'bold',
    color: '#047857',
  },
  barcodeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  scanButton: {
    backgroundColor: '#10B981',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
