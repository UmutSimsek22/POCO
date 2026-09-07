import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface QueryScreenProps {
  onBack: () => void;
}

export const QueryScreen: React.FC<QueryScreenProps> = ({ onBack }) => {
  const { products, role, updateProduct, deleteProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);

  // Düzenleme (Edit) Modalı State'leri
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editBarcode, setEditBarcode] = useState<string>('');
  const [editBuyPrice, setEditBuyPrice] = useState<string>('');
  const [editSellPrice, setEditSellPrice] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editBrand, setEditBrand] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Görsel yükleme hatası olan URL'leri takip et
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Mevcut kategorileri topla
  const categories = useMemo(() => {
    const cats = new Set<string>(['Tümü']);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return Array.from(cats);
  }, [products]);

  // Arama ve Kategori Filtreleme
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'Tümü') {
      result = result.filter((p) => (p.category || 'Genel') === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.barcode.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, searchQuery, selectedCategory]);

  const handleBarcodeScanned = (scannedCode: string) => {
    setScannerVisible(false);
    setSearchQuery(scannedCode);
    const exactMatch = products.find((p) => p.barcode === scannedCode);
    if (exactMatch) {
      setSelectedProduct(exactMatch);
    }
  };

  // Düzenleme Başlat
  const handleOpenEdit = () => {
    if (!selectedProduct) return;
    setEditName(selectedProduct.name);
    setEditBarcode(selectedProduct.barcode);
    setEditBuyPrice(selectedProduct.buy_price.toString());
    setEditSellPrice(selectedProduct.sell_price.toString());
    setEditCategory(selectedProduct.category || 'Genel');
    setEditBrand(selectedProduct.brand || '');
    setEditModalVisible(true);
  };

  // Düzenlemeyi Kaydet
  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    if (!editName.trim() || !editSellPrice.trim()) {
      Alert.alert('Eksik Bilgi', 'Ürün adı ve satış fiyatı zorunludur.');
      return;
    }

    setIsUpdating(true);
    const res = await updateProduct(selectedProduct.id, {
      name: editName.trim(),
      barcode: editBarcode.trim() || selectedProduct.barcode,
      buy_price: Number(editBuyPrice) || 0,
      sell_price: Number(editSellPrice),
      category: editCategory.trim() || 'Genel',
      brand: editBrand.trim() || null,
    });
    setIsUpdating(false);

    if (res.success && res.product) {
      setSelectedProduct(res.product);
      setEditModalVisible(false);
      Alert.alert('Başarılı! 🎉', 'Ürün bilgileri güncellendi.');
    } else {
      Alert.alert('Hata', res.error || 'Ürün güncellenirken hata oluştu.');
    }
  };

  // Ürünü Sil (Yalnızca Admin)
  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    Alert.alert(
      'Ürünü Sil ⚠️',
      `"${selectedProduct.name}" ürününü mağazanızdan silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteProduct(selectedProduct.id);
            if (res.success) {
              setSelectedProduct(null);
              Alert.alert('Silindi', 'Ürün listeden kaldırıldı.');
            } else {
              Alert.alert('Hata', res.error || 'Ürün silinemedi.');
            }
          },
        },
      ]
    );
  };

  // Kâr Marjı Hesabı
  const buyPrice = selectedProduct?.buy_price || 0;
  const sellPrice = selectedProduct?.sell_price || 0;
  const profit = sellPrice - buyPrice;
  const profitMargin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Sorgula</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Arama Alanı */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" color="#94A3B8" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim, marka veya barkod ara..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" color="#94A3B8" size={18} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" color="#059669" size={24} />
        </TouchableOpacity>
      </View>

      {/* Kategori Filtre Çipleri */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ürün Listesi */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" color="#CBD5E1" size={64} />
          <Text style={styles.emptyTitle}>Ürün Bulunamadı</Text>
          <Text style={styles.emptySubtitle}>Arama kriterlerinize uygun ürün bulunmuyor.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: Product }) => {
            const hasValidImage = item.image_url && !failedImages[item.image_url];
            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => setSelectedProduct(item)}
                activeOpacity={0.7}
              >
                {hasValidImage ? (
                  <Image
                    source={{ uri: item.image_url! }}
                    style={styles.productThumb}
                    onError={() => setFailedImages((prev) => ({ ...prev, [item.image_url!]: true }))}
                  />
                ) : (
                  <View style={styles.noThumb}>
                    <Ionicons name="cube-outline" color="#94A3B8" size={24} />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.barcodeBadge}>
                      <Ionicons name="pricetag-outline" color="#64748B" size={12} />
                      <Text style={styles.barcodeText}>{item.barcode}</Text>
                    </View>
                    {item.brand && (
                      <View style={styles.brandBadge}>
                        <Text style={styles.brandBadgeText}>{item.brand}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.sellPriceText}>{item.sell_price.toFixed(2)} TL</Text>
                  <Ionicons name="chevron-forward" color="#CBD5E1" size={18} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Ürün Detay Modalı */}
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

                  {/* Görsel veya Kutu İkonu */}
                  {selectedProduct.image_url && !failedImages[selectedProduct.image_url] ? (
                    <Image
                      source={{ uri: selectedProduct.image_url }}
                      style={styles.detailImage}
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [selectedProduct.image_url!]: true }))
                      }
                    />
                  ) : (
                    <View style={styles.detailNoImage}>
                      <Ionicons name="cube-outline" color="#94A3B8" size={48} />
                    </View>
                  )}

                  <Text style={styles.detailName}>{selectedProduct.name}</Text>

                  <View style={styles.detailBadges}>
                    <View style={styles.detailBarcodeBadge}>
                      <Ionicons name="pricetag" color="#10B981" size={14} />
                      <Text style={styles.detailBarcodeText}>{selectedProduct.barcode}</Text>
                    </View>
                    {selectedProduct.brand && (
                      <View style={styles.detailBrandBadge}>
                        <Text style={styles.detailBrandText}>{selectedProduct.brand}</Text>
                      </View>
                    )}
                    <View style={styles.detailCatBadge}>
                      <Text style={styles.detailCatText}>{selectedProduct.category || 'Genel'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />

                  {/* Fiyat Kutuları (Kasiyerde Geliş Fiyatı ve Kâr GİZLENİR) */}
                  {role === 'staff' ? (
                    <View style={styles.staffPriceBox}>
                      <Text style={styles.staffPriceLabel}>Satış Fiyatı</Text>
                      <Text style={styles.staffPriceValue}>{sellPrice.toFixed(2)} TL</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.pricesRow}>
                        <View style={styles.priceBox}>
                          <Text style={styles.priceBoxLabel}>Geliş Fiyatı</Text>
                          <Text style={styles.priceBoxValue}>{buyPrice.toFixed(2)} TL</Text>
                        </View>
                        <View style={[styles.priceBox, styles.sellBox]}>
                          <Text style={[styles.priceBoxLabel, { color: '#047857' }]}>Satış Fiyatı</Text>
                          <Text style={[styles.priceBoxValue, { color: '#059669' }]}>
                            {sellPrice.toFixed(2)} TL
                          </Text>
                        </View>
                      </View>

                      {/* Kâr Marjı */}
                      <View
                        style={[
                          styles.profitCard,
                          profit >= 0 ? styles.profitCardPositive : styles.profitCardNegative,
                        ]}
                      >
                        <Ionicons
                          name={profit >= 0 ? 'trending-up' : 'trending-down'}
                          color={profit >= 0 ? '#059669' : '#DC2626'}
                          size={20}
                        />
                        <Text
                          style={[
                            styles.profitText,
                            profit >= 0 ? styles.profitTextPositive : styles.profitTextNegative,
                          ]}
                        >
                          Birim Kâr: {profit.toFixed(2)} TL (%{profitMargin.toFixed(0)})
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Yönetici & Müdür Eylemleri: Düzenle / Sil */}
                  {role !== 'staff' && (
                    <View style={styles.adminActionRow}>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={handleOpenEdit}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="create-outline" size={18} color="#2563EB" />
                        <Text style={styles.editActionText}>Düzenle</Text>
                      </TouchableOpacity>

                      {role === 'admin' && (
                        <TouchableOpacity
                          style={styles.deleteActionBtn}
                          onPress={handleDeleteProduct}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          <Text style={styles.deleteActionText}>Sil</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Tamam / Listeye Dön Butonu */}
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => setSelectedProduct(null)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" color="#FFFFFF" size={20} />
                    <Text style={styles.dismissBtnText}>Tamam / Listeye Dön</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Ürün Düzenleme (Edit) Modalı */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={[styles.detailCard, { maxHeight: '90%' }]}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Ürünü Düzenle</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                <Text style={styles.editLabel}>Ürün Adı *</Text>
                <TextInput style={styles.editInput} value={editName} onChangeText={setEditName} />

                <Text style={styles.editLabel}>Barkod</Text>
                <TextInput style={styles.editInput} value={editBarcode} onChangeText={setEditBarcode} />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.editLabel}>Geliş Fiyatı (TL)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editBuyPrice}
                      onChangeText={setEditBuyPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.editLabel}>Satış Fiyatı (TL) *</Text>
                    <TextInput
                      style={[styles.editInput, { color: '#059669', fontWeight: 'bold' }]}
                      value={editSellPrice}
                      onChangeText={setEditSellPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <Text style={styles.editLabel}>Marka</Text>
                <TextInput style={styles.editInput} value={editBrand} onChangeText={setEditBrand} placeholder="Marka adı..." />

                <Text style={styles.editLabel}>Kategori</Text>
                <TextInput style={styles.editInput} value={editCategory} onChangeText={setEditCategory} />

                <TouchableOpacity
                  style={[styles.saveEditBtn, isUpdating && { opacity: 0.7 }]}
                  onPress={handleSaveEdit}
                  disabled={isUpdating}
                  activeOpacity={0.85}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveEditBtnText}>Güncellemeyi Kaydet</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  clearSearchBtn: {
    padding: 4,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  categoryScrollWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  categoryChips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    resizeMode: 'cover',
  },
  noThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  barcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  brandBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  detailNoImage: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailBarcodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  detailBarcodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailBrandBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  detailBrandText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  detailCatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  detailCatText: {
    fontSize: 11,
    color: '#64748B',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
    marginVertical: 16,
  },
  staffPriceBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  staffPriceLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  staffPriceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  pricesRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sellBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  priceBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  priceBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  profitCardPositive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  profitCardNegative: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  profitText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  profitTextPositive: {
    color: '#047857',
  },
  profitTextNegative: {
    color: '#B91C1C',
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  dismissBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
  },
  saveEditBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
