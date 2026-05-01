import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/* GET /api/users (admin) */
router.get('/', authenticate, requireAdmin, (req, res) => {
  const { q, role, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  let where = [];
  const params = [];
  if (q)    { where.push("(name LIKE ? OR email LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (role) { where.push("role=?"); params.push(role); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as c FROM users ${whereSQL}`).get(...params).c;
  const users = db.prepare(`SELECT id,name,email,role,phone,avatar,created_at FROM users ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  res.json({ users, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

/* GET /api/users/addresses or /api/users/me/addresses (must be before /:id) */
router.get(['/addresses', '/me/addresses'], authenticate, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC').all(req.user.id);
  res.json(addresses);
});

/* POST /api/users/addresses or /api/users/me/addresses */
router.post(['/addresses', '/me/addresses'], authenticate, (req, res) => {
  const { label, first_name, last_name, street, city, governorate, postal_code, phone, is_default } = req.body;
  if (!first_name || !last_name || !street) return res.status(400).json({ error: 'first_name, last_name, street required' });

  if (is_default) db.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').run(req.user.id);

  const result = db.prepare(`
    INSERT INTO addresses (user_id,label,first_name,last_name,street,city,governorate,postal_code,phone,is_default)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(req.user.id, label || 'Home', first_name, last_name, street, city || 'Cairo', governorate || 'Cairo', postal_code || null, phone || null, is_default ? 1 : 0);

  res.status(201).json(db.prepare('SELECT * FROM addresses WHERE id=?').get(result.lastInsertRowid));
});

/* DELETE /api/users/addresses/:id or /api/users/me/addresses/:id */
router.delete(['/addresses/:id', '/me/addresses/:id'], authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM addresses WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Address not found' });
  res.json({ message: 'Address deleted' });
});

/* GET /api/users/:id (admin) */
router.get('/:id', authenticate, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,avatar,created_at FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const orders = db.prepare('SELECT id,order_number,status,total,created_at FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 5').all(user.id);
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders WHERE user_id=?').get(user.id).c;
  const totalSpent = db.prepare('SELECT COALESCE(SUM(total),0) as s FROM orders WHERE user_id=? AND status!=\'cancelled\'').get(user.id).s;

  res.json({ ...user, orders, order_count: orderCount, total_spent: totalSpent });
});

/* PUT /api/users/:id (admin) */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, email, role, phone } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email=? AND id!=?').get(email, req.params.id);
    if (conflict) return res.status(409).json({ error: 'Email already in use' });
  }

  db.prepare('UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), role=COALESCE(?,role), phone=COALESCE(?,phone) WHERE id=?').run(name || null, email || null, role || null, phone || null, req.params.id);
  res.json(db.prepare('SELECT id,name,email,role,phone,avatar,created_at FROM users WHERE id=?').get(req.params.id));
});

/* DELETE /api/users/:id (admin) */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  if (req.params.id == req.user.id) return res.status(403).json({ error: 'Cannot delete your own account' });
  const result = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});

export default router;
