import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/api/authApi';
import { TOKEN_KEY, USER_KEY, onAuthExpired } from '@/api/client';
import type { LoginRequest, RegisterRequest, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const persistAuth = useCallback(async (tok: string, usr: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, tok);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      // best-effort
    }
    setToken(null);
    setUser(null);
  }, []);

  // ── Bootstrap: restore session from SecureStore ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
          // Validate token is still good
          try {
            const freshUser = await authApi.getMe();
            setUser(freshUser);
          } catch {
            await clearAuth();
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [clearAuth]);

  // ── Listen for 401s from Axios ────────────────────────────────────────────
  useEffect(() => {
    return onAuthExpired(() => {
      clearAuth();
    });
  }, [clearAuth]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(
    async (data: LoginRequest) => {
      const tokenResp = await authApi.login(data);
      // Fetch full user after getting token
      // Temporarily set token so the next request has auth
      await SecureStore.setItemAsync(TOKEN_KEY, tokenResp.access_token);
      const userResp = await authApi.getMe();
      await persistAuth(tokenResp.access_token, userResp);
    },
    [persistAuth],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      await authApi.register(data);
      // After register, log in automatically
      await login({ email: data.email, password: data.password });
    },
    [login],
  );

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(freshUser));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
