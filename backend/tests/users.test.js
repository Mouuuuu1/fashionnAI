import { describe, it, expect, beforeAll } from 'vitest';
import { request, app, loginAs, bearer, ADMIN, CUSTOMER } from './helpers.js';
import { reseedForTests } from '../database.js';

beforeAll(() => reseedForTests());

describe('GET /api/users (admin)', () => {
  it('returns a list of all users', async () => {
    const token = await loginAs(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .get('/api/users')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach(u => expect(u.password).toBeUndefined());
  });

  it('returns 403 for a regular customer', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app).get('/api/users').set(bearer(token));
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/me (update profile)', () => {
  it('updates the user\'s name', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .put('/api/auth/me')
      .set(bearer(token))
      .send({ name: 'Sara Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Sara Updated');
  });
});

describe('GET /api/users/addresses', () => {
  it('returns saved addresses for the authenticated user', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .get('/api/users/addresses')
      .set(bearer(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('POST /api/users/addresses', () => {
  it('creates a new address', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/users/addresses')
      .set(bearer(token))
      .send({
        label: 'Home',
        first_name: 'Sara',
        last_name: 'Mohamed',
        street: '5 New Street',
        city: 'Cairo',
        governorate: 'Cairo',
        phone: '+20 100 000 0000',
      });

    expect(res.status).toBe(201);
    expect(res.body.street).toBe('5 New Street');
  });

  it('returns 400 when required fields are missing', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .post('/api/users/addresses')
      .set(bearer(token))
      .send({ label: 'Incomplete' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/addresses/:id', () => {
  it('deletes an address belonging to the user', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);

    const list = await request(app).get('/api/users/addresses').set(bearer(token));
    const addrId = list.body[0].id;

    const res = await request(app)
      .delete(`/api/users/addresses/${addrId}`)
      .set(bearer(token));

    expect(res.status).toBe(200);
  });

  it('returns 404 for an address that does not exist', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .delete('/api/users/addresses/99999')
      .set(bearer(token));

    expect(res.status).toBe(404);
  });
});

// Password change tests run last because they mutate CUSTOMER's password
describe('PUT /api/auth/change-password', () => {
  it('changes the password with correct current password', async () => {
    const token = await loginAs(CUSTOMER.email, CUSTOMER.password);
    const res = await request(app)
      .put('/api/auth/change-password')
      .set(bearer(token))
      .send({ currentPassword: CUSTOMER.password, newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
  });

  it('rejects an incorrect current password', async () => {
    // Password is now 'newpassword123' from the previous test; login with that
    const token = await loginAs(CUSTOMER.email, 'newpassword123');
    const res = await request(app)
      .put('/api/auth/change-password')
      .set(bearer(token))
      .send({ currentPassword: 'wrongpass', newPassword: 'doesnotmatter' });

    expect(res.status).toBe(401);
  });
});
