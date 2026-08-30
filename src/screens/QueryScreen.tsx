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
      {/* Sol Üst Geri Tuşu & Başlık */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Sorgula</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Arama Alanı & Barkod Okut Butonu */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" color="#94A3B8" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün adı veya barkod ile ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" color="#94A3B8" size={18} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerVisible(true)}
        >
          <Ionicons name="qr-code" color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>

      {/* Ürün Listesi */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" color="#CBD5E1" size={64} />
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
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Ürün Detay Modalı */}
      {selectedProduct && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedProduct(null)}
              >
                <Ionicons name="close" color="#64748B" size={20} />
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
                    <Ionicons name="trending-up" color="#047857" size={18} />
                    <Text style={styles.profitText}>
                      Birim Kar: <Text style={styles.profitHighlight}>{profit.toFixed(2)} TL</Text> (%{margin})
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
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
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  scanBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  noThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
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
    alignItems: 'flex-end',
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
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  detailImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
  },
  detailNoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '800',
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
    borderRadius: 16,
    marginTop: 8,
  },
  detailBarcodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  detailDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  detailPricesGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailPriceItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailPriceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  detailBuyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  detailSellPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  profitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  profitHighlight: {
    fontWeight: 'bold',
    color: '#047857',
  },
});
