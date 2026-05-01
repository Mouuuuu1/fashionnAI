import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, CUSTOMER, CUSTOMER2, ADMIN } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

const shippingAddress = {
  name: 'Sara Mohamed',
  street: '15 Nile Street, Dokki',
  city: 'Giza',
  postal_code: '12311',
  phone: '+20 123 456 7890',
};

describe('GET /api/orders', () => {
  it('returns the current user\'s orders', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .get('/api/orders')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('does not return another user\'s orders', async () => {
    const token = await loginAs(CUSTOMER2.email, CUSTOMER2.password);
    const res = await request(app).get('/api/orders').set(bearer(token));

    expect(res.status).toBe(200);
    const sara_id = 2;
    res.body.orders.forEach(o => expect(o.user_id).not.toBe(sara_id));
  });
});

describe('GET /api/orders/:id', () => {
  it('returns the order with its items', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const list = await request(app).get('/api/orders').set(bearer(token));
    const orderId = list.body.orders[0].id;

    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('returns 404 for another user\'s order', async () => {
    const token = await loginAs(CUSTOMER2.email, CUSTOMER2.password);
    const res = await request(app)
      .get('/api/orders/1')
      .set(bearer(token));

    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders', () => {
  it('places an order from the cart and clears it', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    const cartBefore = await request(app).get('/api/cart').set(bearer(token));
    expect(cartBefore.body.item_count).toBeGreaterThan(0);

    const res = await request(app)
      .post('/api/orders')
      .set(bearer(token))
      .send({ shipping_address: shippingAddress, payment_method: 'card' });

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.order_number).toMatch(/^FAI-/);

    const cartAfter = await request(app).get('/api/cart').set(bearer(token));
    expect(cartAfter.body.item_count).toBe(0);
  });

  it('returns 422 when the cart is empty', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/orders')
      .set(bearer(token))
      .send({ shipping_address: shippingAddress });

    expect(res.status).toBe(422);
  });

  it('returns 400 when shipping_address is missing', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/orders')
      .set(bearer(token))
      .send({ payment_method: 'cod' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/orders/:id/status', () => {
  it('allows a user to cancel their own pending order', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const orders = await request(app).get('/api/orders').set(bearer(token));
    const pending = orders.body.orders.find(o => o.status === 'processing');

    const res = await request(app)
      .put(`/api/orders/${pending.id}/status`)
      .set(bearer(token))
      .send({ status: 'cancelled' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('prevents a user from setting status to shipped', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const orders = await request(app).get('/api/orders').set(bearer(token));
    const order = orders.body.orders[0];

    const res = await request(app)
      .put(`/api/orders/${order.id}/status`)
      .set(bearer(token))
      .send({ status: 'shipped' });

    expect(res.status).toBe(403);
  });

  it('allows admin to set any status', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .put('/api/orders/3/status')
      .set(bearer(token))
      .send({ status: 'delivered' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });
});
