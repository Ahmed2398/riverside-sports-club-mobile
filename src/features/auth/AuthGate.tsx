import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSegments, Stack } from 'expo-router';
import { useAppSelector, useAppDispatch } from '@/shared/hooks/redux';
import { useBiometric } from './useBiometric';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { clearAuth, signOut, setBiometricStatus } from './authSlice';
import { Button } from '@/shared/ui/Button';
import { ThemedText, H1Text, BodyText } from '@/shared/ui/ThemedText';
import { colors, spacing } from '@/shared/theme/tokens';

export function AuthGate() {
  const { status, biometricStatus, token } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();
  const t = useTranslation();
  const biometric = useBiometric();

  const isInAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (status === 'authenticated' && biometricStatus === 'pending' && !isInAuthGroup) {
      if (biometric.available && biometric.enrolled) {
        biometric.authenticate();
      } else {
        dispatch(setBiometricStatus('skipped'));
      }
    }
  }, [status, biometricStatus, isInAuthGroup, biometric, dispatch]);

  useEffect(() => {
    if (biometric.result === 'success') {
      dispatch(setBiometricStatus('success'));
    } else if (biometric.result === 'failed' || biometric.result === 'cancelled') {
      dispatch(setBiometricStatus('failed'));
    } else if (biometric.result === 'not-available') {
      dispatch(setBiometricStatus('skipped'));
    }
  }, [biometric.result, dispatch]);

  useEffect(() => {
    if (status === 'idle') return;
    const shouldShowLogin = status === 'unauthenticated' || !token;
    const shouldShowApp = status === 'authenticated' && !!token;
    if (shouldShowLogin && !isInAuthGroup) {
      router.replace('/(auth)/login');
    } else if (shouldShowApp && isInAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [status, token, isInAuthGroup, router]);

  const handleSignOut = useCallback(async () => {
    await clearAuth();
    dispatch(signOut());
    biometric.reset();
  }, [dispatch, biometric]);

  const handleTryAgain = useCallback(() => {
    biometric.reset();
    biometric.authenticate();
  }, [biometric]);

  if (status === 'idle') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'authenticated' && biometricStatus === 'failed') {
    return (
      <View style={styles.lockScreen}>
        <View style={styles.lockContent}>
          <ThemedText style={styles.lockIcon}>🔒</ThemedText>
          <H1Text style={styles.lockTitle}>{t.auth.biometricPrompt}</H1Text>
          <BodyText style={styles.lockMessage}>
            {biometric.result === 'cancelled'
              ? t.auth.biometricCancelled
              : t.auth.biometricFailed}
          </BodyText>
          <View style={styles.lockActions}>
            <Button title={t.auth.tryAgain} onPress={handleTryAgain} />
            <View style={{ height: spacing[2] }} />
            <Button title={t.auth.signOut} onPress={handleSignOut} variant="secondary" />
          </View>
        </View>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  lockScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: spacing[5] },
  lockContent: { alignItems: 'center', maxWidth: 320 },
  lockIcon: { fontSize: 48, marginBottom: spacing[4] },
  lockTitle: { textAlign: 'center', marginBottom: spacing[2] },
  lockMessage: { textAlign: 'center', color: colors.inkMuted, marginBottom: spacing[5] },
  lockActions: { width: '100%' },
});
