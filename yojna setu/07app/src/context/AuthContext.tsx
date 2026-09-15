import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import {
  authApi,
  AuthRole,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from "../api/authApi";

const ACCESS_TOKEN_KEY = "yojnasetu_access_token";
const USER_KEY = "yojnasetu_user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  role: AuthRole | null;

  login: (credentials: LoginRequest) => Promise<TokenResponse>;

  loginWithGoogle: (
    idToken: string,
    preferredLanguage?: string,
  ) => Promise<TokenResponse>;

  register: (payload: RegisterRequest) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isReady, setIsReady] = useState(false);

  const saveAuth = async (authToken: string, authUser: User) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, authToken);

    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);
  };

  const clearAuth = async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);

    await SecureStore.deleteItemAsync(USER_KEY);

    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);

      const savedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

      if (!savedToken) {
        setToken(null);
        setUser(null);
        setIsReady(true);
        return;
      }

      setToken(savedToken);

      const savedUser = await SecureStore.getItemAsync(USER_KEY);

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch {
          await SecureStore.deleteItemAsync(USER_KEY);
          setUser(null);
        }
      }

      const me = await authApi.getMe();

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(me));

      setUser(me);
    } catch (error) {
      console.error("Failed to restore authenticated user:", error);

      await clearAuth();
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: LoginRequest): Promise<TokenResponse> => {
    setIsLoading(true);

    try {
      const response = await authApi.login(credentials);

      await saveAuth(response.access_token, response.user);

      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (
    idToken: string,
    preferredLanguage?: string,
  ): Promise<TokenResponse> => {
    setIsLoading(true);

    try {
      const response = await authApi.loginWithGoogle(
        idToken,
        preferredLanguage,
      );

      await saveAuth(response.access_token, response.user);

      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterRequest) => {
    setIsLoading(true);

    try {
      await authApi.register(payload);

      const identifier = payload.email || payload.phone || "";

      const loginResponse = await authApi.login({
        identifier,
        password: payload.password,
      });

      await saveAuth(loginResponse.access_token, loginResponse.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isReady,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
