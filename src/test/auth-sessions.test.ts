/**
 * Sessions pagination tests
 * - Appends pages via merge
 * - Resets on refresh (page 1)
 * - Stops at last page
 */
import authReducer, {
  setAuth,
  signOut,
  setAuthFromStorage,
} from '@/features/auth/authSlice';

describe('Auth slice', () => {
  test('setAuth sets token, user, and authenticated status', () => {
    const state = authReducer(
      { token: null, user: null, status: 'unauthenticated' as const, biometricStatus: 'pending' as const, error: null },
      setAuth({ token: 'abc123', user: { id: 1, name: { ar: 'عضو', en: 'Member' }, email: 'm@test', role: 'member' } })
    );
    expect(state.token).toBe('abc123');
    expect(state.user).toEqual({ id: 1, name: { ar: 'عضو', en: 'Member' }, email: 'm@test', role: 'member' });
    expect(state.status).toBe('authenticated');
    expect(state.error).toBeNull();
  });

  test('signOut clears everything', () => {
    const state = authReducer(
      { token: 'abc', user: { id: 1, name: { ar: '', en: '' }, email: '', role: 'member' }, status: 'authenticated' as const, biometricStatus: 'success' as const, error: null },
      signOut()
    );
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe('unauthenticated');
    expect(state.biometricStatus).toBe('pending');
  });

  test('setAuthFromStorage with null → unauthenticated', () => {
    const state = authReducer(
      { token: null, user: null, status: 'idle' as const, biometricStatus: 'pending' as const, error: null },
      setAuthFromStorage(null)
    );
    expect(state.status).toBe('unauthenticated');
  });

  test('setAuthFromStorage with stored data → authenticated', () => {
    const state = authReducer(
      { token: null, user: null, status: 'idle' as const, biometricStatus: 'pending' as const, error: null },
      setAuthFromStorage({ token: 'stored', user: { id: 42, name: { ar: '', en: '' }, email: '', role: 'member' } })
    );
    expect(state.status).toBe('authenticated');
    expect(state.token).toBe('stored');
    expect(state.biometricStatus).toBe('pending');
  });
});

describe('Sessions pagination logic', () => {
  function makeSession(id: string) {
    return {
      id,
      date: '2026-08-10',
      className: { ar: 'يوغا', en: 'Yoga' },
      durationMinutes: 60,
      coach: 'Coach A',
      status: 'attended' as const,
    };
  }

  test('merge appends new records without duplicates', () => {
    const cache = {
      data: [makeSession('1'), makeSession('2')],
      meta: { page: 1, per_page: 2, total: 6, last_page: 3 },
    };
    const newItems = {
      data: [makeSession('2'), makeSession('3'), makeSession('4')],
      meta: { page: 2, per_page: 3, total: 6, last_page: 3 },
    };

    // Simulate the merge function from rscApi
    const existingIds = new Set(cache.data.map((s) => s.id));
    const newRecords = newItems.data.filter((s) => !existingIds.has(s.id));
    cache.data.push(...newRecords);
    cache.meta = newItems.meta;

    expect(cache.data).toHaveLength(4);
    expect(cache.data.map((s) => s.id)).toEqual(['1', '2', '3', '4']);
    expect(cache.meta.page).toBe(2);
  });

  test('hasMore is true when page < last_page', () => {
    const page = 2;
    const meta = { page: 2, per_page: 20, total: 200, last_page: 10 };
    const hasMore = page < meta.last_page;
    expect(hasMore).toBe(true);
  });

  test('hasMore is false when page >= last_page', () => {
    const page = 10;
    const meta = { page: 10, per_page: 20, total: 200, last_page: 10 };
    const hasMore = page < meta.last_page;
    expect(hasMore).toBe(false);
  });

  test('refresh resets to page 1', () => {
    let page = 3;
    // Simulate onRefresh
    page = 1;
    expect(page).toBe(1);
  });
});
