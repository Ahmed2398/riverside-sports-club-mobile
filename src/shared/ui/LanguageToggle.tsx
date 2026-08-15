import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { colors, spacing, radii, typography } from '@/shared/theme/tokens';

type LanguageToggleProps = {
  style?: ViewStyle;
};

export function LanguageToggle({ style }: LanguageToggleProps) {
  const { locale, toggleLocale } = useI18n();

  return (
    <TouchableOpacity
      onPress={toggleLocale}
      style={[styles.container, style]}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.text}>
        {locale === 'en' ? 'العربية' : 'English'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.primaryWash,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: {
    ...typography.small,
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
