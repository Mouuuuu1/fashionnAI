import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, ADMIN, CUSTOMER } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

describe('GET /api/admin/stats', () => {
  it('returns dashboard KPIs for an admin', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/stats')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBeDefined();
    expect(res.body.revenue).toBeDefined();
    expect(res.body.totalUsers).toBeDefined();
    expect(res.body.topProducts).toBeDefined();
  });

  it('returns 403 for a regular customer', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app).get('/api/admin/stats').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/orders', () => {
  it('returns all orders with customer info', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/orders')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders[0].customer_name).toBeDefined();
  });

  it('filters by status', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/orders?status=processing')
      .set(bearer(token));

    expect(res.status).toBe(200);
    res.body.orders.forEach(o => expect(o.status).toBe('processing'));
  });
});

describe('GET /api/admin/products', () => {
  it('returns all products including inactive ones', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/products')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.total).toBeDefined();
  });
});

describe('GET /api/admin/analytics', () => {
  it('returns time-series revenue data', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/analytics?period=30d')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.revenue)).toBe(true);
    expect(res.body.period).toBe('30d');
  });
});

describe('GET /api/admin/inventory', () => {
  it('returns the full product inventory', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/admin/inventory')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(Array.isArray(res.body.low_stock)).toBe(true);
  });
});
