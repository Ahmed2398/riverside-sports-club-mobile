import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getColors, typography } from '@/shared/theme/tokens';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { formatNumber } from '@/shared/i18n/format';
import { ThemedText } from './ThemedText';

type ProgressRingProps = {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
};

export function ProgressRing({
  current,
  goal,
  size = 200,
  strokeWidth = 16,
}: ProgressRingProps) {
  const { locale, isRTL } = useI18n();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  // In RTL, the ring fills from the other direction
  const strokeDashoffset = isRTL
    ? circumference * (1 - progress)
    : -circumference * progress;

  const percentage = Math.round(progress * 100);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    count: {
      ...typography.display,
      fontSize: 36,
      color: colors.ink,
      fontVariant: ['tabular-nums'],
    },
    goal: {
      ...typography.h2,
      fontSize: 18,
      color: colors.inkMuted,
      fontVariant: ['tabular-nums'],
    },
    percentage: {
      ...typography.label,
      color: colors.primary,
      marginTop: 4,
    },
    goalLabel: {
      ...typography.small,
      color: colors.inkMuted,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={isRTL && { transform: [{ scaleX: -1 }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.line}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <ThemedText style={styles.count}>
          {formatNumber(current, locale)}
          <ThemedText style={styles.goal}> / {formatNumber(goal, locale)}</ThemedText>
        </ThemedText>
        <ThemedText style={styles.percentage}>
          {formatNumber(percentage, locale)}%
        </ThemedText>
      </View>
    </View>
  );
}
