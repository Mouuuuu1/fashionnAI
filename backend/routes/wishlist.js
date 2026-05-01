import { Router } from 'express';
import db from '../database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function getWishlist(userId) {
  return db.prepare(`
    SELECT w.id, w.created_at,
           p.id as product_id, p.name, p.brand, p.category, p.price, p.sale_price,
           p.images, p.stock, p.rating, p.reviews_count
    FROM wishlist_items w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = ? AND p.is_active = 1
    ORDER BY w.created_at DESC
  `).all(userId).map(row => ({
    id: row.id,
    created_at: row.created_at,
    product: {
      id: row.product_id, name: row.name, brand: row.brand, category: row.category,
      price: row.price, sale_price: row.sale_price,
      image: JSON.parse(row.images)[0] || null,
      stock: row.stock, rating: row.rating, reviews_count: row.reviews_count,
    },
  }));
}

/* GET /api/wishlist */
router.get('/', authenticate, (req, res) => {
  res.json(getWishlist(req.user.id));
});

/* POST /api/wishlist */
router.post('/', authenticate, (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const product = db.prepare('SELECT id FROM products WHERE id=? AND is_active=1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
  res.status(201).json(getWishlist(req.user.id));
});

/* DELETE /api/wishlist/:productId */
router.delete('/:productId', authenticate, (req, res) => {
  db.prepare('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?').run(req.user.id, req.params.productId);
  res.json(getWishlist(req.user.id));
});

export default router;
