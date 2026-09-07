import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { Ionicons } from '@expo/vector-icons';

export const StoreLoginScreen: React.FC = () => {
  const { loginStore, createStore, isLoading } = useStore();
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [storeCode, setStoreCode] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [roleCode, setRoleCode] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');

  const handleSubmit = async () => {
    if (!storeCode.trim() || !pinCode.trim()) {
      Alert.alert('Eksik Bilgi ⚠️', 'Lütfen Mağaza Kodu ve PIN alanlarını doldurun.');
      return;
    }

    if (isCreating) {
      if (!storeName.trim()) {
        Alert.alert('Eksik Bilgi ⚠️', 'Lütfen Mağaza Adını girin.');
        return;
      }
      const res = await createStore(storeCode, pinCode, storeName);
      if (!res.success) {
        Alert.alert('Oluşturma Hatası', res.error || 'Mağaza oluşturulamadı.');
      } else if (res.store) {
        Alert.alert(
          'Mağaza Başarıyla Kuruldu! 🎉',
          `Mağazanız açıldı. Çalışanlarınız için erişim kodlarınız:\n\n👑 Admin: ${res.store.admin_code || 'Yönetici'}\n👔 Müdür: ${res.store.manager_code || 'Müdür'}\n🛒 Kasiyer: ${res.store.staff_code || 'Kasa'}\n\nBu kodları istediğiniz zaman çalışanlarınızla paylaşabilirsiniz.`
        );
      }
    } else {
      const res = await loginStore(storeCode, pinCode, roleCode);
      if (!res.success) {
        Alert.alert('Giriş Hatası ⚠️', res.error || 'Mağazaya giriş yapılamadı.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        <View style={styles.logoSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="storefront" color="#10B981" size={48} />
          </View>
          <Text style={styles.appTitle}>POCO</Text>
          <Text style={styles.appSubtitle}>Mobil Barkod & Kasa Sistemi (v3.0)</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, !isCreating && styles.activeTab]}
              onPress={() => setIsCreating(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isCreating && styles.activeTabText]}>
                Giriş Yap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isCreating && styles.activeTab]}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isCreating && styles.activeTabText]}>
                Yeni Mağaza
              </Text>
            </TouchableOpacity>
          </View>

          {isCreating && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mağaza / İşletme Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Marketim, Butik A.Ş."
                placeholderTextColor="#9CA3AF"
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mağaza Kodu (Büyük Harf & Rakam)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: MAGAZA123"
              placeholderTextColor="#9CA3AF"
              value={storeCode}
              onChangeText={setStoreCode}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mağaza PIN Kodu</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 1234"
              placeholderTextColor="#9CA3AF"
              value={pinCode}
              onChangeText={setPinCode}
              keyboardType="numeric"
              secureTextEntry
            />
          </View>

          {!isCreating && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Personel / Rol Kodu</Text>
                <Text style={styles.optionalBadge}>İsteğe Bağlı</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Boş bırakırsanız Yönetici / Örn: KSA12"
                placeholderTextColor="#9CA3AF"
                value={roleCode}
                onChangeText={setRoleCode}
                autoCapitalize="characters"
              />
              <Text style={styles.helperText}>
                Çalışanlar kendilerine verilen rol kodunu girerek giriş yapabilir.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isCreating ? 'Mağazayı Oluştur' : 'Mağazaya Giriş Yap'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  optionalBadge: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
