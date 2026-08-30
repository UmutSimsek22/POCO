import React, { createContext, useContext, useState } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Her okutmayı ayrı bir satır olarak ekle (Kullanıcının tercihi)
  const addToCart = (product: Product) => {
    const newItem: CartItem = {
      id: `${product.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      product,
      scanned_at: Date.now(),
    };
    setCartItems((prev) => [newItem, ...prev]);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.sell_price, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart, CartProvider içinde kullanılmalıdır!');
  }
  return context;
};
