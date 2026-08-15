/**
 * Riverside Sports Club — Mock API
 * Zero dependencies. Requires Node 18+.
 *
 *   node server.mjs            # http://localhost:4000
 *   PORT=5000 node server.mjs
 *
 * Data is deterministic: every candidate gets the exact same dataset.
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT || 4000);
const TOKEN = 'rsc_demo_token_9f2c41a7b8';

/* ------------------------------------------------------------------ *
 * Deterministic seed data (no Math.random — same output every run)
 * ------------------------------------------------------------------ */

let _s = 1337;
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));

const AR_FIRST = ['محمد', 'أحمد', 'فاطمة', 'نورة', 'عبدالله', 'سارة', 'خالد', 'ريم', 'يوسف', 'لمى', 'عمر', 'هند'];
const AR_LAST = ['الغانم', 'العتيبي', 'الشمري', 'القحطاني', 'الحربي', 'الدوسري', 'الزهراني', 'المطيري'];
const EN_FIRST = ['Mohammed', 'Ahmed', 'Fatimah', 'Noura', 'Abdullah', 'Sarah', 'Khalid', 'Reem', 'Yousef', 'Lama', 'Omar', 'Hind'];
const EN_LAST = ['Alghanem', 'Alotaibi', 'Alshammari', 'Alqahtani', 'Alharbi', 'Aldosari', 'Alzahrani', 'Almutairi'];

const TIERS = ['basic', 'basic', 'standard', 'standard', 'premium'];
const STATUSES = ['active', 'active', 'active', 'active', 'paused', 'expired'];
const NOTES = [
  'Recovering from a knee injury — no high-impact classes.',
  'Asthma; keeps an inhaler in locker 42.',
  'Prefers female-only sessions.',
  'Cleared for all activity.',
  'Lower back strain, avoid heavy lifting.',
];

const MEMBERS = Array.from({ length: 2000 }, (_, i) => {
  const n = int(0, AR_FIRST.length - 1);
  const l = int(0, AR_LAST.length - 1);
  const goal = [8, 12, 16, 20][int(0, 3)];
  return {
    id: i + 1,
    memberNumber: `RSC-${String(i + 1).padStart(5, '0')}`,
    name: { ar: `${AR_FIRST[n]} ${AR_LAST[l]}`, en: `${EN_FIRST[n]} ${EN_LAST[l]}` },
    email: `${EN_FIRST[n].toLowerCase()}.${EN_LAST[l].toLowerCase()}${i + 1}@example.com`,
    tier: pick(TIERS),
    status: pick(STATUSES),
    joinedAt: `20${int(21, 25)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
    sessionsThisMonth: int(0, 20),
    monthlyGoal: goal,
    totalSessions: int(12, 480),
    // Confidential fields — see README.
    phone: `+9665${int(10000000, 99999999)}`,
    emergencyContact: { name: `${EN_FIRST[int(0, EN_FIRST.length - 1)]} ${EN_LAST[l]}`, phone: `+9665${int(10000000, 99999999)}` },
    medicalNotes: pick(NOTES),
  };
});

const CLASS_NAMES = [
  { ar: 'يوغا للمبتدئين', en: 'Beginner Yoga' },
  { ar: 'تدريب متقاطع', en: 'CrossFit' },
  { ar: 'سباحة', en: 'Swimming' },
  { ar: 'ملاكمة', en: 'Boxing' },
  { ar: 'دراجات ثابتة', en: 'Spin Class' },
  { ar: 'بيلاتس', en: 'Pilates' },
  { ar: 'كرة سلة', en: 'Basketball' },
  { ar: 'تمارين قوة', en: 'Strength Training' },
];

const sessionsFor = (member, count) =>
  Array.from({ length: count }, (_, k) => {
    const d = new Date(Date.UTC(2026, 7, 10));
    d.setUTCDate(d.getUTCDate() - k * 2);
    const c = CLASS_NAMES[k % CLASS_NAMES.length];
    return {
      id: `${member.id}-${k}`,
      date: d.toISOString().slice(0, 10),
      className: c,
      durationMinutes: [45, 60, 60, 90][k % 4],
      coach: `${EN_FIRST[(k * 3) % EN_FIRST.length]} ${EN_LAST[(k * 5) % EN_LAST.length]}`,
      status: k === 0 ? 'upcoming' : 'attended',
    };
  });

/* ------------------------------------------------------------------ *
 * The signed-in member (mobile task)
 * ------------------------------------------------------------------ */

const ME = { ...MEMBERS[41], sessionsThisMonth: 11, monthlyGoal: 16, totalSessions: 214 };
const MY_SESSIONS = sessionsFor(ME, 200);

// Bookable upcoming classes
const CLASSES = CLASS_NAMES.map((c, i) => {
  const d = new Date(Date.UTC(2026, 7, 13));
  d.setUTCDate(d.getUTCDate() + i);
  const capacity = [12, 20, 16, 10, 24, 14, 20, 18][i];
  return {
    id: `CLS-${100 + i}`,
    name: c,
    startsAt: `${d.toISOString().slice(0, 10)}T${String(6 + i).padStart(2, '0')}:30:00Z`,
    durationMinutes: [60, 45, 60, 45, 45, 60, 90, 60][i],
    coach: `${EN_FIRST[i]} ${EN_LAST[i % EN_LAST.length]}`,
    capacity,
    spotsLeft: [3, 0, 7, 1, 11, 5, 2, 9][i],
  };
});

const BOOKINGS = new Map(); // Idempotency-Key -> response body

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

const authed = (req) => req.headers.authorization === `Bearer ${TOKEN}`;

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
    });
  });
}

function paginate(rows, url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page') || 25)));
  const start = (page - 1) * perPage;
  return {
    data: rows.slice(start, start + perPage),
    meta: { page, per_page: perPage, total: rows.length, last_page: Math.max(1, Math.ceil(rows.length / perPage)) },
  };
}

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') return send(res, 204, {});

  // Every endpoint is deliberately slow, like a real network.
  // Request-time randomness uses Math.random so it can never perturb seed data.
  await sleep(250 + Math.floor(Math.random() * 650));

  // ---- Auth ----
  if (req.method === 'POST' && path === '/api/auth/login') {
    const { email, password } = await readBody(req);
    if (email === 'admin@riverside.example' && password === 'Passw0rd!') {
      return send(res, 200, {
        token: TOKEN,
        user: { id: 1, name: { ar: 'مدير النادي', en: 'Club Administrator' }, email, role: 'admin' },
      });
    }
    if (email === 'member@riverside.example' && password === 'Passw0rd!') {
      return send(res, 200, { token: TOKEN, user: { id: ME.id, name: ME.name, email, role: 'member' } });
    }
    return send(res, 401, { message: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
  }

  // ---- Everything below requires a valid token ----
  if (!authed(req)) return send(res, 401, { message: 'Unauthenticated.', code: 'UNAUTHENTICATED' });

  // ---- Web: club summary (intermittently fails on purpose) ----
  if (req.method === 'GET' && path === '/api/club/summary') {
    if (Math.random() < 0.15) {
      return send(res, 500, { message: 'Summary service temporarily unavailable.', code: 'UPSTREAM_ERROR' });
    }
    const active = MEMBERS.filter((m) => m.status === 'active');
    return send(res, 200, {
      totalMembers: MEMBERS.length,
      activeMembers: active.length,
      sessionsThisMonth: active.reduce((s, m) => s + m.sessionsThisMonth, 0),
      averageSessionsPerMember: Number((active.reduce((s, m) => s + m.sessionsThisMonth, 0) / active.length).toFixed(1)),
      changeVsLastMonth: 4.7,
    });
  }

  // ---- Web: member list (server-side search / filter / sort / pagination) ----
  if (req.method === 'GET' && path === '/api/club/members') {
    let rows = MEMBERS;

    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (m) =>
          m.name.en.toLowerCase().includes(search) ||
          m.name.ar.includes(search) ||
          m.memberNumber.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search)
      );
    }

    const tier = url.searchParams.get('tier');
    if (tier) rows = rows.filter((m) => m.tier === tier);

    const status = url.searchParams.get('status');
    if (status) rows = rows.filter((m) => m.status === status);

    const sort = url.searchParams.get('sort');
    if (sort) {
      const dir = url.searchParams.get('dir') === 'desc' ? -1 : 1;
      const key = (m) => (sort === 'name' ? m.name.en : m[sort]);
      rows = [...rows].sort((a, b) => (key(a) > key(b) ? dir : key(a) < key(b) ? -dir : 0));
    }

    // The list endpoint returns only what a list needs.
    const page = paginate(rows, url);
    page.data = page.data.map((m) => ({
      id: m.id,
      memberNumber: m.memberNumber,
      name: m.name,
      tier: m.tier,
      status: m.status,
      sessionsThisMonth: m.sessionsThisMonth,
      monthlyGoal: m.monthlyGoal,
      totalSessions: m.totalSessions,
    }));
    return send(res, 200, page);
  }

  // ---- Web: single member (includes confidential fields) ----
  let m = path.match(/^\/api\/club\/members\/(\d+)$/);
  if (req.method === 'GET' && m) {
    const found = MEMBERS.find((x) => x.id === Number(m[1]));
    if (!found) return send(res, 404, { message: 'Member not found.', code: 'NOT_FOUND' });
    return send(res, 200, { data: found });
  }

  m = path.match(/^\/api\/club\/members\/(\d+)\/sessions$/);
  if (req.method === 'GET' && m) {
    const found = MEMBERS.find((x) => x.id === Number(m[1]));
    if (!found) return send(res, 404, { message: 'Member not found.', code: 'NOT_FOUND' });
    return send(res, 200, paginate(sessionsFor(found, int(20, 60)), url));
  }

  // ---- Mobile: my progress ----
  if (req.method === 'GET' && path === '/api/me/progress') {
    return send(res, 200, {
      data: {
        name: ME.name,
        memberNumber: ME.memberNumber,
        tier: ME.tier,
        sessionsThisMonth: ME.sessionsThisMonth,
        monthlyGoal: ME.monthlyGoal,
        totalSessions: ME.totalSessions,
        currentStreakDays: 6,
        nextClass: { name: CLASSES[0].name, startsAt: CLASSES[0].startsAt },
      },
    });
  }

  if (req.method === 'GET' && path === '/api/me/sessions') {
    return send(res, 200, paginate(MY_SESSIONS, url));
  }

  // ---- Mobile: bookable classes ----
  if (req.method === 'GET' && path === '/api/classes') {
    return send(res, 200, { data: CLASSES });
  }

  // ---- Mobile: book a class (idempotent) ----
  if (req.method === 'POST' && path === '/api/me/bookings') {
    const key = req.headers['idempotency-key'];
    if (!key) {
      return send(res, 400, { message: 'Idempotency-Key header is required.', code: 'IDEMPOTENCY_KEY_REQUIRED' });
    }
    if (BOOKINGS.has(key)) {
      return send(res, 200, BOOKINGS.get(key)); // replayed, not duplicated
    }

    const body = await readBody(req);
    const cls = CLASSES.find((c) => c.id === body.classId);
    if (!cls) {
      return send(res, 422, {
        message: 'Choose a class.',
        code: 'VALIDATION_ERROR',
        errors: { classId: ['That class does not exist.'] },
      });
    }
    if (cls.spotsLeft <= 0) {
      return send(res, 422, {
        message: 'That class is full.',
        code: 'VALIDATION_ERROR',
        errors: { classId: ['That class is full.'] },
      });
    }

    cls.spotsLeft -= 1;
    const result = {
      data: {
        id: `BKG-${100000 + BOOKINGS.size + 1}`,
        classId: cls.id,
        className: cls.name,
        startsAt: cls.startsAt,
        coach: cls.coach,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
      },
    };
    BOOKINGS.set(key, result);
    return send(res, 201, result);
  }

  send(res, 404, { message: `No route for ${req.method} ${path}`, code: 'NOT_FOUND' });
});

server.listen(PORT, () => {
  console.log(`\n  Riverside Sports Club mock API → http://localhost:${PORT}`);
  console.log(`  ${MEMBERS.length} members seeded. See README.md for routes.\n`);
});
