import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigate: (screen: 'query' | 'add' | 'cashier') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { store, logoutStore, products } = useStore();
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);

  const handleLogout = () => {
    Alert.alert(
      'Mağazadan Çıkış',
      'Mağaza oturumunuz kapatılsın mı?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logoutStore },
      ]
    );
  };

  const handleQuickScan = (scannedCode: string) => {
    setScannerVisible(false);
    const matched = products.find((p) => p.barcode === scannedCode);
    if (matched) {
      Alert.alert(
        'Ürün Bulundu ✅',
        `Ürün: ${matched.name}\nBarkod: ${matched.barcode}\nSatış Fiyatı: ${matched.sell_price.toFixed(2)} TL\nGeliş Fiyatı: ${matched.buy_price.toFixed(2)} TL`,
        [
          { text: 'Kapat', style: 'cancel' },
          { text: 'Sorgula Ekranına Git', onPress: () => onNavigate('query') },
        ]
      );
    } else {
      Alert.alert(
        'Ürün Bulunamadı ⚠️',
        `Barkod: ${scannedCode}\nBu barkoda ait kayıtlı ürün bulunamadı.`,
        [
          { text: 'Kapat', style: 'cancel' },
          { text: 'Ürün Olarak Ekle', onPress: () => onNavigate('add') },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Üst Mağaza Bilgisi & Hızlı Kamera & Çıkış */}
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" color="#10B981" size={22} />
          </View>
          <View style={styles.storeTextContainer}>
            <Text style={styles.storeName} numberOfLines={1}>{store?.name || 'Mağazam'}</Text>
            <Text style={styles.storeCode}>Kod: {store?.store_code}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* HIZLI KAMERA BUTONU */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" color="#059669" size={22} />
          </TouchableOpacity>

          {/* ÇIKIŞ BUTONU */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" color="#EF4444" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ana Butonlar Alanı */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Hoş Geldiniz 👋</Text>
        <Text style={styles.subtitleText}>
          Toplam kayıtlı ürün: <Text style={styles.productCount}>{products.length}</Text>
        </Text>

        <View style={styles.buttonGrid}>
          {/* 1. SORGULA BUTONU */}
          <TouchableOpacity
            style={[styles.mainButton, styles.queryButton]}
            onPress={() => onNavigate('query')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, styles.queryIconBox]}>
              <Ionicons name="search" color="#2563EB" size={32} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Sorgula</Text>
              <Text style={styles.buttonDesc}>Ürün arayın veya detay inceleyin</Text>
            </View>
            <Ionicons name="chevron-forward" color="#94A3B8" size={22} />
          </TouchableOpacity>

          {/* 2. EKLE BUTONU */}
          <TouchableOpacity
            style={[styles.mainButton, styles.addButton]}
            onPress={() => onNavigate('add')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, styles.addIconBox]}>
              <Ionicons name="add-circle" color="#059669" size={32} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Ekle</Text>
              <Text style={styles.buttonDesc}>Yeni ürün ve barkod kaydedin</Text>
            </View>
            <Ionicons name="chevron-forward" color="#94A3B8" size={22} />
          </TouchableOpacity>

          {/* 3. HESAPLA BUTONU */}
          <TouchableOpacity
            style={[styles.mainButton, styles.cashierButton]}
            onPress={() => onNavigate('cashier')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, styles.cashierIconBox]}>
              <Ionicons name="calculator" color="#D97706" size={32} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Hesapla</Text>
              <Text style={styles.buttonDesc}>Hızlı kasa & satış ödemesi</Text>
            </View>
            <Ionicons name="chevron-forward" color="#94A3B8" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hızlı Barkod Okuma Modalı */}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onBarcodeScanned={handleQuickScan}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeTextContainer: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  storeCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 28,
  },
  productCount: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  buttonGrid: {
    gap: 18,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: 16,
  },
  queryButton: {
    borderColor: '#BFDBFE',
  },
  addButton: {
    borderColor: '#A7F3D0',
  },
  cashierButton: {
    borderColor: '#FDE68A',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queryIconBox: {
    backgroundColor: '#EFF6FF',
  },
  addIconBox: {
    backgroundColor: '#ECFDF5',
  },
  cashierIconBox: {
    backgroundColor: '#FFFBEB',
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  buttonDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
});
