import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { getColors, spacing, radii, typography } from '@/shared/theme/tokens';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { ThemedText } from './ThemedText';

type StatusBadgeProps = {
  label: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  shape?: 'circle' | 'square' | 'triangle';
};

const shapeIcon: Record<NonNullable<StatusBadgeProps['shape']>, string> = {
  circle: '\u25CF',
  square: '\u25A0',
  triangle: '\u25B2',
};

export function StatusBadge({ label, status, shape = 'circle' }: StatusBadgeProps) {
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  
  const statusColors: Record<StatusBadgeProps['status'], string> = useMemo(() => ({
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.inkMuted,
  }), [colors]);

  const styles = useMemo(() => StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
    },
    icon: {
      ...typography.label,
      fontSize: 8,
    },
    label: {
      ...typography.label,
    },
  }), []);

  const color = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
      <ThemedText style={[styles.icon, { color }]}>{shapeIcon[shape]}</ThemedText>
      <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
    </View>
  );
}
