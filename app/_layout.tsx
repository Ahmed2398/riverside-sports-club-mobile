import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { AuthGate } from '@/features/auth/AuthGate';
import { loadStoredAuth, setAuthFromStorage } from '@/features/auth/authSlice';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const stored = await loadStoredAuth();
      store.dispatch(setAuthFromStorage(stored));
    })();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <I18nProvider>
          <StatusBar style="auto" />
          <AuthGate />
        </I18nProvider>
      </ThemeProvider>
    </Provider>
  );
}
