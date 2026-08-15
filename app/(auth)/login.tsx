import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { useLoginMutation } from '@/shared/api/rscApi';
import { useAppDispatch } from '@/shared/hooks/redux';
import { setAuth, setAuthError, persistAuth } from '@/features/auth/authSlice';
import { Button } from '@/shared/ui/Button';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { ThemedText, H1Text, BodyText, LabelText } from '@/shared/ui/ThemedText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, spacing, radii, typography, minTapTarget } from '@/shared/theme/tokens';

export default function LoginScreen() {
  const t = useTranslation();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('member@riverside.example');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    hero: {
      alignItems: 'center',
      paddingTop: spacing[4],
      paddingBottom: spacing[8] + spacing[4],
      paddingHorizontal: spacing[5],
      borderBottomLeftRadius: radii.xl,
      borderBottomRightRadius: radii.xl,
    },
    heroTopRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: spacing[4],
    },
    langToggle: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderColor: 'rgba(255,255,255,0.3)',
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    logoText: {
      fontSize: 32,
      fontWeight: '700' as const,
      color: colors.white,
    },
    appName: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.white,
      marginBottom: spacing[1],
    },
    tagline: {
      ...typography.body,
      color: 'rgba(255,255,255,0.8)',
    },
    formCard: {
      flex: 1,
      backgroundColor: colors.card,
      marginTop: -spacing[4],
      marginHorizontal: spacing[4],
      borderRadius: radii.xl,
      paddingHorizontal: spacing[5],
      paddingTop: spacing[6],
      paddingBottom: spacing[5],
      gap: spacing[4],
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    field: { gap: spacing[2] },
    label: {
      color: colors.inkMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      minHeight: minTapTarget,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.white,
    },
    inputWrapperError: {
      borderColor: colors.danger,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.ink,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    eyeButton: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      minHeight: minTapTarget,
      justifyContent: 'center',
    },
    eyeIcon: {
      fontSize: 20,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      backgroundColor: colors.danger + '15',
      borderRadius: radii.md,
      padding: spacing[3],
      borderWidth: 1,
      borderColor: colors.danger + '30',
    },
    errorIcon: {
      fontSize: 16,
      color: colors.danger,
    },
    errorText: {
      color: colors.danger,
      flex: 1,
    },
    signInButton: {
      borderRadius: radii.lg,
    },
    footerHint: {
      textAlign: 'center',
      color: colors.inkMuted,
    },
  }), [colors]);

  const handleLogin = useCallback(async () => {
    setError(null);
    try {
      const result = await login({ email, password }).unwrap();
      await persistAuth(result.token, result.user);
      dispatch(setAuth({ token: result.token, user: result.user }));
    } catch (err: any) {
      const message = err?.data?.message || t.auth.invalidCredentials;
      setError(message);
      dispatch(setAuthError(message));
    }
  }, [email, password, login, dispatch, t]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Hero header with gradient */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDeep]}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <LanguageToggle style={styles.langToggle} />
            </View>
            <View style={styles.logoCircle}>
              <ThemedText style={styles.logoText}>R</ThemedText>
            </View>
            <ThemedText style={styles.appName}>{t.app.name}</ThemedText>
            <ThemedText style={styles.tagline}>{t.auth.welcomeBack}</ThemedText>
          </LinearGradient>

          {/* Form card */}
          <View style={styles.formCard}>
            <View style={styles.field}>
              <LabelText style={styles.label}>{t.auth.email}</LabelText>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                  error && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  placeholder="member@riverside.example"
                  placeholderTextColor={colors.inkMuted}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.field}>
              <LabelText style={styles.label}>{t.auth.password}</LabelText>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                  error && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  placeholder="••••••••"
                  placeholderTextColor={colors.inkMuted}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ThemedText style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorIcon}>⚠</ThemedText>
                <BodyText style={styles.errorText}>{error}</BodyText>
              </View>
            )}

            <Button
              title={isLoading ? t.auth.signingIn : t.auth.signInButton}
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email || !password}
              style={styles.signInButton}
            />

            <ThemedText style={styles.footerHint}>
              {t.auth.welcomeBack}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
