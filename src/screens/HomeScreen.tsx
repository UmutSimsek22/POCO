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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onNavigate: (screen: 'query' | 'add' | 'cashier') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { store, role, logoutStore, products, updateStoreRoleCodes } = useStore();
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);

  // Rol / Personel Kodları Modalı State'leri (Yalnızca Admin)
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [adminCodeInput, setAdminCodeInput] = useState<string>('');
  const [managerCodeInput, setManagerCodeInput] = useState<string>('');
  const [staffCodeInput, setStaffCodeInput] = useState<string>('');
  const [isUpdatingCodes, setIsUpdatingCodes] = useState<boolean>(false);

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

  const handleOpenRoleCodesModal = () => {
    const isYaren = store?.store_code === 'YAREN2005' || store?.name.toLowerCase().includes('yaren');
    setAdminCodeInput(store?.admin_code || (isYaren ? '0059' : 'ADMIN'));
    setManagerCodeInput(store?.manager_code || (isYaren ? '2858' : 'MUDUR'));
    setStaffCodeInput(store?.staff_code || (isYaren ? '2014' : 'KASA'));
    setRoleModalVisible(true);
  };

  const handleSaveRoleCodes = async () => {
    if (!adminCodeInput.trim() || !managerCodeInput.trim() || !staffCodeInput.trim()) {
      Alert.alert('Eksik Bilgi ⚠️', 'Lütfen tüm rol kodlarını doldurunuz.');
      return;
    }

    setIsUpdatingCodes(true);
    const res = await updateStoreRoleCodes(
      adminCodeInput.trim(),
      managerCodeInput.trim(),
      staffCodeInput.trim()
    );
    setIsUpdatingCodes(false);

    if (res.success) {
      Alert.alert(
        'Kodlar Güncellendi! 🎉',
        `Personel giriş kodlarınız başarıyla kaydedildi:\n\n👑 Yönetici: ${adminCodeInput.trim()}\n👔 Müdür: ${managerCodeInput.trim()}\n🛒 Kasiyer: ${staffCodeInput.trim()}`
      );
      setRoleModalVisible(false);
    } else {
      Alert.alert('Hata ⚠️', res.error || 'Kodlar güncellenirken bir hata oluştu.');
    }
  };

  const handleQuickScan = (scannedCode: string) => {
    setScannerVisible(false);
    const matched = products.find((p) => p.barcode === scannedCode);
    if (matched) {
      const priceInfo =
        role === 'staff'
          ? `Satış Fiyatı: ${matched.sell_price.toFixed(2)} TL`
          : `Satış Fiyatı: ${matched.sell_price.toFixed(2)} TL\nGeliş Fiyatı: ${matched.buy_price.toFixed(2)} TL`;

      Alert.alert(
        'Ürün Bulundu ✅',
        `Ürün: ${matched.name}\nBarkod: ${matched.barcode}\n${priceInfo}`,
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
          ...(role !== 'staff'
            ? [{ text: 'Ürün Olarak Ekle', onPress: () => onNavigate('add') }]
            : []),
        ]
      );
    }
  };

  const handleAddProductPress = () => {
    if (role === 'staff') {
      Alert.alert(
        'Yetki Kısıtlaması 🔒',
        'Ürün ekleme ve düzenleme yetkisi yalnızca Yönetici ve Müdür rollerine aittir.'
      );
      return;
    }
    onNavigate('add');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return { text: 'Yönetici', bg: '#FEF3C7', color: '#B45309', icon: 'shield-checkmark' as const };
      case 'manager':
        return { text: 'Müdür', bg: '#E0E7FF', color: '#4338CA', icon: 'briefcase' as const };
      case 'staff':
      default:
        return { text: 'Kasiyer', bg: '#F1F5F9', color: '#475569', icon: 'person' as const };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Üst Mağaza Bilgisi & Eylemler */}
      <View style={styles.header}>
        <View style={styles.storeInfo}>
          <View style={styles.storeBadge}>
            <Ionicons name="storefront" color="#10B981" size={22} />
          </View>
          <View style={styles.storeTextContainer}>
            <Text style={styles.storeName} numberOfLines={1}>{store?.name || 'Mağazam'}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.storeCode}>Kod: {store?.store_code}</Text>
              <View style={[styles.roleTag, { backgroundColor: roleBadge.bg }]}>
                <Ionicons name={roleBadge.icon} size={11} color={roleBadge.color} style={{ marginRight: 3 }} />
                <Text style={[styles.roleTagText, { color: roleBadge.color }]}>{roleBadge.text}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          {/* PERSONEL KODLARI YÖNETİMİ BUTONU (Yalnızca Admin) */}
          {role === 'admin' && (
            <TouchableOpacity
              style={styles.keyBtn}
              onPress={handleOpenRoleCodesModal}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" color="#2563EB" size={20} />
            </TouchableOpacity>
          )}

          {/* HIZLI KAMERA BUTONU */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" color="#059669" size={20} />
          </TouchableOpacity>

          {/* ÇIKIŞ BUTONU */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" color="#EF4444" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ana Butonlar Alanı */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Hoş Geldiniz 👋</Text>
        <Text style={styles.subtitleText}>
          Toplam aktif ürün: <Text style={styles.productCount}>{products.length}</Text>
        </Text>

        <View style={styles.actionsGrid}>
          {/* SORGULA BUTONU */}
          <TouchableOpacity
            style={[styles.actionCard, styles.queryCard]}
            onPress={() => onNavigate('query')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="search" size={32} color="#2563EB" />
            </View>
            <View style={styles.cardTexts}>
              <Text style={[styles.cardTitle, { color: '#1D4ED8' }]}>Sorgula</Text>
              <Text style={styles.cardDesc}>Fiyat, kâr ve barkod ara</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#93C5FD" />
          </TouchableOpacity>

          {/* EKLE BUTONU (Kasiyer rolünde kilit simgesi) */}
          <TouchableOpacity
            style={[styles.actionCard, styles.addCard, role === 'staff' && styles.disabledCard]}
            onPress={handleAddProductPress}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: role === 'staff' ? '#F1F5F9' : '#ECFDF5' }]}>
              <Ionicons
                name={role === 'staff' ? 'lock-closed' : 'add-circle'}
                size={32}
                color={role === 'staff' ? '#94A3B8' : '#059669'}
              />
            </View>
            <View style={styles.cardTexts}>
              <Text style={[styles.cardTitle, { color: role === 'staff' ? '#64748B' : '#047857' }]}>
                {role === 'staff' ? 'Ürün Ekle (Kilitli)' : 'Ürün Ekle'}
              </Text>
              <Text style={styles.cardDesc}>
                {role === 'staff' ? 'Yalnızca Müdür ve Yönetici' : 'Yeni ürün, fotoğraf ve barkod'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={role === 'staff' ? '#CBD5E1' : '#6EE7B7'} />
          </TouchableOpacity>

          {/* HESAPLA (KASA) BUTONU */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cashierCard]}
            onPress={() => onNavigate('cashier')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="calculator" size={32} color="#D97706" />
            </View>
            <View style={styles.cardTexts}>
              <Text style={[styles.cardTitle, { color: '#B45309' }]}>Hesapla (Kasa)</Text>
              <Text style={styles.cardDesc}>Sepet, toplam tutar ve para üstü</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FCD34D" />
          </TouchableOpacity>
        </View>
      </View>

      {/* PERSONEL KODLARI YÖNETİMİ MODALI (Yönetici) */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.roleCodesCard}>
              <View style={styles.roleCodesHeader}>
                <View style={styles.roleHeaderIconCircle}>
                  <Ionicons name="key" size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.roleCodesTitle}>Personel Kodları Yönetimi</Text>
                  <Text style={styles.roleCodesSubtitle}>
                    {store?.name} ({store?.store_code})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.roleCodesInfoText}>
                Çalışanlarınıza yetkilerine göre aşağıdaki kodları tahsis edebilirsiniz. Kodsuz giriş yapılamaz.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {/* 👑 Yönetici Kodu */}
                <View style={styles.roleInputGroup}>
                  <View style={styles.roleLabelRow}>
                    <Text style={[styles.roleInputLabel, { color: '#B45309' }]}>👑 Yönetici (Admin) Kodu</Text>
                    <Text style={styles.roleDescBadge}>Tam Yetki</Text>
                  </View>
                  <TextInput
                    style={[styles.roleInput, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}
                    value={adminCodeInput}
                    onChangeText={setAdminCodeInput}
                    placeholder="Örn: 0059"
                    autoCapitalize="characters"
                  />
                </View>

                {/* 👔 Müdür Kodu */}
                <View style={styles.roleInputGroup}>
                  <View style={styles.roleLabelRow}>
                    <Text style={[styles.roleInputLabel, { color: '#4338CA' }]}>👔 Müdür Kodu</Text>
                    <Text style={styles.roleDescBadge}>Maliyet & Düzenleme</Text>
                  </View>
                  <TextInput
                    style={[styles.roleInput, { borderColor: '#C7D2FE', backgroundColor: '#EEF2FF' }]}
                    value={managerCodeInput}
                    onChangeText={setManagerCodeInput}
                    placeholder="Örn: 2858"
                    autoCapitalize="characters"
                  />
                </View>

                {/* 🛒 Kasiyer Kodu */}
                <View style={styles.roleInputGroup}>
                  <View style={styles.roleLabelRow}>
                    <Text style={[styles.roleInputLabel, { color: '#047857' }]}>🛒 Kasiyer (Personel) Kodu</Text>
                    <Text style={styles.roleDescBadge}>Sadece Satış & Arama</Text>
                  </View>
                  <TextInput
                    style={[styles.roleInput, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}
                    value={staffCodeInput}
                    onChangeText={setStaffCodeInput}
                    placeholder="Örn: 2014"
                    autoCapitalize="characters"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveCodesBtn, isUpdatingCodes && { opacity: 0.7 }]}
                onPress={handleSaveRoleCodes}
                disabled={isUpdatingCodes}
                activeOpacity={0.85}
              >
                {isUpdatingCodes ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" color="#FFFFFF" size={20} />
                    <Text style={styles.saveCodesBtnText}>Kodları Kaydet & Güncelle</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  storeBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeTextContainer: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  storeCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
  },
  productCount: {
    fontWeight: 'bold',
    color: '#10B981',
  },
  actionsGrid: {
    gap: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  queryCard: {
    borderColor: '#DBEAFE',
  },
  addCard: {
    borderColor: '#D1FAE5',
  },
  cashierCard: {
    borderColor: '#FEF3C7',
  },
  disabledCard: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTexts: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  roleCodesCard: {
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
  roleCodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleHeaderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCodesTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  roleCodesSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  roleCodesInfoText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  roleInputGroup: {
    marginBottom: 14,
  },
  roleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleInputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleDescBadge: {
    fontSize: 10,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  saveCodesBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveCodesBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
