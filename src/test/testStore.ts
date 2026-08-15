import { configureStore } from '@reduxjs/toolkit';
import { rscApi } from '@/shared/api/rscApi';
import authReducer from '@/features/auth/authSlice';
import type { RootState, AppDispatch } from '@/store';

/**
 * Creates a test store with a custom baseQuery handler.
 * The handler receives the fetch args and returns a mock response,
 * allowing tests to simulate network conditions, timeouts, etc.
 */
type MockHandler = (
  args: { url: string; method: string; body?: unknown; headers?: Record<string, string> }
) =>
  | { status: number; data: unknown }
  | Promise<{ status: number; data: unknown }>;

export function createTestStore(handler: MockHandler) {
  const mockBaseQuery: any = async (args: any) => {
    const url = typeof args === 'string' ? args : args.url;
    const method = typeof args === 'string' ? 'GET' : args.method || 'GET';
    const body = typeof args === 'string' ? undefined : args.body;
    const headers = typeof args === 'string' ? {} : args.headers || {};

    const result = await handler({ url, method, body, headers });
    if (result.status >= 400) {
      return { error: { status: result.status, data: result.data } };
    }
    return { data: result.data };
  };

  const api = rscApi.injectEndpoints({
    endpoints: (build: any) => ({
      login: build.mutation({
        query: (body: any) => ({ url: '/api/auth/login', method: 'POST', body }),
      }),
      getProgress: build.query({ query: () => '/api/me/progress' }),
      getSessions: build.query({
        query: ({ page, perPage = 20 }: { page: number; perPage?: number }) =>
          `/api/me/sessions?page=${page}&per_page=${perPage}`,
        serializeQueryArgs: ({ endpointName }: any) => endpointName,
        merge: (currentCache: any, newItems: any) => {
          const existingIds = new Set(currentCache.data.map((s: any) => s.id));
          const newRecords = newItems.data.filter((s: any) => !existingIds.has(s.id));
          currentCache.data.push(...newRecords);
          currentCache.meta = newItems.meta;
        },
        forceRefetch: () => true,
      }),
      getClasses: build.query({ query: () => '/api/classes' }),
      bookClass: build.mutation({
        query: ({ classId, idempotencyKey }: { classId: string; idempotencyKey: string }) => ({
          url: '/api/me/bookings',
          method: 'POST',
          body: { classId },
          headers: { 'Idempotency-Key': idempotencyKey },
        }),
      }),
    }),
    overrideExisting: true,
  });

  const store = configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });

  return { store, api };
}

export type TestStore = ReturnType<typeof createTestStore>;
