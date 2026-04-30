import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
}

/* POST /api/auth/register */
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (name,email,password,phone) VALUES (?,?,?,?)').run(name, email, hash, phone || null);
  const user = db.prepare('SELECT id,name,email,role,phone,created_at FROM users WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user });
});

/* POST /api/auth/login */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ token: signToken(safeUser), user: safeUser });
});

/* GET /api/auth/me */
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,avatar,created_at FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/* PUT /api/auth/me */
router.put('/me', authenticate, (req, res) => {
  const { name, phone, avatar } = req.body;
  db.prepare('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), avatar=COALESCE(?,avatar) WHERE id=?')
    .run(name || null, phone || null, avatar || null, req.user.id);
  const user = db.prepare('SELECT id,name,email,role,phone,avatar,created_at FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

/* PUT /api/auth/change-password */
router.put('/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password too short' });

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
  res.json({ message: 'Password updated successfully' });
});

/* POST /api/auth/forgot-password */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  // Always return success to not reveal whether email exists
  const token = user ? jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' }) : null;
  res.json({ message: 'If that email exists, a reset link has been sent.', resetToken: token });
});

/* POST /api/auth/reset-password */
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPassword, 10), id);
    res.json({ message: 'Password reset successfully' });
  } catch {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

export default router;
