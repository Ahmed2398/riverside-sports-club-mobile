import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import {
  LoginResponse,
  Progress,
  Session,
  ClassItem,
  Booking,
  Paginated,
} from './types';

export const rscApi = createApi({
  reducerPath: 'rscApi',
  baseQuery,
  tagTypes: ['Progress', 'Sessions', 'Classes', 'Bookings'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
    }),

    getProgress: builder.query<{ data: Progress }, void>({
      query: () => '/api/me/progress',
      providesTags: ['Progress'],
    }),

    getSessions: builder.query<Paginated<Session>, { page: number; perPage?: number }>({
      query: ({ page, perPage = 20 }) =>
        `/api/me/sessions?page=${page}&per_page=${perPage}`,
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          currentCache.data = newItems.data;
        } else {
          const existingIds = new Set(currentCache.data.map((s) => s.id));
          const newRecords = newItems.data.filter((s) => !existingIds.has(s.id));
          currentCache.data.push(...newRecords);
        }
        currentCache.meta = newItems.meta;
      },
      forceRefetch: () => true,
      providesTags: ['Sessions'],
    }),

    getClasses: builder.query<{ data: ClassItem[] }, void>({
      query: () => '/api/classes',
      providesTags: ['Classes'],
    }),

    bookClass: builder.mutation<
      { data: Booking },
      { classId: string; idempotencyKey: string }
    >({
      query: ({ classId, idempotencyKey }) => ({
        url: '/api/me/bookings',
        method: 'POST',
        body: { classId },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Classes', 'Progress'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProgressQuery,
  useGetSessionsQuery,
  useGetClassesQuery,
  useBookClassMutation,
} = rscApi;
