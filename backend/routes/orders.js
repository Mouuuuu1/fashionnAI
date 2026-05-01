import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

function formatOrder(order) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  return {
    ...order,
    shipping_address: JSON.parse(order.shipping_address),
    items,
  };
}

function nextOrderNumber() {
  const year = new Date().getFullYear();
  const last = db.prepare("SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1").get(`FAI-${year}-%`);
  if (!last) return `FAI-${year}-0001`;
  const n = parseInt(last.order_number.split('-')[2]) + 1;
  return `FAI-${year}-${String(n).padStart(4, '0')}`;
}

/* GET /api/orders — current user's orders */
router.get('/', authenticate, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  let where = 'WHERE user_id=?';
  const params = [req.user.id];
  if (status) { where += ' AND status=?'; params.push(status); }

  const total = db.prepare(`SELECT COUNT(*) as c FROM orders ${where}`).get(...params).c;
  const orders = db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  res.json({ orders: orders.map(formatOrder), total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

/* GET /api/orders/:id */
router.get('/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND (user_id=? OR ?=\'admin\')').get(req.params.id, req.user.id, req.user.role);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(formatOrder(order));
});

/* POST /api/orders — place an order */
router.post('/', authenticate, (req, res) => {
  const { shipping_address, payment_method = 'card', coupon_code, notes } = req.body;
  if (!shipping_address) return res.status(400).json({ error: 'shipping_address required' });

  const cartItems = db.prepare(`
    SELECT c.quantity, c.size, c.color,
           p.id as product_id, p.name, p.price, p.sale_price, p.images, p.stock
    FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(422).json({ error: 'Cart is empty' });

  for (const item of cartItems) {
    if (item.quantity > item.stock) return res.status(422).json({ error: `${item.name} has insufficient stock` });
  }

  const subtotal = cartItems.reduce((s, i) => s + (i.sale_price ?? i.price) * i.quantity, 0);
  const shipping = subtotal > 2000 ? 0 : 50;

  let discount = 0;
  if (coupon_code) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code=? AND is_active=1').get(coupon_code.toUpperCase());
    if (coupon && subtotal >= coupon.min_order) {
      discount = coupon.type === 'percent' ? subtotal * coupon.value / 100 : coupon.value;
      db.prepare('UPDATE coupons SET uses=uses+1 WHERE id=?').run(coupon.id);
    }
  }

  const total = Math.max(0, subtotal + shipping - discount);

  const placeOrder = db.transaction(() => {
    const orderNum = nextOrderNumber();
    const orderId = db.prepare(`
      INSERT INTO orders (order_number,user_id,status,subtotal,shipping_cost,discount,total,shipping_address,payment_method,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(orderNum, req.user.id, 'pending', subtotal, shipping, discount, total, JSON.stringify(shipping_address), payment_method, notes || null).lastInsertRowid;

    for (const item of cartItems) {
      db.prepare(`
        INSERT INTO order_items (order_id,product_id,name,image,size,color,quantity,unit_price)
        VALUES (?,?,?,?,?,?,?,?)
      `).run(orderId, item.product_id, item.name, JSON.parse(item.images)[0] || null, item.size, item.color, item.quantity, item.sale_price ?? item.price);
      db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.user.id);
    return db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  });

  const order = placeOrder();
  res.status(201).json({ order: formatOrder(order) });
});

/* PUT /api/orders/:id/status — admin sets any status; users can only cancel their own pending/processing orders */
router.put('/:id/status', authenticate, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });

  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (req.user.role !== 'admin') {
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (status !== 'cancelled') return res.status(403).json({ error: 'You can only cancel orders' });
    if (!['pending', 'processing'].includes(order.status)) return res.status(422).json({ error: 'Order cannot be cancelled at this stage' });
  }

  db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  res.json(formatOrder(db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id)));
});

/* GET /api/orders/number/:orderNumber */
router.get('/number/:orderNumber', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_number=? AND (user_id=? OR ?=\'admin\')').get(req.params.orderNumber, req.user.id, req.user.role);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(formatOrder(order));
});

export default router;
