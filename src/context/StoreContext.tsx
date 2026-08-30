import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Store, Product } from '../types';

interface StoreContextType {
  store: Store | null;
  products: Product[];
  isLoading: boolean;
  loginStore: (storeCode: string, pinCode: string) => Promise<{ success: boolean; error?: string }>;
  createStore: (storeCode: string, pinCode: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logoutStore: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'store_id'>, imageUri?: string | null) => Promise<{ success: boolean; product?: Product; error?: string }>;
  uploadProductImage: (uri: string) => Promise<string | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORE_STORAGE_KEY = '@poco_active_store';
const PRODUCTS_CACHE_KEY = '@poco_cached_products';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Uygulama açılışında kayıtlı mağazayı ve önbellekteki ürünleri yükle
  useEffect(() => {

    loadSavedStore();
  }, []);

  // Mağaza değiştiğinde ürünleri getir ve Realtime dinleyici başlat
  useEffect(() => {
    if (store) {
      fetchProducts();

      // Supabase Realtime aboneliği (Aynı mağazayı kullanan diğer telefonlar için)
      const channel = supabase
        .channel(`public:products:store_id=eq.${store.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
            filter: `store_id=eq.${store.id}`,
          },
          () => {
            fetchProducts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setProducts([]);
    }
  }, [store?.id]);

  const loadSavedStore = async () => {
    try {
      setIsLoading(true);
      const savedStore = await AsyncStorage.getItem(STORE_STORAGE_KEY);
      if (savedStore) {
        const parsedStore: Store = JSON.parse(savedStore);
        setStore(parsedStore);

        // Çevrimdışı önbellekteki ürünleri yükle
        const cachedProducts = await AsyncStorage.getItem(`${PRODUCTS_CACHE_KEY}_${parsedStore.id}`);
        if (cachedProducts) {
          setProducts(JSON.parse(cachedProducts));
        }
      }
    } catch (e) {
      console.error('Kayıtlı mağaza yükleme hatası:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loginStore = async (storeCode: string, pinCode: string) => {
    try {
      setIsLoading(true);
      const cleanCode = storeCode.trim().toUpperCase();
      const cleanPin = pinCode.trim();

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('store_code', cleanCode)
        .eq('pin_code', cleanPin)
        .single();

      if (error || !data) {
        return { success: false, error: 'Mağaza kodu veya PIN hatalı!' };
      }

      const activeStore: Store = data;
      setStore(activeStore);
      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(activeStore));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Giriş yapılırken bir hata oluştu.' };
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async (storeCode: string, pinCode: string, name: string) => {
    try {
      setIsLoading(true);
      const cleanCode = storeCode.trim().toUpperCase();
      const cleanPin = pinCode.trim();
      const cleanName = name.trim();

      if (!cleanCode || !cleanPin || !cleanName) {
        return { success: false, error: 'Lütfen tüm alanları doldurun!' };
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            store_code: cleanCode,
            pin_code: cleanPin,
            name: cleanName,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Bu mağaza kodu zaten kullanılıyor! Başka bir kod seçin.' };
        }
        return { success: false, error: error.message };
      }

      const newStore: Store = data;
      setStore(newStore);
      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(newStore));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Mağaza oluşturulurken hata oluştu.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutStore = async () => {
    setStore(null);
    setProducts([]);
    await AsyncStorage.removeItem(STORE_STORAGE_KEY);
  };

  const fetchProducts = async () => {
    if (!store) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('name', { ascending: true });

      if (!error && data) {
        const formattedProducts: Product[] = data.map((p) => ({
          ...p,
          buy_price: Number(p.buy_price),
          sell_price: Number(p.sell_price),
        }));

        setProducts(formattedProducts);
        // Çevrimdışı önbelleğe kaydet
        await AsyncStorage.setItem(
          `${PRODUCTS_CACHE_KEY}_${store.id}`,
          JSON.stringify(formattedProducts)
        );
      }
    } catch (e) {
      console.error('Ürünleri getirme hatası:', e);
    }
  };

  const uploadProductImage = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${store?.id || 'default'}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Görsel yükleme hatası:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename);

      return publicUrlData.publicUrl;
    } catch (e) {
      console.error('Görsel işleme hatası:', e);
      return null;
    }
  };

  const addProduct = async (
    productData: Omit<Product, 'id' | 'store_id'>,
    imageUri?: string | null
  ) => {
    if (!store) return { success: false, error: 'Aktif mağaza bulunamadı!' };

    try {
      let finalImageUrl: string | null = productData.image_url || null;

      if (imageUri && !imageUri.startsWith('http')) {
        const uploadedUrl = await uploadProductImage(imageUri);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const payload = {
        store_id: store.id,
        barcode: productData.barcode.trim(),
        name: productData.name.trim(),
        buy_price: productData.buy_price,
        sell_price: productData.sell_price,
        image_url: finalImageUrl,
        category: productData.category || 'Genel',
      };

      const { data, error } = await supabase
        .from('products')
        .upsert([payload], { onConflict: 'store_id,barcode' })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const newProduct: Product = {
        ...data,
        buy_price: Number(data.buy_price),
        sell_price: Number(data.sell_price),
      };

      // Yerel state güncelle
      setProducts((prev) => {
        const existingIdx = prev.findIndex((p) => p.barcode === newProduct.barcode);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newProduct;
          return updated;
        }
        return [...prev, newProduct];
      });

      return { success: true, product: newProduct };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ürün eklenirken hata oluştu.' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        store,
        products,
        isLoading,
        loginStore,
        createStore,
        logoutStore,
        fetchProducts,
        addProduct,
        uploadProductImage,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore, StoreProvider içinde kullanılmalıdır!');
  }
  return context;
};
