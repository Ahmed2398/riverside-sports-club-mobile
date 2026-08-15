import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, spacing, radii } from '@/shared/theme/tokens';

type ThemeToggleProps = {
  style?: ViewStyle;
};

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const colors = getColors(resolvedTheme);

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.container(colors), style]}
      activeOpacity={0.7}
    >
      <ThemedText style={styles.text(colors)}>
        {resolvedTheme === 'light' ? '🌙' : '☀️'}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = {
  container: (colors: ReturnType<typeof getColors>) => StyleSheet.create({
    button: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      backgroundColor: colors.primaryWash,
      borderWidth: 1,
      borderColor: colors.line,
    },
  }).button,
  text: (colors: ReturnType<typeof getColors>) => StyleSheet.create({
    emoji: {
      fontSize: 18,
    },
  }).emoji,
};
