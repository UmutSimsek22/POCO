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
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
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
  const { products, store } = useStore();
  const { cartItems, addToCart, removeFromCart, clearCart, totalAmount } = useCart();

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  // Ödeme (Tamamla) Modalı
  const [completeModalVisible, setCompleteModalVisible] = useState<boolean>(false);
  const [givenAmountStr, setGivenAmountStr] = useState<string>('');
  const [isSavingSale, setIsSavingSale] = useState<boolean>(false);

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
      Alert.alert(
        'Eksik Tutar',
        'Müşterinin verdiği para toplam tutardan az olamaz.'
      );
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
        product_id: item.product.id,
        product_name: item.product.name,
        barcode: item.product.barcode,
        sell_price: item.product.sell_price,
        buy_price: item.product.buy_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsPayload);

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
      {/* Sol Üst Geri Tuşu & Başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hesapla & Kasa</Text>
        {cartItems.length > 0 ? (
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Temizle</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Beyaz Sayfa - Hesaplanan Ürünlerin Dikey Listesi */}
      <View style={styles.whiteCanvas}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCanvas}>
            <Ionicons name="calculator-outline" color="#CBD5E1" size={72} />
            <Text style={styles.emptyCanvasTitle}>Kasa Boş</Text>
            <Text style={styles.emptyCanvasText}>
              Aşağıdaki yeşil "EKLE" butonuna basarak ürünlerin barkodunu okutun.
            </Text>
          </View>
        ) : (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cartListContent}
            renderItem={({ item }: { item: CartItem }) => (
              <View style={styles.cartItemRow}>
                {item.product.image_url ? (
                  <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemNoImage}>
                    <Ionicons name="cube-outline" color="#94A3B8" size={22} />
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
                >
                  <Ionicons name="trash-outline" color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Alt Toplam Fiyat Barı & EKLE / TAMAMLA Butonları */}
      <View style={styles.bottomSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Toplam Tutar:</Text>
          <Text style={styles.totalValue}>{totalAmount.toFixed(2)} TL</Text>
        </View>

        <View style={styles.actionButtonGroup}>
          {/* YEŞİL EKLE BUTONU */}
          <TouchableOpacity
            style={styles.greenAddButton}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" color="#FFFFFF" size={24} />
            <Text style={styles.greenAddButtonText}>EKLE</Text>
          </TouchableOpacity>

          {/* TAMAMLA BUTONU */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              cartItems.length === 0 && styles.disabledCompleteButton,
            ]}
            onPress={() => setCompleteModalVisible(true)}
            disabled={cartItems.length === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" color="#FFFFFF" size={22} />
            <Text style={styles.completeButtonText}>TAMAMLA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1. ÜRÜN BULUNAMADI MODALI */}
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
                <TouchableOpacity
                  style={styles.alertContinueBtn}
                  onPress={() => setUnknownBarcode(null)}
                >
                  <Text style={styles.alertContinueBtnText}>Devam Et</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertAddBtn}
                  onPress={handleUnknownAddProduct}
                >
                  <Ionicons name="add" color="#FFFFFF" size={18} />
                  <Text style={styles.alertAddBtnText}>Ürün Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. TAMAMLA / ÖDEME & PARA ÜSTÜ MODALI */}
      <Modal
        visible={completeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCompleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>Satışı Tamamla</Text>
              <TouchableOpacity onPress={() => setCompleteModalVisible(false)}>
                <Ionicons name="close" color="#64748B" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentTotalBox}>
              <Text style={styles.paymentTotalLabel}>Ödenmesi Gereken Tutar</Text>
              <Text style={styles.paymentTotalAmount}>{totalAmount.toFixed(2)} TL</Text>
            </View>

            {/* Müşterinin Verdiği Para */}
            <View style={styles.givenInputGroup}>
              <Text style={styles.givenLabel}>Müşterinin Verdiği Para (TL)</Text>
              <View style={styles.givenInputWrapper}>
                <Ionicons name="cash-outline" color="#10B981" size={22} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.givenInput}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={givenAmountStr}
                  onChangeText={setGivenAmountStr}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Hızlı TL Butonları */}
            <View style={styles.quickCashRow}>
              <TouchableOpacity
                style={styles.quickCashBtn}
                onPress={() => setGivenAmountStr(totalAmount.toString())}
              >
                <Text style={styles.quickCashText}>Tam Para</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCashBtn}
                onPress={() => setGivenAmountStr('50')}
              >
                <Text style={styles.quickCashText}>50 TL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCashBtn}
                onPress={() => setGivenAmountStr('100')}
              >
                <Text style={styles.quickCashText}>100 TL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickCashBtn}
                onPress={() => setGivenAmountStr('200')}
              >
                <Text style={styles.quickCashText}>200 TL</Text>
              </TouchableOpacity>
            </View>

            {/* Para Üstü Hesabı */}
            <View style={styles.changeCard}>
              <Text style={styles.changeLabel}>Verilecek Para Üstü:</Text>
              <Text style={styles.changeAmountText}>{changeAmount.toFixed(2)} TL</Text>
            </View>

            <TouchableOpacity
              style={styles.finishSaleBtn}
              onPress={handleFinishSale}
              disabled={isSavingSale}
            >
              {isSavingSale ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" color="#FFFFFF" size={20} />
                  <Text style={styles.finishSaleBtnText}>Hesabı Tamamla & Temizle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Barkod Okuma Modalı */}
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
    backgroundColor: '#FFFFFF',
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
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  whiteCanvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#64748B',
    marginTop: 16,
  },
  emptyCanvasText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  cartListContent: {
    padding: 16,
    gap: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  itemNoImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  itemBarcode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  deleteRowBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  greenAddButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  greenAddButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledCompleteButton: {
    backgroundColor: '#CBD5E1',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    fontWeight: '800',
    color: '#0F172A',
  },
  alertDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  alertBtnGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertContinueBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  alertContinueBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  alertAddBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  alertAddBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentTotalBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  paymentTotalLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  paymentTotalAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
  },
  givenInputGroup: {
    marginBottom: 16,
  },
  givenLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  givenInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
  },
  givenInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  quickCashRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickCashBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickCashText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  changeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  changeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
  },
  changeAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
  },
  finishSaleBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finishSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
