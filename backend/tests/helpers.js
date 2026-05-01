import request from 'supertest';
import app from '../server.js';

export { request, app };

export async function loginAs(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const ADMIN    = { email: 'admin@fashionai.com',  password: 'admin123' };
export const CUSTOMER = { email: 'sara@example.com',     password: 'password123' };
export const CUSTOMER2 = { email: 'ahmed@example.com',   password: 'password123' };
