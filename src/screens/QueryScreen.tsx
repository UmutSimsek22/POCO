import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface QueryScreenProps {
  onBack: () => void;
}

export const QueryScreen: React.FC<QueryScreenProps> = ({ onBack }) => {
  const { products } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Arama filtrelemesi (Ad veya Barkod no)
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  const handleBarcodeScanned = (scannedCode: string) => {
    setScannerVisible(false);
    setSearchQuery(scannedCode);
    const exactMatch = products.find((p) => p.barcode === scannedCode);
    if (exactMatch) {
      setSelectedProduct(exactMatch);
    }
  };

  const calculateProfit = (buy: number, sell: number) => {
    const profit = sell - buy;
    const margin = buy > 0 ? ((profit / buy) * 100).toFixed(1) : '100';
    return { profit, margin };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Sol Üst 44x44 Geri Tuşu & Başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Sorgula</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Arama Alanı & Barkod Okut Butonu */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" color="#94A3B8" size={22} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün adı veya barkod ile ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" color="#94A3B8" size={20} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>

      {/* Ürün Listesi */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <Ionicons name="cube-outline" color="#94A3B8" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Ürün Bulunamadı</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? `"${searchQuery}" ile eşleşen ürün kalemi yok.`
              : 'Henüz mağazanıza eklenmiş ürün bulunmuyor.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: Product }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => setSelectedProduct(item)}
              activeOpacity={0.7}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.productThumb} />
              ) : (
                <View style={styles.noThumb}>
                  <Ionicons name="cube-outline" color="#94A3B8" size={24} />
                </View>
              )}

              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.barcodeBadge}>
                  <Ionicons name="pricetag-outline" color="#64748B" size={12} />
                  <Text style={styles.barcodeText}>{item.barcode}</Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.sellPriceText}>{item.sell_price.toFixed(2)} TL</Text>
                <Ionicons name="chevron-forward" color="#CBD5E1" size={18} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Ürün Detay Modalı (Dışarı dokunarak & Kapat butonuyla çıkış) */}
      {selectedProduct && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedProduct(null)}>
          <TouchableWithoutFeedback onPress={() => setSelectedProduct(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.detailCard}>
                  {/* Sağ Üst Kapat Butonu */}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedProduct(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" color="#475569" size={22} />
                  </TouchableOpacity>

                  {selectedProduct.image_url ? (
                    <Image
                      source={{ uri: selectedProduct.image_url }}
                      style={styles.detailImage}
                    />
                  ) : (
                    <View style={styles.detailNoImage}>
                      <Ionicons name="cube-outline" color="#94A3B8" size={48} />
                    </View>
                  )}

                  <Text style={styles.detailName}>{selectedProduct.name}</Text>

                  <View style={styles.detailBarcodeBadge}>
                    <Ionicons name="pricetag" color="#10B981" size={14} />
                    <Text style={styles.detailBarcodeText}>{selectedProduct.barcode}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailPricesGrid}>
                    <View style={styles.detailPriceItem}>
                      <Text style={styles.detailPriceLabel}>Geliş Fiyatı</Text>
                      <Text style={styles.detailBuyPrice}>
                        {selectedProduct.buy_price.toFixed(2)} TL
                      </Text>
                    </View>

                    <View style={styles.detailPriceItem}>
                      <Text style={styles.detailPriceLabel}>Satış Fiyatı</Text>
                      <Text style={styles.detailSellPrice}>
                        {selectedProduct.sell_price.toFixed(2)} TL
                      </Text>
                    </View>
                  </View>

                  {/* Kar Marjı Hesabı */}
                  {(() => {
                    const { profit, margin } = calculateProfit(
                      selectedProduct.buy_price,
                      selectedProduct.sell_price
                    );
                    return (
                      <View style={styles.profitCard}>
                        <Ionicons name="trending-up" color="#047857" size={20} />
                        <Text style={styles.profitText}>
                          Birim Kar: <Text style={styles.profitHighlight}>{profit.toFixed(2)} TL</Text> (%{margin})
                        </Text>
                      </View>
                    );
                  })()}

                  {/* BÜYÜK VE BELİRGİN KAPAT BUTONU */}
                  <TouchableOpacity
                    style={styles.modalDismissButton}
                    onPress={() => setSelectedProduct(null)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" color="#FFFFFF" size={20} />
                    <Text style={styles.modalDismissButtonText}>Tamam / Listeye Dön</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  clearSearchBtn: {
    padding: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  scanBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#10B981',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  productThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  noThumb: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  barcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  barcodeText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailNoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  detailBarcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  detailBarcodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  detailDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 18,
  },
  detailPricesGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  detailPriceItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailPriceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailBuyPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  detailSellPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#10B981',
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 14,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  profitText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
  },
  profitHighlight: {
    fontWeight: '800',
    color: '#047857',
  },
  modalDismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 18,
  },
  modalDismissButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
