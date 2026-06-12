import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end smoke tests for the Tradewind MVP.
 *
 * Prerequisites: Postgres + Redis running and the database seeded
 * (`docker compose up -d postgres redis` + `npx ts-node prisma/seed.ts`).
 * These boot the real AppModule and hit the real database — they verify the
 * core business flow actually works, not just that the code compiles.
 *
 * Note: the global `api/v1` prefix lives in main.ts (bootstrap), so inside the
 * test app routes are mounted at the root (e.g. `/auth/login`).
 */
describe('Tradewind MVP (e2e smoke)', () => {
  let app: INestApplication;
  let http: any;

  // Seeded accounts (prisma/seed.ts)
  const CLIENT = { email: 'client@tradewind.app', password: 'Client@123!' };
  const CONSULTANT = { email: 'consultant@tradewind.app', password: 'Consult@123!' };
  const ADMIN = { email: 'admin@tradewind.app', password: 'Admin@123!' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // Mirror the production validation pipe from main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper: call API, unwrap the { success, data } envelope, fail on non-2xx.
  async function api(method: 'get' | 'post' | 'patch', path: string, token?: string, body?: any) {
    let req = request(http)[method](path);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    if (body) req = req.send(body);
    const res = await req;
    if (res.status >= 300) {
      throw new Error(`${method.toUpperCase()} ${path} -> ${res.status}: ${JSON.stringify(res.body)}`);
    }
    return res.body.data;
  }
  const login = async (c: { email: string; password: string }) =>
    (await api('post', '/auth/login', undefined, c)).accessToken as string;

  it('authenticates seeded users and rejects bad credentials', async () => {
    const token = await login(CLIENT);
    expect(typeof token).toBe('string');

    // Use a well-formed (passes DTO validation) but incorrect password so we
    // reach the auth check (401), not input validation (400).
    const bad = await request(http).post('/auth/login').send({ email: CLIENT.email, password: 'wrong-password-123' });
    expect(bad.status).toBe(401);
  });

  it('serves public categories and blocks unauthenticated access to protected routes', async () => {
    const cats = await api('get', '/categories');
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);

    const unauth = await request(http).get('/requests');
    expect(unauth.status).toBe(401);
  });

  it('runs request → offer → order → closed, hides the factory line, and updates rating', async () => {
    // Fresh client each run so the one-review-per-consultant rule never collides
    const email = `e2e_${Date.now()}@tradewind.test`;
    const client = (await api('post', '/auth/register', undefined, {
      email, password: 'E2e@12345', name: 'E2E Client', role: 'client',
    })).accessToken as string;
    const consultant = await login(CONSULTANT);
    const admin = await login(ADMIN);

    const cats = await api('get', '/categories');
    const categoryId = (cats.find((c: any) => c.id === 'cat_electronics') || cats[0]).id;
    const factories = await api('get', '/factories');
    const factoryId = factories.items[0].id;

    // Client request → auto-assigned a consultant
    const req = await api('post', '/requests', client, {
      categoryId, product: 'E2E LED Panel', qty: '500', unit: 'pcs',
    });
    expect(req.consultantId).toBeTruthy();
    expect(req.status).toBe('work');

    // Consultant offer (with factory → opens the hidden factory line)
    const offer = await api('post', '/offers', consultant, {
      requestId: req.id, factoryId, product: req.product, qty: '500', unitPrice: 7, total: 3500,
    });
    expect(offer.status).toBe('pending');

    // Client accepts → order created
    const order = await api('post', `/offers/${offer.id}/accept`, client);
    expect(order.id).toMatch(/^TW-/);

    // Consultant advances the order through the full status machine
    for (const status of ['confirmed', 'production', 'qc', 'shipped', 'transit', 'delivered', 'closed']) {
      await api('patch', `/orders/${order.id}`, consultant, { status });
    }
    const closed = await api('get', `/orders/${order.id}`, consultant);
    expect(closed.status).toBe('closed');

    // Hidden factory line: client must never see a factory-kind thread
    const threads = await api('get', '/messaging/threads', client);
    expect(threads.some((t: any) => t.kind === 'factory')).toBe(false);

    // Review → admin approval → rating recalculated
    const review = await api('post', '/reviews', client, {
      consultantId: req.consultantId, orderId: order.id, rating: 5,
      text: 'Отличный сервис на e2e-тесте: быстро подобрали завод и довели заказ.',
    });
    await api('post', `/reviews/${review.id}/approve`, admin);
    const profile = await api('get', `/consultants/${req.consultantId}`);
    expect(profile.rating).toBeGreaterThan(0);
    expect(profile.reviewsCount).toBeGreaterThan(0);
  });
});
