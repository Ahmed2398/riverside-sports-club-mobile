import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetSessionsQuery } from '@/shared/api/rscApi';
import { useTranslation, useI18n } from '@/shared/i18n/I18nProvider';
import { localizedText } from '@/shared/i18n/I18nProvider';
import { formatDate, formatTime, formatNumber } from '@/shared/i18n/format';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { ThemedText, H1Text, BodyText, SmallText, LabelText } from '@/shared/ui/ThemedText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, spacing, radii, typography } from '@/shared/theme/tokens';
import type { Session } from '@/shared/api/types';

const PAGE_SIZE = 20;

export default function SessionsScreen() {
  const t = useTranslation();
  const { locale } = useI18n();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isFetching } = useGetSessionsQuery({ page, perPage: PAGE_SIZE });

  const sessions = data?.data ?? [];
  const meta = data?.meta;
  const hasMore = meta ? page < meta.last_page : false;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
  }, []);

  React.useEffect(() => {
    if (refreshing && !isFetching) {
      setRefreshing(false);
    }
  }, [refreshing, isFetching]);

  const onEndReached = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasMore]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    headerTitle: {},
    headerButtons: {
      flexDirection: 'row',
      gap: spacing[2],
    },
    list: { paddingHorizontal: spacing[4] },
    row: {
      backgroundColor: colors.card,
      borderRadius: radii.lg,
      padding: spacing[4],
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: colors.line,
    },
    rowMain: { gap: spacing[3] },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing[2],
    },
    className: {
      flex: 1,
      fontWeight: '600' as const,
      fontSize: 17,
    },
    rowDetails: {
      flexDirection: 'row',
      gap: spacing[4],
      flexWrap: 'wrap' as const,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    detailIcon: {
      fontSize: 14,
    },
    detailText: {
      color: colors.inkMuted,
    },
    footer: { paddingVertical: spacing[4], alignItems: 'center', gap: spacing[2] },
    footerText: { color: colors.inkMuted },
  }), [colors]);

  const renderItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionRow item={item} locale={locale} t={t} styles={styles} />
    ),
    [locale, t, styles]
  );

  const keyExtractor = useCallback((item: Session) => item.id, []);

  const ListFooter = useMemo(() => {
    if (isFetching && page > 1) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={colors.primary} />
          <SmallText style={styles.footerText}>{t.sessions.loadingMore}</SmallText>
        </View>
      );
    }
    if (!hasMore && sessions.length > 0) {
      return (
        <View style={styles.footer}>
          <SmallText style={styles.footerText}>{t.sessions.noMore}</SmallText>
        </View>
      );
    }
    return null;
  }, [isFetching, page, hasMore, sessions.length, t]);

  if (isLoading && page === 1) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <H1Text style={styles.headerTitle}>{t.sessions.title}</H1Text>
        <View style={styles.headerButtons}>
          <ThemeToggle />
          <LanguageToggle />
        </View>
      </View>
      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        refreshControl={
          <RefreshControl refreshing={refreshing || (isFetching && page === 1)} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={ListFooter}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const SessionRow = React.memo(function SessionRow({
  item,
  locale,
  t,
  styles,
}: {
  item: Session;
  locale: 'en' | 'ar';
  t: ReturnType<typeof useTranslation>;
  styles: any;
}) {
  const className = localizedText(item.className, locale);
  const isUpcoming = item.status === 'upcoming';

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <BodyText style={styles.className} numberOfLines={1}>
            {className}
          </BodyText>
          <StatusBadge
            label={isUpcoming ? t.sessions.upcoming : t.sessions.attended}
            status={isUpcoming ? 'warning' : 'success'}
            shape={isUpcoming ? 'triangle' : 'circle'}
          />
        </View>
        <View style={styles.rowDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailIcon}>👤</ThemedText>
            <SmallText style={styles.detailText} numberOfLines={1}>
              {item.coach}
            </SmallText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailIcon}>📅</ThemedText>
            <SmallText style={styles.detailText}>
              {formatDate(item.date, locale)}
            </SmallText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailIcon}>⏱</ThemedText>
            <SmallText style={styles.detailText}>
              {formatNumber(item.durationMinutes, locale)} {t.sessions.minutes}
            </SmallText>
          </View>
        </View>
      </View>
    </View>
  );
});
