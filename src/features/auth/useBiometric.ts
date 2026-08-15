import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from '@/shared/i18n/I18nProvider';

export type BiometricState = {
  available: boolean;
  enrolled: boolean;
  result: 'idle' | 'success' | 'failed' | 'cancelled' | 'not-available';
  authenticate: () => Promise<void>;
  reset: () => void;
};

export function useBiometric(): BiometricState {
  const t = useTranslation();
  const [available, setAvailable] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [result, setResult] = useState<BiometricState['result']>('idle');

  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setAvailable(hasHardware);
        setEnrolled(isEnrolled);
      } catch {
        setAvailable(false);
        setEnrolled(false);
      }
    })();
  }, []);

  const authenticate = useCallback(async () => {
    try {
      if (!available || !enrolled) {
        setResult('not-available');
        return;
      }
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t.auth.biometricPrompt,
        fallbackLabel: t.auth.biometricFallback,
        cancelLabel: t.auth.cancel,
      });
      if (authResult.success) {
        setResult('success');
      } else if (authResult.error === 'user_cancel' || authResult.error === 'system_cancel') {
        setResult('cancelled');
      } else {
        setResult('failed');
      }
    } catch {
      setResult('failed');
    }
  }, [available, enrolled, t]);

  const reset = useCallback(() => setResult('idle'), []);

  return { available, enrolled, result, authenticate, reset };
}
