import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigate: (screen: 'query' | 'add' | 'cashier') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { store, logoutStore, products } = useStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Üst Mağaza Bilgisi & Çıkış */}
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <View style={styles.storeBadge}>
            <Ionicons name="storefront-outline" color="#10B981" size={18} />
          </View>
          <View>
            <Text style={styles.storeName}>{store?.name || 'Mağazam'}</Text>
            <Text style={styles.storeCode}>Kod: {store?.store_code}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" color="#EF4444" size={20} />
        </TouchableOpacity>
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
          </TouchableOpacity>

          {/* 2. EKLE BUTONU */}
          <TouchableOpacity
            style={[styles.mainButton, styles.addButton]}
            onPress={() => onNavigate('add')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, styles.addIconBox]}>
              <Ionicons name="add" color="#059669" size={32} />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Ekle</Text>
              <Text style={styles.buttonDesc}>Yeni ürün ve barkod kaydedin</Text>
            </View>
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
          </TouchableOpacity>
        </View>
      </View>
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
  },
  storeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  storeCode: {
    fontSize: 12,
    color: '#64748B',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 28,
  },
  productCount: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  buttonGrid: {
    gap: 16,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
    width: 58,
    height: 58,
    borderRadius: 16,
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
    marginTop: 2,
  },
});
