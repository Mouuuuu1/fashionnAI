import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function getWishlist(userId) {
  return db.prepare(`
    SELECT w.id, w.created_at,
           p.id as product_id, p.name, p.brand, p.category, p.price, p.sale_price, p.images, p.rating, p.stock
    FROM wishlist_items w JOIN products p ON p.id=w.product_id WHERE w.user_id=?
    ORDER BY w.created_at DESC
  `).all(userId).map(i => ({
    id: i.id, created_at: i.created_at,
    product: { id: i.product_id, name: i.name, brand: i.brand, category: i.category, price: i.price, sale_price: i.sale_price, image: JSON.parse(i.images)[0] || null, rating: i.rating, stock: i.stock },
  }));
}

/* GET /api/wishlist */
router.get('/', authenticate, (req, res) => res.json(getWishlist(req.user.id)));

/* POST /api/wishlist */
router.post('/', authenticate, (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const product = db.prepare('SELECT id FROM products WHERE id=? AND is_active=1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT id FROM wishlist_items WHERE user_id=? AND product_id=?').get(req.user.id, product_id);
  if (existing) return res.status(409).json({ error: 'Already in wishlist' });

  db.prepare('INSERT INTO wishlist_items (user_id,product_id) VALUES (?,?)').run(req.user.id, product_id);
  res.status(201).json(getWishlist(req.user.id));
});

/* DELETE /api/wishlist/:productId */
router.delete('/:productId', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?').run(req.user.id, req.params.productId);
  if (result.changes === 0) return res.status(404).json({ error: 'Not in wishlist' });
  res.json(getWishlist(req.user.id));
});

/* DELETE /api/wishlist — clear all */
router.delete('/', authenticate, (req, res) => {
  db.prepare('DELETE FROM wishlist_items WHERE user_id=?').run(req.user.id);
  res.json([]);
});

export default router;
