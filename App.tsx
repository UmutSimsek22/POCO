import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/context/StoreContext';
import { CartProvider } from './src/context/CartContext';
import { StoreLoginScreen } from './src/screens/StoreLoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AddProductScreen } from './src/screens/AddProductScreen';
import { QueryScreen } from './src/screens/QueryScreen';
import { CashierScreen } from './src/screens/CashierScreen';

type ScreenType = 'home' | 'query' | 'add' | 'cashier';

const MainNavigator: React.FC = () => {
  const { store, isLoading } = useStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [initialBarcode, setInitialBarcode] = useState<string>('');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  // Henüz bir mağazaya giriş yapılmamışsa Giriş ekranını göster
  if (!store) {
    return <StoreLoginScreen />;
  }

  // Bulunamayan ürün barkodundan Ürün Ekle ekranına yönlendirme
  const handleNavigateToAddWithBarcode = (barcode: string) => {
    setInitialBarcode(barcode);
    setCurrentScreen('add');
  };

  const handleBackToHome = () => {
    setInitialBarcode('');
    setCurrentScreen('home');
  };

  switch (currentScreen) {
    case 'query':
      return <QueryScreen onBack={handleBackToHome} />;
    case 'add':
      return (
        <AddProductScreen
          onBack={handleBackToHome}
          initialBarcode={initialBarcode}
        />
      );
    case 'cashier':
      return (
        <CashierScreen
          onBack={handleBackToHome}
          onNavigateToAddProductWithBarcode={handleNavigateToAddWithBarcode}
        />
      );
    case 'home':
    default:
      return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
  }
};

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <MainNavigator />
      </CartProvider>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
