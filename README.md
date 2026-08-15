# Riverside Sports Club — Member App

A React Native + Expo mobile app for club members to track monthly progress, browse session history, and book classes — with persistent auth, a biometric gate, and an idempotent booking flow that is provably safe against double-taps and retries.

## Features

- **Sign in & stay signed in** — JWT stored in `expo-secure-store`; session survives app close/reopen. On return, a biometric gate (Face ID, fingerprint, or device passcode) confirms identity. If biometrics aren't available, the gate is skipped. If the check fails or is cancelled, a lock screen offers "Try again" or "Sign out" — never stuck.
- **Home** — Progress ring showing sessions this month vs. monthly goal, current streak, and next booked class. Pull to refresh.
- **Session history** — 200 records with infinite scroll and pull to refresh. FlatList tuned for mid-range Android (`getItemLayout`, `removeClippedSubviews`, memoized rows).
- **Book a class** — Upcoming classes with spots left. Full classes shown as disabled with a "Full" label. Idempotent booking: one intent can never become two bookings.

## How to Run

### Terminal 1 — Mock API

```bash
cd mock-api
node server.mjs
```

The API runs on `http://localhost:4000`.

### Terminal 2 — App

```bash
npm install
npm start
```

### API base URL

The app reads `EXPO_PUBLIC_API_BASE_URL` for the API base URL. Defaults to `http://10.0.2.2:4000` (Android emulator).

- Android emulator → `http://10.0.2.2:4000` (default)
- iOS simulator → `http://localhost:4000` — set `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000`
- Physical device → your machine's LAN IP, e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:4000`

### Sign in

| Email | Password |
|---|---|
| `member@riverside.example` | `Passw0rd!` |

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native + Expo (SDK 53) |
| Routing | Expo Router (file-based) |
| State | Redux Toolkit + RTK Query |
| Auth | expo-secure-store + expo-local-authentication |
| Styling | StyleSheet + design tokens |
| Language | TypeScript (strict) |
| Testing | Jest + React Native Testing Library |

## Architecture

```
app/
  _layout.tsx              # Root: StoreProvider, I18nProvider, AuthGate
  (auth)/login.tsx         # Sign-in screen
  (app)/_layout.tsx        # Bottom tabs (Home, Sessions, Book)
  (app)/home.tsx           # Home — progress ring, streak, next class
  (app)/sessions.tsx       # Session history — infinite scroll
  (app)/book.tsx           # Book a class — idempotent booking flow
src/
  app/store.ts             # RTK store
  features/
    auth/                  # authSlice, biometric hook, AuthGate
  shared/
    api/                   # baseQuery, rscApi (RTK Query), types
    i18n/                  # translations, I18nProvider, formatters
    ui/                    # ProgressRing, Button, StatusBadge, ThemedText
    theme/                 # design tokens
    hooks/                 # typed redux hooks
mock-api/                  # self-contained mock API server
```

## Booking Idempotency

The booking endpoint (`POST /api/me/bookings`) requires an `Idempotency-Key` header. Sending the same key twice returns the original booking instead of making a second one.

The client guarantees one intent = one key:

1. When the confirm sheet opens, a UUID is generated and stored in a `useRef`.
2. The Confirm button is disabled immediately on tap (in-flight state).
3. On timeout/network error, "Try again" reuses the **same** key from the ref — a retry can never create a second booking.
4. On success, the ref is cleared and the confirmation screen shows the booking reference.
5. Dismissing the sheet and opening confirm again generates a **new** key — booking the same class twice deliberately is allowed.

Even if two taps slip through before the disabled state paints, both use the same ref key, so the server deduplicates.

## Testing

```bash
npm test
```

Tests cover:
- **Booking idempotency** — one tap → one booking; timeout + retry → no double booking; two rapid taps → one booking; new intent → new key → second booking allowed; missing key → 400; full class → 422.
- **Biometric gate** — not available → skip; cancel/fail → lock screen; success → enter; sign out clears state.
- **Auth persistence** — setAuth, signOut, setAuthFromStorage.
- **Sessions pagination** — merge appends without duplicates; hasMore logic; refresh resets to page 1.

## Design System

- **Colors**: Primary `#2B5AA7`, ink, line, success/warning/danger.
- **Type**: display (32/650), h1 (24/650), h2 (19/650), body (16/400), small (14/400), label (11/600).
- **Spacing**: 8pt grid (1=4px, 2=8px, 3=12px, 4=16px, 5=24px). Min tap target 44×44.
- **Status never by colour alone** — every status badge pairs its colour with a label and a shape (circle, square, triangle).
- **Bilingual en/ar + RTL**: `I18nManager.forceRTL`, logical properties, flipped chevrons/ring fill, `Intl.DateTimeFormat`/`Intl.NumberFormat` with `ar-SA`.
