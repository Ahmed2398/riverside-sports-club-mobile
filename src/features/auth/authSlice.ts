import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '@/shared/api/baseQuery';
import { User } from '@/shared/api/types';

const TOKEN_KEY = 'rsc_token';
const USER_KEY = 'rsc_user';

const isWeb = Platform.OS === 'web';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (isWeb) localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export type AuthState = {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  biometricStatus: 'pending' | 'success' | 'failed' | 'skipped';
  error: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'idle',
  biometricStatus: 'pending',
  error: null,
};

export const persistAuth = async (token: string, user: User) => {
  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(USER_KEY, JSON.stringify(user));
  setAuthToken(token);
};

export const clearAuth = async () => {
  await storage.deleteItem(TOKEN_KEY);
  await storage.deleteItem(USER_KEY);
  setAuthToken(null);
};

export const loadStoredAuth = async (): Promise<{ token: string; user: User } | null> => {
  try {
    const token = await storage.getItem(TOKEN_KEY);
    const userJson = await storage.getItem(USER_KEY);
    if (token && userJson) {
      const user = JSON.parse(userJson) as User;
      setAuthToken(token);
      return { token, user };
    }
  } catch {}
  setAuthToken(null);
  return null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.error = null;
    },
    setAuthFromStorage(state, action: PayloadAction<{ token: string; user: User } | null>) {
      if (action.payload) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.status = 'authenticated';
        state.biometricStatus = 'pending';
      } else {
        state.status = 'unauthenticated';
      }
    },
    setBiometricStatus(state, action: PayloadAction<AuthState['biometricStatus']>) {
      state.biometricStatus = action.payload;
    },
    setAuthLoading(state) {
      state.status = 'loading';
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'unauthenticated';
    },
    signOut(state) {
      state.token = null;
      state.user = null;
      state.status = 'unauthenticated';
      state.biometricStatus = 'pending';
      state.error = null;
      setAuthToken(null);
    },
  },
});

export const {
  setAuth,
  setAuthFromStorage,
  setBiometricStatus,
  setAuthLoading,
  setAuthError,
  signOut,
} = authSlice.actions;

export default authSlice.reducer;
