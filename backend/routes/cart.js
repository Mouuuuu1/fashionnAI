import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function getCart(userId) {
  const items = db.prepare(`
    SELECT c.id, c.quantity, c.size, c.color,
           p.id as product_id, p.name, p.brand, p.price, p.sale_price, p.images, p.stock
    FROM cart_items c
    JOIN products p ON p.id=c.product_id
    WHERE c.user_id=?
  `).all(userId);

  const enriched = items.map(i => ({
    id: i.id, quantity: i.quantity, size: i.size, color: i.color,
    product: {
      id: i.product_id, name: i.name, brand: i.brand,
      price: i.price, sale_price: i.sale_price,
      image: JSON.parse(i.images)[0] || null,
      stock: i.stock,
    },
    line_total: (i.sale_price ?? i.price) * i.quantity,
  }));

  const subtotal = enriched.reduce((s, i) => s + i.line_total, 0);
  const shipping = subtotal > 2000 ? 0 : 50;
  return { items: enriched, subtotal, shipping, total: subtotal + shipping, item_count: enriched.reduce((s, i) => s + i.quantity, 0) };
}

/* GET /api/cart */
router.get('/', authenticate, (req, res) => {
  res.json(getCart(req.user.id));
});

/* POST /api/cart */
router.post('/', authenticate, (req, res) => {
  const { product_id, quantity = 1, size, color } = req.body;
  if (!product_id || !size || !color) return res.status(400).json({ error: 'product_id, size and color required' });

  const product = db.prepare('SELECT id, stock FROM products WHERE id=? AND is_active=1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id=? AND product_id=? AND size=? AND color=?').get(req.user.id, product_id, size, color);

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id,product_id,quantity,size,color) VALUES (?,?,?,?,?)').run(req.user.id, product_id, Math.min(quantity, product.stock), size, color);
  }

  res.status(201).json(getCart(req.user.id));
});

/* PUT /api/cart/:itemId */
router.put('/:itemId', authenticate, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' });

  const item = db.prepare('SELECT c.id, p.stock FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.id=? AND c.user_id=?').get(req.params.itemId, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });

  db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(Math.min(quantity, item.stock), item.id);
  res.json(getCart(req.user.id));
});

/* DELETE /api/cart/:itemId */
router.delete('/:itemId', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM cart_items WHERE id=? AND user_id=?').run(req.params.itemId, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Cart item not found' });
  res.json(getCart(req.user.id));
});

/* DELETE /api/cart — clear all */
router.delete('/', authenticate, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.user.id);
  res.json(getCart(req.user.id));
});

/* POST /api/cart/apply-coupon */
router.post('/apply-coupon', authenticate, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'coupon code required' });

  const coupon = db.prepare('SELECT * FROM coupons WHERE code=? AND is_active=1').get(code.toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return res.status(410).json({ error: 'Coupon expired' });
  if (coupon.max_uses && coupon.uses >= coupon.max_uses) return res.status(410).json({ error: 'Coupon limit reached' });

  const cart = getCart(req.user.id);
  if (cart.subtotal < coupon.min_order) return res.status(422).json({ error: `Minimum order EGP ${coupon.min_order} required` });

  const discount = coupon.type === 'percent' ? cart.subtotal * coupon.value / 100 : coupon.value;
  res.json({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount, new_total: Math.max(0, cart.total - discount) });
});

export default router;
