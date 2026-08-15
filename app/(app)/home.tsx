import React, { useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetProgressQuery } from '@/shared/api/rscApi';
import { useTranslation, useI18n } from '@/shared/i18n/I18nProvider';
import { localizedText } from '@/shared/i18n/I18nProvider';
import { formatDate, formatTime, formatNumber } from '@/shared/i18n/format';
import { ProgressRing } from '@/shared/ui/ProgressRing';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { ThemedText, H1Text, H2Text, BodyText, LabelText, SmallText } from '@/shared/ui/ThemedText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, spacing, radii, typography } from '@/shared/theme/tokens';

export default function HomeScreen() {
  const t = useTranslation();
  const { locale, isRTL } = useI18n();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  const { data, isLoading, isFetching, refetch } = useGetProgressQuery();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing[4], paddingVertical: spacing[5] },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginBottom: spacing[5],
      paddingBottom: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerName: { flex: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    ringSection: { alignItems: 'center', marginBottom: spacing[6], gap: spacing[2], width: '100%' },
    goalProgressLabel: { color: colors.inkMuted, alignSelf: 'flex-start' },
    ringLabel: { color: colors.inkMuted },
    encouragement: { textAlign: 'center', color: colors.primary, maxWidth: 280 },
    statsRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[5] },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      padding: spacing[4],
      alignItems: 'center',
      gap: spacing[1],
      borderWidth: 1,
      borderColor: colors.line,
    },
    statIcon: { fontSize: 24 },
    statValue: { ...typography.h1, fontVariant: ['tabular-nums'], color: colors.ink },
    statLabel: { color: colors.inkMuted },
    statSub: { color: colors.inkMuted },
    nextClassCard: {
      backgroundColor: colors.primaryWash,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[1],
    },
    nextClassTitle: { color: colors.primary, fontWeight: '600' as const },
    nextClassLabel: { color: colors.primary, fontWeight: '600' as const },
    nextClassName: { fontWeight: '600' as const },
    nextClassTime: { color: colors.inkMuted },
  }), [colors]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const progress = data?.data;
  if (!progress) return null;

  const isOnTrack = progress.sessionsThisMonth >= progress.monthlyGoal;
  const tierLabel = progress.tier.charAt(0).toUpperCase() + progress.tier.slice(1);
  const name = localizedText(progress.name, locale);
  const nextClassName = progress.nextClass
    ? localizedText(progress.nextClass.name, locale)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <H1Text style={styles.headerName}>{name}</H1Text>
          <View style={styles.headerRight}>
            <ThemeToggle />
            <LanguageToggle />
            <StatusBadge
              label={tierLabel}
              status={progress.tier === 'premium' ? 'warning' : 'neutral'}
              shape="square"
            />
          </View>
        </View>

        <View style={styles.ringSection}>
          <LabelText style={styles.goalProgressLabel}>
            {t.home.goalProgress}
          </LabelText>
          <ProgressRing
            current={progress.sessionsThisMonth}
            goal={progress.monthlyGoal}
          />
          <LabelText style={styles.ringLabel}>{t.home.sessionsThisMonth}</LabelText>
          <BodyText style={styles.encouragement}>
            {isOnTrack ? t.home.onTrack : t.home.keepGoing}
          </BodyText>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statIcon}>🔥</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatNumber(progress.currentStreakDays, locale)}
            </ThemedText>
            <LabelText style={styles.statLabel}>{t.home.streak}</LabelText>
            <SmallText style={styles.statSub}>{t.home.days}</SmallText>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statIcon}>📅</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatNumber(progress.totalSessions, locale)}
            </ThemedText>
            <LabelText style={styles.statLabel}>{t.sessions.title}</LabelText>
          </View>
        </View>

        {nextClassName && progress.nextClass && (
          <View style={styles.nextClassCard}>
            <LabelText style={styles.nextClassLabel}>{t.home.nextClass}</LabelText>
            <H2Text style={styles.nextClassName}>{nextClassName}</H2Text>
            <SmallText style={styles.nextClassTime}>
              {formatDate(progress.nextClass.startsAt, locale)} ·{' '}
              {formatTime(progress.nextClass.startsAt, locale)}
            </SmallText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
