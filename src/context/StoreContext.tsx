import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Store, Product, UserRole } from '../types';

interface StoreContextType {
  store: Store | null;
  role: UserRole;
  products: Product[];
  isLoading: boolean;
  loginStore: (storeCode: string, pinCode: string, roleCode: string) => Promise<{ success: boolean; error?: string }>;
  createStore: (storeCode: string, pinCode: string, name: string) => Promise<{ success: boolean; store?: Store; error?: string }>;
  updateStoreRoleCodes: (adminCode: string, managerCode: string, staffCode: string) => Promise<{ success: boolean; error?: string }>;
  logoutStore: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  addProduct: (productData: Omit<Product, 'id' | 'store_id'>, imageUri?: string | null) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProduct: (productId: string, productData: Partial<Product>, imageUri?: string | null) => Promise<{ success: boolean; product?: Product; error?: string }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  uploadProductImage: (uri: string) => Promise<string | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORE_STORAGE_KEY = '@poco_active_store';
const USER_ROLE_KEY = '@poco_user_role';
const PRODUCTS_CACHE_KEY = '@poco_cached_products';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [role, setRole] = useState<UserRole>('admin');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Uygulama açılışında kayıtlı mağazayı, rolü ve önbellekteki ürünleri yükle
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
      const savedRole = await AsyncStorage.getItem(USER_ROLE_KEY);

      if (savedRole && (savedRole === 'admin' || savedRole === 'manager' || savedRole === 'staff')) {
        setRole(savedRole as UserRole);
      }

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

  const loginStore = async (storeCode: string, pinCode: string, roleCode: string) => {
    try {
      setIsLoading(true);
      const cleanCode = storeCode.trim().toUpperCase();
      const cleanPin = pinCode.trim();
      const cleanRoleCode = roleCode ? roleCode.trim().toUpperCase() : '';

      // KODSUZ GİRİŞ YASAKLANDI (İstismarı engellemek için zorunlu)
      if (!cleanRoleCode) {
        return {
          success: false,
          error: 'Rol / Personel Kodu girmek zorunludur! Kodsuz giriş yapılamaz.',
        };
      }

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

      // Mağaza onay durumu kontrolü
      if (activeStore.is_approved === false) {
        return {
          success: false,
          error: 'Mağazanız henüz onaylanmamıştır! Lütfen sistem yöneticiniz ile iletişime geçiniz.',
        };
      }

      // Yaren Kırtasiye ve genel varsayılan kodlar
      const isYaren = cleanCode === 'YAREN2005' || activeStore.name.toLowerCase().includes('yaren');
      const adminKey = (activeStore.admin_code || (isYaren ? '0059' : 'ADMIN')).toUpperCase();
      const managerKey = (activeStore.manager_code || (isYaren ? '2858' : 'MUDUR')).toUpperCase();
      const staffKey = (activeStore.staff_code || (isYaren ? '2014' : 'KASA')).toUpperCase();

      let determinedRole: UserRole;

      if (cleanRoleCode === adminKey) {
        determinedRole = 'admin';
      } else if (cleanRoleCode === managerKey) {
        determinedRole = 'manager';
      } else if (cleanRoleCode === staffKey) {
        determinedRole = 'staff';
      } else {
        return {
          success: false,
          error: 'Geçersiz Personel / Rol Kodu! Giriş yetkiniz bulunmuyor.',
        };
      }

      setStore(activeStore);
      setRole(determinedRole);

      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(activeStore));
      await AsyncStorage.setItem(USER_ROLE_KEY, determinedRole);

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

      // Rastgele rol erişim kodları oluştur
      const defaultAdminCode = `ADM${Math.floor(100 + Math.random() * 900)}`;
      const defaultManagerCode = `MDR${Math.floor(100 + Math.random() * 900)}`;
      const defaultStaffCode = `KSA${Math.floor(100 + Math.random() * 900)}`;

      let payload: any = {
        store_code: cleanCode,
        pin_code: cleanPin,
        name: cleanName,
        is_approved: false, // Yeni mağazalar yönetici onayına düşer
        admin_code: defaultAdminCode,
        manager_code: defaultManagerCode,
        staff_code: defaultStaffCode,
      };

      let { data, error } = await supabase
        .from('stores')
        .insert([payload])
        .select()
        .single();

      // Eğer yeni sütunlar henüz migration edilmediyse temel payload ile dene
      if (error && error.message?.includes('column')) {
        const fallbackPayload = {
          store_code: cleanCode,
          pin_code: cleanPin,
          name: cleanName,
        };
        const retry = await supabase
          .from('stores')
          .insert([fallbackPayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Bu mağaza kodu zaten kullanılıyor! Başka bir kod seçin.' };
        }
        return { success: false, error: error.message };
      }

      const newStore: Store = data;
      setStore(newStore);
      setRole('admin');

      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(newStore));
      await AsyncStorage.setItem(USER_ROLE_KEY, 'admin');

      return { success: true, store: newStore };
    } catch (e: any) {
      return { success: false, error: e.message || 'Mağaza oluşturulurken hata oluştu.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateStoreRoleCodes = async (
    adminCode: string,
    managerCode: string,
    staffCode: string
  ) => {
    if (!store) return { success: false, error: 'Aktif mağaza bulunamadı!' };

    try {
      const cleanAdmin = adminCode.trim().toUpperCase();
      const cleanManager = managerCode.trim().toUpperCase();
      const cleanStaff = staffCode.trim().toUpperCase();

      if (!cleanAdmin || !cleanManager || !cleanStaff) {
        return { success: false, error: 'Tüm rol kodları dolu olmalıdır!' };
      }

      const payload = {
        admin_code: cleanAdmin,
        manager_code: cleanManager,
        staff_code: cleanStaff,
      };

      const { data, error } = await supabase
        .from('stores')
        .update(payload)
        .eq('id', store.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedStore: Store = {
        ...store,
        ...data,
      };

      setStore(updatedStore);
      await AsyncStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(updatedStore));

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Kodlar güncellenirken bir hata oluştu.' };
    }
  };

  const logoutStore = async () => {
    setStore(null);
    setRole('admin');
    setProducts([]);
    await AsyncStorage.removeItem(STORE_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_ROLE_KEY);
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
        // Silinmiş (is_deleted === true) ürünleri filtrele
        const activeData = data.filter((p: any) => !p.is_deleted);

        const formattedProducts: Product[] = activeData.map((p: any) => ({
          ...p,
          buy_price: Number(p.buy_price) || 0,
          sell_price: Number(p.sell_price) || 0,
          category: p.category || 'Genel',
          brand: p.brand || null,
          image_url: p.image_url || null,
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
        console.warn('Görsel yükleme uyarısı (product-images bucket oluşturulmamış olabilir):', error.message);
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

      // Barkod boş bırakılmışsa otomatik benzersiz kod oluştur
      const finalBarcode = productData.barcode?.trim()
        ? productData.barcode.trim()
        : `POCO_${Date.now().toString().slice(-8)}`;

      const payload: any = {
        store_id: store.id,
        barcode: finalBarcode,
        name: productData.name.trim(),
        buy_price: productData.buy_price ?? 0,
        sell_price: productData.sell_price,
        image_url: finalImageUrl,
        category: productData.category?.trim() || 'Genel',
        brand: productData.brand?.trim() || null,
        is_deleted: false,
      };

      let { data, error } = await supabase
        .from('products')
        .upsert([payload], { onConflict: 'store_id,barcode' })
        .select()
        .single();

      // Eğer brand veya is_deleted henüz DB'de yoksa fallback ile dene
      if (error && error.message?.includes('column')) {
        delete payload.brand;
        delete payload.is_deleted;
        const retry = await supabase
          .from('products')
          .upsert([payload], { onConflict: 'store_id,barcode' })
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return { success: false, error: error.message };
      }

      const newProduct: Product = {
        ...data,
        buy_price: Number(data.buy_price) || 0,
        sell_price: Number(data.sell_price) || 0,
        category: data.category || 'Genel',
        brand: data.brand || null,
      };

      // Yerel state güncelle
      setProducts((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === newProduct.id || p.barcode === newProduct.barcode);
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

  const updateProduct = async (
    productId: string,
    updates: Partial<Product>,
    imageUri?: string | null
  ) => {
    if (!store) return { success: false, error: 'Aktif mağaza bulunamadı!' };

    try {
      let finalImageUrl: string | null | undefined = updates.image_url;

      if (imageUri && !imageUri.startsWith('http')) {
        const uploadedUrl = await uploadProductImage(imageUri);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const payload: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (finalImageUrl !== undefined) {
        payload.image_url = finalImageUrl;
      }

      // ID ve store_id güncelleme payload'ında gönderilmez
      delete payload.id;
      delete payload.store_id;

      let { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .eq('store_id', store.id)
        .select()
        .single();

      if (error && error.message?.includes('column')) {
        delete payload.brand;
        delete payload.is_deleted;
        const retry = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId)
          .eq('store_id', store.id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        return { success: false, error: error.message };
      }

      const updatedProduct: Product = {
        ...data,
        buy_price: Number(data.buy_price) || 0,
        sell_price: Number(data.sell_price) || 0,
      };

      setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)));
      return { success: true, product: updatedProduct };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ürün güncellenirken hata oluştu.' };
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!store) return { success: false, error: 'Aktif mağaza bulunamadı!' };

    try {
      // Soft delete: is_deleted sütununu true yap
      let { error } = await supabase
        .from('products')
        .update({ is_deleted: true })
        .eq('id', productId)
        .eq('store_id', store.id);

      // Eğer is_deleted sütunu DB'de henüz yoksa normal silme dene
      if (error && error.message?.includes('column')) {
        const hardDelete = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('store_id', store.id);
        error = hardDelete.error;
      }

      if (error) {
        return { success: false, error: error.message };
      }

      // Yerel listeden kaldır
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Ürün silinirken hata oluştu.' };
    }
  };

  return (
    <StoreContext.Provider
      value={{
        store,
        role,
        products,
        isLoading,
        loginStore,
        createStore,
        updateStoreRoleCodes,
        logoutStore,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
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
