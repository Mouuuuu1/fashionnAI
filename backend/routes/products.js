import { Router } from 'express';
import db from '../database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/* GET /api/products */
router.get('/', (req, res) => {
  const { cat, q, brand, minPrice, maxPrice, size, color, sale, sort = 'newest', page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  let where = ['p.is_active=1'];
  const params = [];

  if (cat)      { where.push("p.category=?"); params.push(cat); }
  if (brand)    { where.push("p.brand=?");    params.push(brand); }
  if (q)        { where.push("(p.name LIKE ? OR p.description LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (minPrice) { where.push("COALESCE(p.sale_price,p.price)>=?"); params.push(parseFloat(minPrice)); }
  if (maxPrice) { where.push("COALESCE(p.sale_price,p.price)<=?"); params.push(parseFloat(maxPrice)); }
  if (sale)     { where.push("p.sale_price IS NOT NULL"); }
  if (size)     { where.push("p.sizes LIKE ?"); params.push(`%"${size}"%`); }
  if (color)    { where.push("p.colors LIKE ?"); params.push(`%"${color}"%`); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const sortMap = {
    newest:    'p.created_at DESC',
    'price-asc':  'COALESCE(p.sale_price,p.price) ASC',
    'price-desc': 'COALESCE(p.sale_price,p.price) DESC',
    rating:    'p.rating DESC',
    popular:   'p.reviews_count DESC',
  };
  const orderSQL = sortMap[sort] || 'p.created_at DESC';

  const total = db.prepare(`SELECT COUNT(*) as c FROM products p ${whereSQL}`).get(...params).c;
  const rows  = db.prepare(`SELECT p.id,p.name,p.category,p.brand,p.price,p.sale_price,p.description,p.sizes,p.colors,p.images,p.stock,p.rating,p.reviews_count,p.created_at FROM products p ${whereSQL} ORDER BY ${orderSQL} LIMIT ? OFFSET ?`).all(...params, limitNum, offset);

  const products = rows.map(p => ({
    ...p,
    sizes: JSON.parse(p.sizes),
    colors: JSON.parse(p.colors),
    images: JSON.parse(p.images),
  }));

  res.json({ products, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) });
});

/* GET /api/products/:id */
router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r
    JOIN users u ON u.id=r.user_id
    WHERE r.product_id=? ORDER BY r.created_at DESC LIMIT 20
  `).all(p.id);

  res.json({
    ...p,
    sizes: JSON.parse(p.sizes),
    colors: JSON.parse(p.colors),
    images: JSON.parse(p.images),
    reviews,
  });
});

/* POST /api/products (admin) */
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { name, category, brand, price, sale_price, description, sizes, colors, images, stock } = req.body;
  if (!name || !category || !price) return res.status(400).json({ error: 'name, category, price required' });

  const result = db.prepare(`
    INSERT INTO products (name,category,brand,price,sale_price,description,sizes,colors,images,stock)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(name, category, brand || 'Studio Collection', price, sale_price || null, description || '',
    JSON.stringify(sizes || ['XS','S','M','L','XL']),
    JSON.stringify(colors || ['Black','White']),
    JSON.stringify(images || []),
    stock ?? 50
  );
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({ ...product, sizes: JSON.parse(product.sizes), colors: JSON.parse(product.colors), images: JSON.parse(product.images) });
});

/* PUT /api/products/:id (admin) */
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { name, category, brand, price, sale_price, description, sizes, colors, images, stock, is_active } = req.body;
  const p = db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });

  db.prepare(`
    UPDATE products SET
      name=COALESCE(?,name), category=COALESCE(?,category), brand=COALESCE(?,brand),
      price=COALESCE(?,price), sale_price=?, description=COALESCE(?,description),
      sizes=COALESCE(?,sizes), colors=COALESCE(?,colors), images=COALESCE(?,images),
      stock=COALESCE(?,stock), is_active=COALESCE(?,is_active)
    WHERE id=?
  `).run(
    name || null, category || null, brand || null, price || null,
    sale_price !== undefined ? sale_price : db.prepare('SELECT sale_price FROM products WHERE id=?').get(req.params.id).sale_price,
    description || null,
    sizes ? JSON.stringify(sizes) : null,
    colors ? JSON.stringify(colors) : null,
    images ? JSON.stringify(images) : null,
    stock ?? null, is_active ?? null, req.params.id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  res.json({ ...updated, sizes: JSON.parse(updated.sizes), colors: JSON.parse(updated.colors), images: JSON.parse(updated.images) });
});

/* DELETE /api/products/:id (admin — soft delete) */
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(req.params.id);
  res.json({ message: 'Product deactivated' });
});

/* POST /api/products/:id/reviews */
router.post('/:id/reviews', authenticate, (req, res) => {
  const { rating, title, body } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1-5 required' });

  const existing = db.prepare('SELECT id FROM reviews WHERE product_id=? AND user_id=?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'You already reviewed this product' });

  db.prepare('INSERT INTO reviews (product_id,user_id,rating,title,body) VALUES (?,?,?,?,?)').run(req.params.id, req.user.id, rating, title || null, body || null);

  const avg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE product_id=?').get(req.params.id);
  db.prepare('UPDATE products SET rating=?, reviews_count=? WHERE id=?').run(Math.round(avg.avg * 10) / 10, avg.cnt, req.params.id);

  res.status(201).json({ message: 'Review submitted' });
});

export default router;
