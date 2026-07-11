"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, type AdminUser, type ApiError } from "@/lib/api";

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_USER_KEY = "admin_user";

function getStoredUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

function storeUser(user: AdminUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!api.isAuthenticated()) {
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }

    try {
      const response = await api.get<{ user: AdminUser }>("/auth/me");
      if (response.success && response.data) {
        const user = (response.data as any).user || (response.data as any);
        if (user && user.id) {
          const normalizedUser: AdminUser = {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role || "admin",
          };
          storeUser(normalizedUser);
          setState({ user: normalizedUser, isAuthenticated: true, isLoading: false });
          return true;
        }
      }

      const stored = getStoredUser();
      if (stored) {
        setState({ user: stored, isAuthenticated: true, isLoading: false });
        return true;
      }

      setState({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        const stored = getStoredUser();
        if (stored) {
          setState({ user: stored, isAuthenticated: true, isLoading: false });
          return true;
        }
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
      const stored = getStoredUser();
      if (stored) {
        setState({ user: stored, isAuthenticated: true, isLoading: false });
        return true;
      }
      setState({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await api.login(email, password);
        if (response.success && response.data) {
          const { user } = response.data;
          storeUser(user);
          setState({ user, isAuthenticated: true, isLoading: false });
          router.push("/dashboard");
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    await api.logout();
    clearUser();
    setState({ user: null, isAuthenticated: false, isLoading: false });
    router.push("/login");
  }, [router]);

  const refreshAuth = useCallback(async () => {
    await validateToken();
  }, [validateToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshAuth,
    }),
    [state, login, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}