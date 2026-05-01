import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, CUSTOMER } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

describe('GET /api/cart', () => {
  it('returns the cart for an authenticated user', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .get('/api/cart')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.subtotal).toBeDefined();
    expect(res.body.item_count).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/cart', () => {
  it('adds an item to the cart', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/cart')
      .set(bearer(token))
      .send({ product_id: 1, quantity: 1, size: 'M', color: 'Ivory' });

    expect(res.status).toBe(201);
    const added = res.body.items.find(i => i.product.id === 1);
    expect(added).toBeDefined();
  });

  it('returns 400 when size or color is missing', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/cart')
      .set(bearer(token))
      .send({ product_id: 1, quantity: 1 });

    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/cart')
      .send({ product_id: 1, quantity: 1, size: 'M', color: 'Black' });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/cart/:itemId', () => {
  it('updates the quantity of a cart item', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    const cart = await request(app).get('/api/cart').set(bearer(token));
    const itemId = cart.body.items[0].id;

    const res = await request(app)
      .put(`/api/cart/${itemId}`)
      .set(bearer(token))
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    const updated = res.body.items.find(i => i.id === itemId);
    expect(updated.quantity).toBe(3);
  });

  it('returns 404 for an item that does not belong to the user', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .put('/api/cart/99999')
      .set(bearer(token))
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/cart/:itemId', () => {
  it('removes a cart item', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    const cart = await request(app).get('/api/cart').set(bearer(token));
    const itemId = cart.body.items[0].id;
    const countBefore = cart.body.item_count;

    const res = await request(app)
      .delete(`/api/cart/${itemId}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.item_count).toBeLessThan(countBefore);
  });
});

describe('POST /api/cart/apply-coupon', () => {
  it('applies a valid coupon and returns the discount', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    await request(app).post('/api/cart').set(bearer(token))
      .send({ product_id: 3, quantity: 1, size: 'M', color: 'Blush' });

    const res = await request(app)
      .post('/api/cart/apply-coupon')
      .set(bearer(token))
      .send({ code: 'WELCOME10' });

    expect(res.status).toBe(200);
    expect(res.body.discount).toBeGreaterThan(0);
  });

  it('rejects an invalid coupon code', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/cart/apply-coupon')
      .set(bearer(token))
      .send({ code: 'FAKECODE' });

    expect(res.status).toBe(404);
  });
});
