import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

/* GET /api/admin/stats — dashboard KPIs */
router.get('/stats', (req, res) => {
  const totalOrders   = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='pending'").get().c;
  const revenue       = db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status!='cancelled'").get().s;
  const totalUsers    = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='customer'").get().c;
  const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE is_active=1").get().c;
  const lowStock      = db.prepare("SELECT COUNT(*) as c FROM products WHERE stock<=5 AND is_active=1").get().c;

  // Revenue last 7 days
  const revenueByDay = db.prepare(`
    SELECT date(created_at) as day, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status!='cancelled' AND created_at >= date('now','-7 days')
    GROUP BY day ORDER BY day
  `).all();

  // Top products by order count
  const topProducts = db.prepare(`
    SELECT p.id, p.name, p.category, SUM(oi.quantity) as units_sold, SUM(oi.quantity*oi.unit_price) as revenue
    FROM order_items oi JOIN products p ON p.id=oi.product_id
    GROUP BY p.id ORDER BY units_sold DESC LIMIT 5
  `).all();

  // Orders by status
  const ordersByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();

  // Sales by category
  const salesByCategory = db.prepare(`
    SELECT p.category, SUM(oi.quantity*oi.unit_price) as revenue
    FROM order_items oi JOIN products p ON p.id=oi.product_id
    GROUP BY p.category ORDER BY revenue DESC
  `).all();

  res.json({ totalOrders, pendingOrders, revenue, totalUsers, totalProducts, lowStock, revenueByDay, topProducts, ordersByStatus, salesByCategory });
});

/* GET /api/admin/orders — all orders with filters */
router.get('/orders', (req, res) => {
  const { status, q, page = 1, limit = 20 } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset   = (pageNum - 1) * limitNum;

  let where = [];
  const params = [];
  if (status) { where.push("o.status=?"); params.push(status); }
  if (q)      { where.push("(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total  = db.prepare(`SELECT COUNT(*) as c FROM orders o JOIN users u ON u.id=o.user_id ${whereSQL}`).get(...params).c;
  const orders = db.prepare(`SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON u.id=o.user_id ${whereSQL} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  res.json({ orders, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

/* GET /api/admin/products — all products including inactive */
router.get('/products', (req, res) => {
  const { q, category, page = 1, limit = 20 } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset   = (pageNum - 1) * limitNum;

  let where = [];
  const params = [];
  if (q)        { where.push("(name LIKE ? OR brand LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push("category=?"); params.push(category); }
  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total    = db.prepare(`SELECT COUNT(*) as c FROM products ${whereSQL}`).get(...params).c;
  const products = db.prepare(`SELECT * FROM products ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  res.json({ products: products.map(p => ({ ...p, sizes: JSON.parse(p.sizes), colors: JSON.parse(p.colors), images: JSON.parse(p.images) })), total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

/* GET /api/admin/analytics — time-series data */
router.get('/analytics', (req, res) => {
  const { period = '30d' } = req.query;
  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const days = daysMap[period] || 30;

  const revenue = db.prepare(`
    SELECT date(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
    FROM orders WHERE status!='cancelled' AND created_at >= date('now','-${days} days')
    GROUP BY date ORDER BY date
  `).all();

  const categoryRevenue = db.prepare(`
    SELECT p.category, SUM(oi.quantity*oi.unit_price) as revenue, SUM(oi.quantity) as units
    FROM order_items oi JOIN products p ON p.id=oi.product_id
    JOIN orders o ON o.id=oi.order_id
    WHERE o.status!='cancelled' AND o.created_at >= date('now','-${days} days')
    GROUP BY p.category
  `).all();

  const newUsers = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM users WHERE created_at >= date('now','-${days} days')
    GROUP BY date ORDER BY date
  `).all();

  const topProducts = db.prepare(`
    SELECT p.id, p.name, p.category, SUM(oi.quantity) as units, SUM(oi.quantity*oi.unit_price) as revenue
    FROM order_items oi JOIN products p ON p.id=oi.product_id
    JOIN orders o ON o.id=oi.order_id
    WHERE o.status!='cancelled' AND o.created_at >= date('now','-${days} days')
    GROUP BY p.id ORDER BY revenue DESC LIMIT 10
  `).all();

  res.json({ revenue, categoryRevenue, newUsers, topProducts, period });
});

/* GET /api/admin/inventory — low stock report */
router.get('/inventory', (req, res) => {
  const { threshold = 20 } = req.query;
  const products = db.prepare(`
    SELECT id, name, category, brand, stock, price, is_active FROM products
    WHERE is_active=1 ORDER BY stock ASC
  `).all();
  res.json({ products, low_stock: products.filter(p => p.stock <= parseInt(threshold)) });
});

export default router;
