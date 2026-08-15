import { Platform } from 'react-native';
import { BaseQueryFn, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ApiError } from './types';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:4000' : 'http://10.0.2.2:4000';

const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL as string) || DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// Token is injected at runtime via a module-level variable set by the auth slice.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    return headers;
  },
});

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  { status: number; data: ApiError }
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error) {
    return {
      error: {
        status: result.error.status as number,
        data: result.error.data as ApiError,
      },
    };
  }
  return { data: result.data };
};
