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
} from 'react-native';
import { useStore } from '../context/StoreContext';
import { Ionicons } from '@expo/vector-icons';

export const StoreLoginScreen: React.FC = () => {
  const { loginStore, createStore, isLoading } = useStore();
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [storeCode, setStoreCode] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');

  const handleSubmit = async () => {
    if (!storeCode.trim() || !pinCode.trim()) {
      Alert.alert('Hata', 'Lütfen Mağaza Kodu ve PIN alanlarını doldurun.');
      return;
    }

    if (isCreating) {
      if (!storeName.trim()) {
        Alert.alert('Hata', 'Lütfen Mağaza Adını girin.');
        return;
      }
      const res = await createStore(storeCode, pinCode, storeName);
      if (!res.success) {
        Alert.alert('Oluşturma Hatası', res.error || 'Mağaza oluşturulamadı.');
      }
    } else {
      const res = await loginStore(storeCode, pinCode);
      if (!res.success) {
        Alert.alert('Giriş Hatası', res.error || 'Mağazaya giriş yapılamadı.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="storefront" color="#10B981" size={48} />
          </View>
          <Text style={styles.appTitle}>POCO</Text>
          <Text style={styles.appSubtitle}>Mobil Barkod & Kasa Sistemi</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, !isCreating && styles.activeTab]}
              onPress={() => setIsCreating(false)}
            >
              <Text style={[styles.tabText, !isCreating && styles.activeTabText]}>
                Giriş Yap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, isCreating && styles.activeTab]}
              onPress={() => setIsCreating(true)}
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
            <Text style={styles.label}>Mağaza Kodu (Harf & Rakam)</Text>
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
            <Text style={styles.label}>PIN Kodu (Güvenlik)</Text>
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

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name={isCreating ? "add-circle-outline" : "log-in-outline"} color="#FFFFFF" size={20} />
                <Text style={styles.submitButtonText}>
                  {isCreating ? 'Mağazayı Oluştur & Bağlan' : 'Mağazaya Giriş Yap'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Aynı mağaza kodunu ve PIN'i giren tüm cihazlar anında aynı ürün listesine ve kasaya bağlanır.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#10B981',
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
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
