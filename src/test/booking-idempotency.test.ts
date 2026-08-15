/**
 * Booking idempotency tests — the most critical part of the app.
 *
 * One intent must never become two bookings.
 * The API's Idempotency-Key header guarantees this server-side;
 * the client must generate one key per intent and reuse it across retries.
 */
import { v4 as uuidv4 } from 'uuid';

// Simulate the server's idempotency map
function createMockServer() {
  const bookings = new Map<string, any>();
  let spotsLeft = 3;

  function handle({ url, method, body, headers }: any) {
    if (url === '/api/auth/login' && method === 'POST') {
      return {
        status: 200,
        data: {
          token: 'test-token',
          user: { id: 42, name: { ar: 'عضو', en: 'Member' }, email: 'member@test', role: 'member' },
        },
      };
    }
    if (url === '/api/classes' && method === 'GET') {
      return {
        status: 200,
        data: {
          data: [
            { id: 'CLS-100', name: { ar: 'يوغا', en: 'Yoga' }, startsAt: '2026-08-13T06:30:00Z', durationMinutes: 60, coach: 'Coach A', capacity: 12, spotsLeft },
          ],
        },
      };
    }
    if (url === '/api/me/bookings' && method === 'POST') {
      const key = headers['Idempotency-Key'];
      if (!key) {
        return { status: 400, data: { message: 'Idempotency-Key required', code: 'IDEMPOTENCY_KEY_REQUIRED' } };
      }
      if (bookings.has(key)) {
        // Replay — return original, don't consume another spot
        return { status: 200, data: bookings.get(key) };
      }
      if (spotsLeft <= 0) {
        return { status: 422, data: { message: 'That class is full.', code: 'VALIDATION_ERROR' } };
      }
      spotsLeft -= 1;
      const result = {
        data: {
          id: `BKG-${100000 + bookings.size + 1}`,
          classId: (body as any).classId,
          className: { ar: 'يوغا', en: 'Yoga' },
          startsAt: '2026-08-13T06:30:00Z',
          coach: 'Coach A',
          status: 'confirmed' as const,
          bookedAt: new Date().toISOString(),
        },
      };
      bookings.set(key, result);
      return { status: 201, data: result };
    }
    return { status: 404, data: { message: 'Not found', code: 'NOT_FOUND' } };
  }

  return {
    handle,
    getSpotsLeft: () => spotsLeft,
    getBookingsCount: () => bookings.size,
    getBookings: () => Array.from(bookings.values()),
  };
}

describe('Booking idempotency', () => {
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    mockServer = createMockServer();
  });

  test('one Confirm tap → one booking, one spot consumed', async () => {
    const key = uuidv4();
    const response1 = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': key },
    });

    expect(response1.status).toBe(201);
    expect(mockServer.getBookingsCount()).toBe(1);
    expect(mockServer.getSpotsLeft()).toBe(2);
  });

  test('timeout then retry with same key → original booking returned, no second spot consumed', async () => {
    const key = uuidv4();

    // First attempt — simulate timeout (no booking recorded on server)
    // In reality, the request may have reached the server. The key is the same.
    // If the first request DID reach the server, the retry returns the original.
    // If the first request did NOT reach the server, the retry creates the booking.
    // Either way, only one booking exists.

    // Simulate: first request reaches server, creates booking
    const response1 = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': key },
    });
    expect(response1.status).toBe(201);

    // Retry with same key — server returns original, no new spot consumed
    const response2 = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': key },
    });
    expect(response2.status).toBe(200);
    expect((response2.data as any).data.id).toBe((response1.data as any).data.id);

    expect(mockServer.getBookingsCount()).toBe(1);
    expect(mockServer.getSpotsLeft()).toBe(2);
  });

  test('two rapid taps with same key → one booking', async () => {
    const key = uuidv4();

    // Both taps use the same key (from the same ref)
    const [response1, response2] = await Promise.all([
      mockServer.handle({
        url: '/api/me/bookings',
        method: 'POST',
        body: { classId: 'CLS-100' },
        headers: { 'Idempotency-Key': key },
      }),
      mockServer.handle({
        url: '/api/me/bookings',
        method: 'POST',
        body: { classId: 'CLS-100' },
        headers: { 'Idempotency-Key': key },
      }),
    ]);

    // One succeeds (201), the other gets the replay (200)
    const statuses = [response1.status, response2.status].sort();
    expect(statuses).toEqual([200, 201]);

    expect(mockServer.getBookingsCount()).toBe(1);
    expect(mockServer.getSpotsLeft()).toBe(2);
  });

  test('new intent (dismiss + re-open) → new key → second booking allowed', async () => {
    const key1 = uuidv4();
    const key2 = uuidv4();

    const response1 = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': key1 },
    });
    expect(response1.status).toBe(201);

    const response2 = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': key2 },
    });
    expect(response2.status).toBe(201);

    expect(mockServer.getBookingsCount()).toBe(2);
    expect(mockServer.getSpotsLeft()).toBe(1);
    expect((response2.data as any).data.id).not.toBe((response1.data as any).data.id);
  });

  test('missing Idempotency-Key → 400', async () => {
    const response = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: {},
    });
    expect(response.status).toBe(400);
  });

  test('full class → 422 validation error', async () => {
    // Consume all spots
    for (let i = 0; i < 3; i++) {
      await mockServer.handle({
        url: '/api/me/bookings',
        method: 'POST',
        body: { classId: 'CLS-100' },
        headers: { 'Idempotency-Key': uuidv4() },
      });
    }
    expect(mockServer.getSpotsLeft()).toBe(0);

    const response = await mockServer.handle({
      url: '/api/me/bookings',
      method: 'POST',
      body: { classId: 'CLS-100' },
      headers: { 'Idempotency-Key': uuidv4() },
    });
    expect(response.status).toBe(422);
    expect((response.data as any).code).toBe('VALIDATION_ERROR');
  });
});
