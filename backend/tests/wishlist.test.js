import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, CUSTOMER, CUSTOMER2 } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

describe('GET /api/wishlist', () => {
  it('returns the user\'s wishlist items', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .get('/api/wishlist')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].product).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });

  it('does not return another user\'s wishlist', async () => {
    const token = await loginAs(CUSTOMER2.email, CUSTOMER2.password);
    const res = await request(app).get('/api/wishlist').set(bearer(token));

    expect(res.status).toBe(200);
    const saraProductIds = [1, 2, 11];
    res.body.forEach(w =>
      expect(saraProductIds).not.toContain(w.product.id)
    );
  });
});

describe('POST /api/wishlist', () => {
  it('adds a product to the wishlist', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/wishlist')
      .set(bearer(token))
      .send({ product_id: 7 });

    expect(res.status).toBe(201);
    const added = res.body.find(w => w.product.id === 7);
    expect(added).toBeDefined();
  });

  it('is idempotent — adding the same product twice does not duplicate', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    await request(app).post('/api/wishlist').set(bearer(token)).send({ product_id: 8 });
    await request(app).post('/api/wishlist').set(bearer(token)).send({ product_id: 8 });

    const res = await request(app).get('/api/wishlist').set(bearer(token));
    const count = res.body.filter(w => w.product.id === 8).length;
    expect(count).toBe(1);
  });

  it('returns 400 when product_id is missing', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/wishlist')
      .set(bearer(token))
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/wishlist')
      .send({ product_id: 1 });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/wishlist/:productId', () => {
  it('removes a product from the wishlist', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    const before = await request(app).get('/api/wishlist').set(bearer(token));
    const productId = before.body[0].product.id;

    const res = await request(app)
      .delete(`/api/wishlist/${productId}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    const still = res.body.find(w => w.product.id === productId);
    expect(still).toBeUndefined();
  });
});
