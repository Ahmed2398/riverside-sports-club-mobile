# Riverside Sports Club — Mock API

A small local API for the task. Zero dependencies, Node 18+.

```bash
node server.mjs
```

→ `http://localhost:4000`. Use `PORT=5000 node server.mjs` to change the port.

The dataset is **deterministic** — 2,000 members, identical on every run. Restarting the
server resets any bookings you created.

Two things are intentional, not bugs:

- **Every endpoint is slow** (250–900 ms). This is a real network, not an instant fixture.
- **`GET /api/club/summary` fails roughly 15% of the time** with a 500.

## Sign-in

| Role | Email | Password |
|---|---|---|
| Club admin (web task) | `admin@riverside.example` | `Passw0rd!` |
| Member (mobile task) | `member@riverside.example` | `Passw0rd!` |

`POST /api/auth/login` → `{ token, user }`. Every other endpoint needs
`Authorization: Bearer <token>` and returns `401` without it.

## Routes

### Web task

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/club/summary` | **Fails ~15% of the time** |
| `GET` | `/api/club/members` | `page`, `per_page` (max 100), `search`, `tier`, `status`, `sort`, `dir` |
| `GET` | `/api/club/members/:id` | Full record, including confidential fields |
| `GET` | `/api/club/members/:id/sessions` | `page`, `per_page` |

`tier`: `basic`, `standard`, `premium`. `status`: `active`, `paused`, `expired`.
`sort`: `name`, `sessionsThisMonth`, `totalSessions`, `joinedAt`.

### Mobile task

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/me/progress` | Sessions this month, monthly goal, streak, next class |
| `GET` | `/api/me/sessions` | 200 records, paginated |
| `GET` | `/api/classes` | 8 upcoming classes; some have `spotsLeft: 0` |
| `POST` | `/api/me/bookings` | Requires an `Idempotency-Key` header |

`POST /api/me/bookings` takes `{ "classId": "CLS-100" }` and **requires** a unique
`Idempotency-Key` header. Sending the same key twice returns the original booking instead of
making a second one — and does not consume another spot. Sending no key returns `400`.

## Shapes

List responses are paginated:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 25, "total": 2000, "last_page": 80 }
}
```

Names are bilingual — `{ "ar": "...", "en": "..." }`.

Errors:

```json
{ "message": "That class is full.", "code": "VALIDATION_ERROR",
  "errors": { "classId": ["That class is full."] } }
```

## Reaching it from a simulator or device

`localhost` does not resolve to your machine from a phone or Android emulator.

- Android emulator → `http://10.0.2.2:4000`
- iOS simulator → `http://localhost:4000` works
- Physical device → your machine's LAN IP, e.g. `http://192.168.1.20:4000`

Put the base URL in an environment variable rather than hardcoding it.
