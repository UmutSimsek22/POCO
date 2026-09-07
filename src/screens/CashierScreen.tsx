import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { CartItem, Product } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface CashierScreenProps {
  onBack: () => void;
  onNavigateToAddProductWithBarcode: (barcode: string) => void;
}

export const CashierScreen: React.FC<CashierScreenProps> = ({
  onBack,
  onNavigateToAddProductWithBarcode,
}) => {
  const { products, store, role } = useStore();
  const { cartItems, addToCart, removeFromCart, clearCart, totalAmount } = useCart();

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  // Ödeme (Tamamla) Modalı
  const [completeModalVisible, setCompleteModalVisible] = useState<boolean>(false);
  const [givenAmountStr, setGivenAmountStr] = useState<string>('');
  const [isSavingSale, setIsSavingSale] = useState<boolean>(false);

  // Manuel Tutar / Hızlı Artı Ürün Modalı
  const [manualModalVisible, setManualModalVisible] = useState<boolean>(false);
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualTitle, setManualTitle] = useState<string>('');

  // Görsel yükleme hatası olan ürünler
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Barkod tarandığında tetiklenen fonksiyon
  const handleBarcodeScanned = (scannedCode: string) => {
    setScannerVisible(false);
    const foundProduct = products.find((p) => p.barcode === scannedCode);

    if (foundProduct) {
      addToCart(foundProduct);
    } else {
      setUnknownBarcode(scannedCode);
    }
  };

  const handleUnknownAddProduct = () => {
    const code = unknownBarcode;
    setUnknownBarcode(null);
    if (code) {
      onNavigateToAddProductWithBarcode(code);
    }
  };

  // Bilinmeyen barkoda veya manuel butona hızlı tutar ekle
  const handleAddManualProduct = (forcedBarcode?: string) => {
    const amount = Number(manualAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen 0 dan büyük bir tutar giriniz.');
      return;
    }

    const code = forcedBarcode || `MANUAL_${Date.now().toString().slice(-6)}`;
    const title = manualTitle.trim() || (forcedBarcode ? `Barkodlu (${forcedBarcode})` : 'Hızlı / Manuel Kalem');

    const manualProduct: Product = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      store_id: store?.id || '',
      barcode: code,
      name: title,
      sell_price: amount,
      buy_price: 0,
      category: 'Manuel',
    };

    addToCart(manualProduct);
    setManualAmount('');
    setManualTitle('');
    setManualModalVisible(false);
    setUnknownBarcode(null);
  };

  // Müşterinin verdiği paraya göre para üstü hesabı
  const givenAmount = Number(givenAmountStr) || 0;
  const changeAmount = givenAmount > totalAmount ? givenAmount - totalAmount : 0;

  const handleFinishSale = async () => {
    if (!store) return;
    if (cartItems.length === 0) {
      Alert.alert('Uyarı', 'Sepette ürün bulunmuyor.');
      return;
    }
    if (givenAmount < totalAmount) {
      Alert.alert('Eksik Tutar', 'Müşterinin verdiği para toplam tutardan az olamaz.');
      return;
    }

    try {
      setIsSavingSale(true);

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            store_id: store.id,
            total_amount: totalAmount,
            given_amount: givenAmount,
            change_amount: changeAmount,
          },
        ])
        .select()
        .single();

      if (saleError || !saleData) {
        throw new Error(saleError?.message || 'Satış kaydedilemedi.');
      }

      const saleItemsPayload = cartItems.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id.startsWith('manual_') ? null : item.product.id,
        product_name: item.product.name,
        barcode: item.product.barcode,
        sell_price: item.product.sell_price,
        buy_price: item.product.buy_price || 0,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsPayload);

      if (itemsError) {
        console.error('Satış kalemleri ekleme hatası:', itemsError);
      }

      setIsSavingSale(false);
      setCompleteModalVisible(false);
      setGivenAmountStr('');

      Alert.alert(
        'Satış Tamamlandı! 🎉',
        `Toplam: ${totalAmount.toFixed(2)} TL\nAlınan: ${givenAmount.toFixed(2)} TL\nPara Üstü: ${changeAmount.toFixed(2)} TL`,
        [{ text: 'Yeni Müşteri', onPress: () => clearCart() }]
      );
    } catch (e: any) {
      setIsSavingSale(false);
      Alert.alert('Hata', e.message || 'Satış işlemi tamamlanırken hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Sol Üst Geri Tuşu & Başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hesapla & Kasa</Text>

        <View style={styles.headerRightActions}>
          {/* HIZLI MANUEL TUTAR BUTONU */}
          <TouchableOpacity
            style={styles.headerManualBtn}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#D97706" />
            <Text style={styles.headerManualBtnText}>+ Tutar</Text>
          </TouchableOpacity>

          {cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCart} style={styles.clearBtn} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Beyaz Sayfa - Hesaplanan Ürünlerin Dikey Listesi */}
      <View style={styles.whiteCanvas}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCanvas}>
            <Ionicons name="calculator-outline" color="#CBD5E1" size={72} />
            <Text style={styles.emptyCanvasTitle}>Kasa Boş</Text>
            <Text style={styles.emptyCanvasText}>
              Aşağıdaki yeşil "TARA" butonuna basarak barkod okutun veya "+ Tutar" ile doğrudan fiyat ekleyin.
            </Text>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cartListContent}
            renderItem={({ item }: { item: CartItem }) => {
              const hasValidImage =
                item.product.image_url && !failedImages[item.product.image_url];
              return (
                <View style={styles.cartItemRow}>
                  {hasValidImage ? (
                    <Image
                      source={{ uri: item.product.image_url! }}
                      style={styles.itemImage}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.product.image_url!]: true }))
                      }
                    />
                  ) : (
                    <View style={styles.itemNoImage}>
                      <Ionicons
                        name={item.product.id.startsWith('manual_') ? 'cash-outline' : 'cube-outline'}
                        color="#94A3B8"
                        size={22}
                      />
                    </View>
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemBarcode}>{item.product.barcode}</Text>
                  </View>

                  <Text style={styles.itemPrice}>{item.product.sell_price.toFixed(2)} TL</Text>

                  <TouchableOpacity
                    style={styles.deleteRowBtn}
                    onPress={() => removeFromCart(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" color="#EF4444" size={18} />
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Alt Toplam Fiyat Barı & TARA / MANUEL / TAMAMLA Butonları */}
      <View style={styles.bottomSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam Tutar:</Text>
          <Text style={styles.totalValue}>{totalAmount.toFixed(2)} TL</Text>
        </View>

        <View style={styles.actionButtonGroup}>
          {/* YEŞİL BARKOD TARA BUTONU */}
          <TouchableOpacity
            style={styles.greenAddButton}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="barcode" color="#FFFFFF" size={22} />
            <Text style={styles.greenAddButtonText}>TARA</Text>
          </TouchableOpacity>

          {/* SARI MANUEL BUTONU */}
          <TouchableOpacity
            style={styles.amberManualButton}
            onPress={() => setManualModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" color="#FFFFFF" size={22} />
            <Text style={styles.amberManualButtonText}>MANUEL</Text>
          </TouchableOpacity>

          {/* MAVİ TAMAMLA BUTONU */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              cartItems.length === 0 && styles.disabledCompleteButton,
            ]}
            onPress={() => setCompleteModalVisible(true)}
            disabled={cartItems.length === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" color="#FFFFFF" size={20} />
            <Text style={styles.completeButtonText}>TAMAMLA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HIZLI MANUEL TUTAR MODALI */}
      <Modal visible={manualModalVisible} transparent animationType="slide" onRequestClose={() => setManualModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.manualModalBox}>
              <View style={styles.manualModalHeader}>
                <Ionicons name="cash-outline" size={24} color="#D97706" />
                <Text style={styles.manualModalTitle}>Manuel Tutar Ekle</Text>
                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.manualModalSubtitle}>
                Sistemde kaydı olmayan ürünler için kasaya hızlıca tutar ekleyebilirsiniz.
              </Text>

              <Text style={styles.manualInputLabel}>Fiyat (TL) *</Text>
              <TextInput
                style={styles.manualPriceInput}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                value={manualAmount}
                onChangeText={setManualAmount}
                keyboardType="decimal-pad"
                autoFocus
              />

              <Text style={styles.manualInputLabel}>Ürün Açıklaması (Opsiyonel)</Text>
              <TextInput
                style={styles.manualDescInput}
                placeholder="Örn: Ekmek, Manav, Poşet vb."
                placeholderTextColor="#94A3B8"
                value={manualTitle}
                onChangeText={setManualTitle}
              />

              <TouchableOpacity
                style={styles.manualAddSubmitBtn}
                onPress={() => handleAddManualProduct()}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" color="#FFFFFF" size={20} />
                <Text style={styles.manualAddSubmitBtnText}>Sepete Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* BİLİNMEYEN BARKOD MODALI */}
      {unknownBarcode && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <View style={styles.warningIconCircle}>
                <Ionicons name="warning-outline" color="#D97706" size={36} />
              </View>
              <Text style={styles.alertTitle}>Ürün Bulunamadı!</Text>
              <Text style={styles.alertDesc}>
                "<Text style={{ fontWeight: 'bold' }}>{unknownBarcode}</Text>" barkodlu ürün mağazanızda kayıtlı değil.
              </Text>

              <View style={styles.alertBtnGroup}>
                {/* 1. Hızlı Fiyat Girip Sepete Ekle */}
                <TouchableOpacity
                  style={styles.alertQuickPriceBtn}
                  onPress={() => {
                    setManualTitle(`Barkodlu (${unknownBarcode})`);
                    setManualModalVisible(true);
                  }}
                >
                  <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.alertQuickPriceBtnText}>Fiyat Gir ve Ekle</Text>
                </TouchableOpacity>

                {/* 2. Ürün Olarak Ekle (Yönetici/Müdür) */}
                {role !== 'staff' && (
                  <TouchableOpacity
                    style={styles.alertAddProductBtn}
                    onPress={handleUnknownAddProduct}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#10B981" />
                    <Text style={styles.alertAddProductBtnText}>Sisteme Ürün Olarak Ekle</Text>
                  </TouchableOpacity>
                )}

                {/* 3. Devam Et / Kapat */}
                <TouchableOpacity
                  style={styles.alertContinueBtn}
                  onPress={() => setUnknownBarcode(null)}
                >
                  <Text style={styles.alertContinueBtnText}>Vazgeç / Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ÖDEME / TAMAMLA MODALI */}
      <Modal visible={completeModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.completeCard}>
              <Text style={styles.completeTitle}>Satışı Tamamla</Text>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Toplam Tutar</Text>
                <Text style={styles.summaryTotal}>{totalAmount.toFixed(2)} TL</Text>
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.inputBoxLabel}>Müşterinin Verdiği Nakit (TL)</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={givenAmountStr}
                  onChangeText={setGivenAmountStr}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              <View style={[styles.changeBox, changeAmount > 0 && styles.changeBoxPositive]}>
                <Text style={styles.changeLabel}>Para Üstü</Text>
                <Text style={styles.changeValue}>{changeAmount.toFixed(2)} TL</Text>
              </View>

              <View style={styles.completeBtnRow}>
                <TouchableOpacity
                  style={styles.cancelSaleBtn}
                  onPress={() => {
                    setCompleteModalVisible(false);
                    setGivenAmountStr('');
                  }}
                  disabled={isSavingSale}
                >
                  <Text style={styles.cancelSaleBtnText}>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmSaleBtn,
                    (givenAmount < totalAmount || isSavingSale) && styles.disabledConfirmBtn,
                  ]}
                  onPress={handleFinishSale}
                  disabled={givenAmount < totalAmount || isSavingSale}
                >
                  {isSavingSale ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmSaleBtnText}>Satışı Onayla</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barkod Tarayıcı Modalı */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerManualBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#B45309',
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 13,
  },
  whiteCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  emptyCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCanvasTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptyCanvasText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  cartListContent: {
    padding: 12,
    gap: 8,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  itemNoImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemBarcode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#059669',
    marginRight: 12,
  },
  deleteRowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  greenAddButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  greenAddButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  amberManualButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  amberManualButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  completeButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  disabledCompleteButton: {
    backgroundColor: '#CBD5E1',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  manualModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  manualModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  manualModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  manualInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  manualPriceInput: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 14,
  },
  manualDescInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 20,
  },
  manualAddSubmitBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  manualAddSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  alertDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  alertBtnGroup: {
    width: '100%',
    gap: 10,
  },
  alertQuickPriceBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alertQuickPriceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  alertAddProductBtn: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  alertAddProductBtnText: {
    color: '#059669',
    fontSize: 15,
    fontWeight: 'bold',
  },
  alertContinueBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertContinueBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  completeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  inputBox: {
    marginBottom: 16,
  },
  inputBoxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  changeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeBoxPositive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  changeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  changeValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  completeBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelSaleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelSaleBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmSaleBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledConfirmBtn: {
    backgroundColor: '#CBD5E1',
  },
  confirmSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
