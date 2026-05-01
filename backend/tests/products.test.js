import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, ADMIN, CUSTOMER } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

describe('GET /api/products', () => {
  it('returns a list of products with pagination', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/products?cat=women');

    expect(res.status).toBe(200);
    res.body.products.forEach(p => expect(p.category).toBe('women'));
  });

  it('searches by keyword', async () => {
    const res = await request(app).get('/api/products?q=blazer');

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    res.body.products.forEach(p =>
      expect(p.name.toLowerCase()).toContain('blazer')
    );
  });

  it('returns only sale items when sale=1', async () => {
    const res = await request(app).get('/api/products?sale=1');

    expect(res.status).toBe(200);
    res.body.products.forEach(p => expect(p.sale_price).not.toBeNull());
  });

  it('respects the limit parameter', async () => {
    const res = await request(app).get('/api/products?limit=3');

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(3);
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product with reviews', async () => {
    const res = await request(app).get('/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(Array.isArray(res.body.sizes)).toBe(true);
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  it('returns 404 for a non-existent product', async () => {
    const res = await request(app).get('/api/products/99999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products (admin)', () => {
  it('creates a product when called by admin', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .post('/api/products')
      .set(bearer(token))
      .send({ name: 'Test Product', category: 'women', price: 999 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Product');
    expect(res.body.id).toBeDefined();
  });

  it('returns 403 when called by a regular customer', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/products')
      .set(bearer(token))
      .send({ name: 'Hacked Product', category: 'women', price: 1 });

    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .post('/api/products')
      .set(bearer(token))
      .send({ name: 'No Price' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/products/:id/reviews', () => {
  it('submits a review when authenticated', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/products/5/reviews')
      .set(bearer(token))
      .send({ rating: 5, title: 'Great!', body: 'Loved it.' });

    expect(res.status).toBe(201);
  });

  it('rejects an invalid rating', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/products/3/reviews')
      .set(bearer(token))
      .send({ rating: 10 });

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/products/1/reviews')
      .send({ rating: 4 });

    expect(res.status).toBe(401);
  });
});
