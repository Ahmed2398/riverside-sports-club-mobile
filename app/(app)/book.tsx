import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { useGetClassesQuery, useBookClassMutation } from '@/shared/api/rscApi';
import { useTranslation, useI18n } from '@/shared/i18n/I18nProvider';
import { localizedText } from '@/shared/i18n/I18nProvider';
import { formatDate, formatTime, formatNumber } from '@/shared/i18n/format';
import { Button } from '@/shared/ui/Button';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { LanguageToggle } from '@/shared/ui/LanguageToggle';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { ThemedText, H1Text, H2Text, BodyText, SmallText, LabelText } from '@/shared/ui/ThemedText';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { getColors, spacing, radii, typography, minTapTarget } from '@/shared/theme/tokens';
import type { ClassItem, Booking } from '@/shared/api/types';

export default function BookScreen() {
  const t = useTranslation();
  const { locale } = useI18n();
  const { resolvedTheme } = useTheme();
  const colors = getColors(resolvedTheme);
  const router = useRouter();
  const { data, isLoading, isFetching, refetch } = useGetClassesQuery();
  const [bookClass, { isLoading: isBooking }] = useBookClassMutation();

  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // The idempotency key is generated when the confirm sheet opens,
  // held in a ref, and reused across retries. One intent = one key.
  const idempotencyKeyRef = useRef<string | null>(null);
  // Track if a booking attempt is in-flight to prevent double-tap
  const bookingInFlightRef = useRef(false);

  const classes = data?.data ?? [];

  const handleSelectClass = useCallback((cls: ClassItem) => {
    if (cls.spotsLeft <= 0) return;
    setSelectedClass(cls);
    setBookingError(null);
    // Generate a new idempotency key for this booking intent
    idempotencyKeyRef.current = uuidv4();
    setConfirmVisible(true);
  }, []);

  const handleCloseConfirm = useCallback(() => {
    if (bookingInFlightRef.current) return; // Don't close while booking is in-flight
    setConfirmVisible(false);
    setSelectedClass(null);
    setBookingError(null);
    idempotencyKeyRef.current = null;
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    // Guard against double-tap: if already in-flight, ignore
    if (bookingInFlightRef.current) return;
    if (!selectedClass || !idempotencyKeyRef.current) return;

    bookingInFlightRef.current = true;
    setBookingError(null);

    try {
      const result = await bookClass({
        classId: selectedClass.id,
        idempotencyKey: idempotencyKeyRef.current,
      }).unwrap();

      setConfirmation(result.data);
      setConfirmVisible(false);
      // Clear the ref — this intent is complete
      idempotencyKeyRef.current = null;
    } catch (err: any) {
      const errorCode = err?.data?.code;
      const errorMessage = err?.data?.message || t.book.bookingFailed;

      // If it's a timeout or network error, keep the same idempotency key
      // so the retry can't create a second booking.
      // If it's a validation error (class full), show the error.
      if (err?.status === 'TIMEOUT_ERROR' || err?.status === 'FETCH_ERROR') {
        setBookingError(t.book.bookingTimeout);
      } else if (errorCode === 'VALIDATION_ERROR') {
        setBookingError(errorMessage);
      } else {
        setBookingError(errorMessage);
      }
    } finally {
      bookingInFlightRef.current = false;
    }
  }, [selectedClass, bookClass, t]);

  const handleRetryBooking = useCallback(() => {
    // Retry reuses the same idempotency key from the ref
    setBookingError(null);
    handleConfirmBooking();
  }, [handleConfirmBooking]);

  const handleDone = useCallback(() => {
    setConfirmation(null);
    // Refetch classes to show updated spots
    refetch();
  }, [refetch]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[4],
    },
    headerTitle: {},
    headerButtons: {
      flexDirection: 'row',
      gap: spacing[2],
    },
    classList: { gap: spacing[3] },
    classCard: {
      backgroundColor: colors.card,
      borderRadius: radii.xl,
      padding: spacing[5],
      gap: spacing[4],
      borderWidth: 1,
      borderColor: colors.line,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 6 },
      }),
    },
    classHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing[3],
    },
    className: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    spotsBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      minWidth: 60,
      alignItems: 'center',
    },
    spotsText: {
      fontSize: 14,
      fontWeight: '700' as const,
    },
    classDetails: { gap: spacing[2] },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    detailIcon: { fontSize: 16 },
    detailText: { color: colors.inkMuted, flex: 1 },
    confirmButton: {
      borderRadius: radii.lg,
      minHeight: minTapTarget + 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4],
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: radii.xl,
      padding: spacing[6],
      width: '100%',
      maxWidth: 400,
      gap: spacing[5],
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        android: { elevation: 12 },
      }),
    },
    modalIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryWash,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    modalIcon: { fontSize: 32 },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700' as const,
      textAlign: 'center',
      color: colors.ink,
    },
    modalSubtitle: {
      textAlign: 'center',
      color: colors.inkMuted,
    },
    modalClassInfo: {
      backgroundColor: colors.background,
      borderRadius: radii.lg,
      padding: spacing[4],
      gap: spacing[2],
      borderWidth: 1,
      borderColor: colors.line,
    },
    modalClassName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.ink,
      textAlign: 'center',
    },
    modalDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
    },
    modalDetailIcon: { fontSize: 14 },
    modalDetailText: { color: colors.inkMuted },
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
    errorIcon: { fontSize: 16, color: colors.danger },
    errorText: { color: colors.danger, flex: 1 },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing[3],
    },
    modalButton: {
      flex: 1,
      borderRadius: radii.lg,
    },
    modalActions: {
      width: '100%',
      gap: spacing[3],
    },
    modalHeader: {
      alignItems: 'center',
      gap: spacing[3],
    },
    modalClassCard: {
      backgroundColor: colors.background,
      borderRadius: radii.lg,
      padding: spacing[4],
      width: '100%',
      gap: spacing[2],
      borderWidth: 1,
      borderColor: colors.line,
    },
    modalClassDetails: {
      gap: spacing[2],
    },
    confirmationContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[5],
      gap: spacing[4],
    },
    successIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.success,
      marginBottom: spacing[2],
    },
    successIcon: { fontSize: 40, color: colors.success },
    successTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.success,
      textAlign: 'center',
    },
    referenceCard: {
      backgroundColor: colors.primaryWash,
      borderRadius: radii.lg,
      padding: spacing[4],
      alignItems: 'center',
      gap: spacing[1],
      borderWidth: 1,
      borderColor: colors.primary,
      width: '100%',
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    referenceLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.primary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    referenceNumber: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      width: '100%',
      marginVertical: spacing[2],
    },
    confirmedClassInfo: {
      alignItems: 'center',
      gap: spacing[2],
      width: '100%',
    },
    confirmedClassName: {
      fontSize: 18,
      fontWeight: '600' as const,
      textAlign: 'center',
      color: colors.ink,
    },
    confirmedDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    confirmedDetailIcon: { fontSize: 14 },
    confirmedDetailText: { color: colors.inkMuted },
    successBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      backgroundColor: colors.success + '15',
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.success + '30',
    },
    successBadgeIcon: { fontSize: 16, color: colors.success },
    successBadgeText: { color: colors.success, fontWeight: '600' as const },
    doneButton: {
      width: '100%',
      marginTop: spacing[2],
      borderRadius: radii.lg,
    },
    classCardFull: {
      opacity: 0.6,
    },
    classCardTop: {
      gap: spacing[3],
    },
    classCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing[2],
    },
    classCardName: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    fullBadge: {
      backgroundColor: colors.inkMuted + '20',
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
    },
    fullBadgeText: {
      color: colors.inkMuted,
      fontSize: 12,
      fontWeight: '600' as const,
    },
    spotsBadgeLow: {
      backgroundColor: colors.warning + '20',
      borderColor: colors.warning,
    },
    spotsNumber: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.success,
    },
    spotsLabel: {
      fontSize: 10,
      color: colors.success,
    },
    classCardDetails: {
      flexDirection: 'row',
      gap: spacing[3],
      flexWrap: 'wrap' as const,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    bookButton: {
      borderRadius: radii.lg,
    },
    confirmationCard: {
      backgroundColor: colors.card,
      borderRadius: radii.xl,
      padding: spacing[6],
      width: '100%',
      gap: spacing[4],
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
    },
    confirmationTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.success,
      textAlign: 'center',
    },
    refCard: {
      backgroundColor: colors.primaryWash,
      borderRadius: radii.lg,
      padding: spacing[4],
      alignItems: 'center',
      gap: spacing[1],
      borderWidth: 1,
      borderColor: colors.primary,
      width: '100%',
    },
    refLabel: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.primary,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    refValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    confirmationDetails: {
      alignItems: 'center',
      gap: spacing[3],
      width: '100%',
    },
    confirmationClass: {
      fontSize: 18,
      fontWeight: '600' as const,
      textAlign: 'center',
      color: colors.ink,
    },
    confirmationMeta: {
      gap: spacing[2],
      alignItems: 'center',
    },
    confirmationMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    confirmationMetaIcon: {
      fontSize: 14,
    },
    confirmationMetaText: {
      color: colors.inkMuted,
    },
  }), [colors]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Confirmation screen
  if (confirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationCard}>
            <View style={styles.successIconCircle}>
              <ThemedText style={styles.successIcon}>✓</ThemedText>
            </View>
            <H1Text style={styles.confirmationTitle}>{t.book.booked}</H1Text>
            
            <View style={styles.refCard}>
              <LabelText style={styles.refLabel}>{t.book.bookingRef}</LabelText>
              <H2Text style={styles.refValue}>{confirmation.id}</H2Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.confirmationDetails}>
              <BodyText style={styles.confirmationClass}>
                {localizedText(confirmation.className, locale)}
              </BodyText>
              
              <View style={styles.confirmationMeta}>
                <View style={styles.confirmationMetaRow}>
                  <ThemedText style={styles.confirmationMetaIcon}>📅</ThemedText>
                  <SmallText style={styles.confirmationMetaText}>
                    {formatDate(confirmation.startsAt, locale)}
                  </SmallText>
                </View>
                <View style={styles.confirmationMetaRow}>
                  <ThemedText style={styles.confirmationMetaIcon}>🕐</ThemedText>
                  <SmallText style={styles.confirmationMetaText}>
                    {formatTime(confirmation.startsAt, locale)}
                  </SmallText>
                </View>
                <View style={styles.confirmationMetaRow}>
                  <ThemedText style={styles.confirmationMetaIcon}>👤</ThemedText>
                  <SmallText style={styles.confirmationMetaText}>
                    {confirmation.coach}
                  </SmallText>
                </View>
              </View>

              <View style={styles.successBadge}>
                <ThemedText style={styles.successBadgeIcon}>✓</ThemedText>
                <ThemedText style={styles.successBadgeText}>{t.book.booked}</ThemedText>
              </View>
            </View>

            <Button
              title={t.book.done}
              onPress={handleDone}
              style={styles.doneButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <H1Text style={styles.headerTitle}>{t.book.title}</H1Text>
          <View style={styles.headerButtons}>
            <ThemeToggle />
            <LanguageToggle />
          </View>
        </View>

        <View style={styles.classList}>
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              locale={locale}
              t={t}
              onSelect={handleSelectClass}
              styles={styles}
            />
          ))}
        </View>
      </ScrollView>

      {/* Confirmation modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedClass && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconCircle}>
                    <ThemedText style={styles.modalIcon}>📅</ThemedText>
                  </View>
                  <H2Text style={styles.modalTitle}>{t.book.confirmTitle}</H2Text>
                  <BodyText style={styles.modalSubtitle}>
                    {t.book.confirmBody}
                  </BodyText>
                </View>

                <View style={styles.modalClassCard}>
                  <BodyText style={styles.modalClassName}>
                    {localizedText(selectedClass.name, locale)}
                  </BodyText>
                  <View style={styles.modalClassDetails}>
                    <View style={styles.modalDetailRow}>
                      <ThemedText style={styles.modalDetailIcon}>📅</ThemedText>
                      <SmallText style={styles.modalDetailText}>
                        {formatDate(selectedClass.startsAt, locale)}
                      </SmallText>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <ThemedText style={styles.modalDetailIcon}>🕐</ThemedText>
                      <SmallText style={styles.modalDetailText}>
                        {formatTime(selectedClass.startsAt, locale)}
                      </SmallText>
                    </View>
                    <View style={styles.modalDetailRow}>
                      <ThemedText style={styles.modalDetailIcon}>👤</ThemedText>
                      <SmallText style={styles.modalDetailText}>
                        {selectedClass.coach}
                      </SmallText>
                    </View>
                  </View>
                </View>

                {bookingError && (
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.errorIcon}>⚠</ThemedText>
                    <BodyText style={styles.errorText}>{bookingError}</BodyText>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title={
                      isBooking
                        ? t.book.confirming
                        : bookingError
                          ? t.book.tryAgain
                          : t.book.confirm
                    }
                    onPress={bookingError ? handleRetryBooking : handleConfirmBooking}
                    loading={isBooking}
                    disabled={isBooking}
                    style={styles.confirmButton}
                  />
                  <Button
                    title={t.book.cancel}
                    onPress={handleCloseConfirm}
                    variant="secondary"
                    disabled={isBooking}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ClassCard = React.memo(function ClassCard({
  cls,
  locale,
  t,
  onSelect,
  styles,
}: {
  cls: ClassItem;
  locale: 'en' | 'ar';
  t: ReturnType<typeof useTranslation>;
  onSelect: (cls: ClassItem) => void;
  styles: any;
}) {
  const isFull = cls.spotsLeft <= 0;
  const isLowSpots = cls.spotsLeft <= 3 && cls.spotsLeft > 0;
  const className = localizedText(cls.name, locale);

  return (
    <View style={[styles.classCard, isFull && styles.classCardFull]}>
      <View style={styles.classCardTop}>
        <View style={styles.classCardHeader}>
          <BodyText style={styles.classCardName} numberOfLines={2}>
            {className}
          </BodyText>
          {isFull ? (
            <View style={styles.fullBadge}>
              <ThemedText style={styles.fullBadgeText}>{t.book.full}</ThemedText>
            </View>
          ) : (
            <View style={[styles.spotsBadge, isLowSpots && styles.spotsBadgeLow]}>
              <ThemedText style={styles.spotsNumber}>
                {formatNumber(cls.spotsLeft, locale)}
              </ThemedText>
              <SmallText style={styles.spotsLabel}>{t.book.spotsLeft}</SmallText>
            </View>
          )}
        </View>

        <View style={styles.classCardDetails}>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailIcon}>📅</ThemedText>
            <SmallText style={styles.detailText}>
              {formatDate(cls.startsAt, locale)}
            </SmallText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailIcon}>🕐</ThemedText>
            <SmallText style={styles.detailText}>
              {formatTime(cls.startsAt, locale)}
            </SmallText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText style={styles.detailIcon}>👤</ThemedText>
            <SmallText style={styles.detailText} numberOfLines={1}>
              {cls.coach}
            </SmallText>
          </View>
        </View>
      </View>

      <Button
        title={isFull ? t.book.full : t.book.confirm}
        onPress={() => onSelect(cls)}
        disabled={isFull}
        variant={isFull ? 'secondary' : 'primary'}
        style={styles.bookButton}
      />
    </View>
  );
});

