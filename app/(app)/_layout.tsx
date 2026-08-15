import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, typography, spacing, radii } from '@/shared/theme/tokens';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 24 }}>{emoji}</Text>;
}

export default function AppLayout() {
  const t = useTranslation();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);

  const tabBarStyle = useMemo(() => ({
    backgroundColor: colors.card,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    height: Platform.OS === 'ios' ? 88 : 64,
  }), [colors]);

  const screenOptions = useMemo(() => ({
    headerShown: false,
    tabBarStyle,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.inkMuted,
    tabBarLabelStyle: {
      ...typography.label,
      fontSize: 11,
      fontWeight: '600' as const,
      marginTop: 2,
    },
    tabBarIconStyle: {
      marginBottom: 2,
    },
    tabBarItemStyle: {
      borderRadius: radii.lg,
      marginHorizontal: spacing[1],
      marginVertical: spacing[1],
    },
    tabBarActiveBackgroundColor: colors.primaryWash,
  }), [tabBarStyle, colors]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: t.nav.home,
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: t.nav.sessions,
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: t.nav.book,
          tabBarIcon: () => <TabIcon emoji="📅" />,
        }}
      />
    </Tabs>
  );
}
