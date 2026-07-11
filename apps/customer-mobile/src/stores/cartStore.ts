import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (productVariantId: string) => Promise<void>;
  updateQuantity: (productVariantId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  loadCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: async (item) => {
    const { items } = get();
    const existingIndex = items.findIndex(
      (i) => i.productVariantId === item.productVariantId,
    );

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i,
      );
    } else {
      newItems = [...items, { ...item, id: Date.now().toString() }];
    }

    set({ items: newItems });
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  },

  removeItem: async (productVariantId) => {
    const { items } = get();
    const newItems = items.filter((i) => i.productVariantId !== productVariantId);
    set({ items: newItems });
    await AsyncStorage.setItem('cart', JSON.stringify(newItems));
  },

  updateQuantity: async (productVariantId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      const newItems = items.filter((i) => i.productVariantId !== productVariantId);
      set({ items: newItems });
      await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    } else {
      const newItems = items.map((i) =>
        i.productVariantId === productVariantId ? { ...i, quantity } : i,
      );
      set({ items: newItems });
      await AsyncStorage.setItem('cart', JSON.stringify(newItems));
    }
  },

  clearCart: async () => {
    set({ items: [] });
    await AsyncStorage.removeItem('cart');
  },

  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const price = item.discountPrice || item.price;
      return sum + price * item.quantity;
    }, 0);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  loadCart: async () => {
    try {
      const cartStr = await AsyncStorage.getItem('cart');
      if (cartStr) {
        set({ items: JSON.parse(cartStr) });
      }
    } catch {}
  },
}));
