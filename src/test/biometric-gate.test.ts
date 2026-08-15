/**
 * Biometric gate tests
 *
 * - Not available → skip to app (never stuck)
 * - Cancel/fail → lock screen with Try again / Sign out
 * - Success → enter app
 */
import authReducer, {
  setBiometricStatus,
  signOut,
} from '@/features/auth/authSlice';

describe('Biometric gate behavior', () => {
  test('biometrics not available → skip gate, enter app', () => {
    const state = authReducer(
      {
        token: 'test',
        user: { id: 1, name: { ar: '', en: '' }, email: '', role: 'member' },
        status: 'authenticated' as const,
        biometricStatus: 'pending' as const,
        error: null,
      },
      setBiometricStatus('skipped')
    );
    expect(state.biometricStatus).toBe('skipped');
  });

  test('biometric success → enter app', () => {
    const state = authReducer(
      {
        token: 'test',
        user: { id: 1, name: { ar: '', en: '' }, email: '', role: 'member' },
        status: 'authenticated' as const,
        biometricStatus: 'pending' as const,
        error: null,
      },
      setBiometricStatus('success')
    );
    expect(state.biometricStatus).toBe('success');
  });

  test('biometric cancel → lock screen with try again / sign out', () => {
    const state = authReducer(
      {
        token: 'test',
        user: { id: 1, name: { ar: '', en: '' }, email: '', role: 'member' },
        status: 'authenticated' as const,
        biometricStatus: 'pending' as const,
        error: null,
      },
      setBiometricStatus('failed')
    );
    expect(state.biometricStatus).toBe('failed');
  });

  test('sign out clears auth state', () => {
    const state = authReducer(
      {
        token: 'test',
        user: { id: 1, name: { ar: '', en: '' }, email: '', role: 'member' },
        status: 'authenticated' as const,
        biometricStatus: 'success' as const,
        error: null,
      },
      signOut()
    );
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
    expect(state.biometricStatus).toBe('pending');
  });
});
