import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  LayoutChangeEvent,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [enableTorch, setEnableTorch] = useState<boolean>(false);
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);
  const [cameraLayout, setCameraLayout] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setManualBarcode('');
      setShowManualInput(false);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  // Barkod okutulduğunda Bip sesi çal
  const playBeepSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.log('Bip sesi hatası:', e);
    }
  };

  const handleCameraLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCameraLayout({ width, height });
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;

    // ROI Alan Kısıtlaması (Barkod sadece yeşil kılavuz alanındaysa okunur)
    if (cameraLayout && cameraLayout.width > 0 && cameraLayout.height > 0) {
      let barcodeX: number | null = null;
      let barcodeY: number | null = null;

      if (result.bounds && result.bounds.size.width > 0) {
        barcodeX = result.bounds.origin.x + result.bounds.size.width / 2;
        barcodeY = result.bounds.origin.y + result.bounds.size.height / 2;
      } else if (result.cornerPoints && result.cornerPoints.length > 0) {
        barcodeX = result.cornerPoints.reduce((sum, p) => sum + p.x, 0) / result.cornerPoints.length;
        barcodeY = result.cornerPoints.reduce((sum, p) => sum + p.y, 0) / result.cornerPoints.length;
      }

      if (barcodeX !== null && barcodeY !== null) {
        // Eğer koordinatlar 0..1 aralığında normalize edilmişse piksele dönüştür
        if (barcodeX <= 1 && barcodeY <= 1) {
          barcodeX = barcodeX * cameraLayout.width;
          barcodeY = barcodeY * cameraLayout.height;
        }

        const targetW = 280; // Kılavuz kutu ve hafif ergonomik tolerans
        const targetH = 200;
        const targetLeft = (cameraLayout.width - targetW) / 2;
        const targetTop = (cameraLayout.height - targetH) / 2;
        const targetRight = targetLeft + targetW;
        const targetBottom = targetTop + targetH;

        // Eğer tespit edilen barkod yeşil hedef kutunun dışındaysa okumayı reddet
        if (
          barcodeX < targetLeft ||
          barcodeX > targetRight ||
          barcodeY < targetTop ||
          barcodeY > targetBottom
        ) {
          return;
        }
      }
    }

    setScanned(true);
    playBeepSound();
    onBarcodeScanned(result.data);
  };

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir barkod numarası girin.');
      return;
    }
    playBeepSound();
    onBarcodeScanned(manualBarcode.trim());
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Üst Başlık & Kontroller */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <Ionicons name="close" color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barkod Tarayıcı</Text>
          <TouchableOpacity
            style={[styles.iconButton, enableTorch && styles.iconButtonActive]}
            onPress={() => setEnableTorch(!enableTorch)}
          >
            <Ionicons name={enableTorch ? 'flash' : 'flash-outline'} color={enableTorch ? '#10B981' : '#FFFFFF'} size={24} />
          </TouchableOpacity>
        </View>

        {/* Kamera veya Manuel Giriş */}
        {showManualInput ? (
          <View style={styles.manualContainer}>
            <Text style={styles.manualTitle}>Barkodu Manuel Girin</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Barkod No..."
              placeholderTextColor="#9CA3AF"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
              <Ionicons name="checkmark" color="#FFFFFF" size={20} />
              <Text style={styles.submitButtonText}>Barkodu Kullan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setShowManualInput(false)}
            >
              <Ionicons name="camera" color="#10B981" size={20} />
              <Text style={styles.switchButtonText}>Kameraya Dön</Text>
            </TouchableOpacity>
          </View>
        ) : permission?.granted ? (
          <View style={styles.cameraWrapper} onLayout={handleCameraLayout}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              enableTorch={enableTorch}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code39',
                  'code128',
                  'qr',
                ],
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.scanTarget}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.scanHint}>Barkodu yeşil kutunun içine hizalayın</Text>
              </View>
            </CameraView>

            {/* Alt Manuel Giriş Butonu */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.manualSwitchBtn}
                onPress={() => setShowManualInput(true)}
              >
                <Ionicons name="keypad" color="#FFFFFF" size={20} />
                <Text style={styles.manualSwitchBtnText}>Manuel Barkod Gir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" color="#9CA3AF" size={64} />
            <Text style={styles.permissionText}>
              Barkod okutabilmek için kamera izni gerekiyor.
            </Text>
            <TouchableOpacity style={styles.submitButton} onPress={requestPermission}>
              <Text style={styles.submitButtonText}>Kamera İzni Ver</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  iconButtonActive: {
    backgroundColor: '#064E3B',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 260,
    height: 180,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#10B981',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualSwitchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  manualContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
});
