import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  phone: string;
  role?: string;
  customerProfile?: {
    id: string;
    fullName: string;
    referralCode: string;
    isProfileComplete: boolean;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (profile: Partial<User['customerProfile']>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      const accessToken = await SecureStore.getItemAsync('accessToken');

      if (userStr && accessToken) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (profile) => {
    const { user } = get();
    if (user?.customerProfile) {
      const updated = {
        ...user,
        customerProfile: { ...user.customerProfile, ...profile },
      };
      set({ user: updated });
      await SecureStore.setItemAsync('user', JSON.stringify(updated));
    }
  },
}));
