import express from 'express';
import cors from 'cors';
import authRoutes     from './routes/auth.js';
import productRoutes  from './routes/products.js';
import cartRoutes     from './routes/cart.js';
import orderRoutes    from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import userRoutes     from './routes/users.js';
import adminRoutes    from './routes/admin.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());

/* ─── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);

/* ─── Root & Health ──────────────────────────────────────────── */
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>FashionAI API</title>
  <style>body{font-family:monospace;background:#1a1a1a;color:#d4c9b8;padding:40px;max-width:720px;margin:0 auto}
  h1{color:#c4a882;letter-spacing:.1em}h2{color:#8a887e;font-size:13px;letter-spacing:.2em;margin-top:32px}
  a{color:#c4a882}table{width:100%;border-collapse:collapse;margin-top:12px}
  td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #2e2e2e;font-size:13px}
  th{color:#8a887e;font-size:11px;letter-spacing:.15em}.badge{display:inline-block;padding:2px 8px;font-size:10px;border-radius:2px;font-weight:700}
  .get{background:#1a3a2a;color:#4caf50}.post{background:#3a2a1a;color:#ff9800}.put{background:#1a2a3a;color:#2196f3}.del{background:#3a1a1a;color:#f44336}</style>
  </head><body>
  <h1>FASHIONAI API</h1>
  <p style="color:#8a887e;font-size:13px">Running on port 3001 · Frontend: <a href="http://localhost:3000">localhost:3000</a></p>

  <h2>AUTH</h2><table>
  <tr><td><span class="badge post">POST</span></td><td>/api/auth/login</td><td style="color:#8a887e">Login with email + password</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/auth/register</td><td style="color:#8a887e">Create a new account</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/auth/me</td><td style="color:#8a887e">Get current user (JWT required)</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/auth/forgot-password</td><td style="color:#8a887e">Send reset token</td></tr>
  </table>

  <h2>PRODUCTS</h2><table>
  <tr><td><span class="badge get">GET</span></td><td><a href="/api/products">/api/products</a></td><td style="color:#8a887e">List · ?cat= ?q= ?sale= ?sort= ?page=</td></tr>
  <tr><td><span class="badge get">GET</span></td><td><a href="/api/products/1">/api/products/:id</a></td><td style="color:#8a887e">Product detail + reviews</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/products/:id/reviews</td><td style="color:#8a887e">Submit review (JWT required)</td></tr>
  </table>

  <h2>CART  <span style="font-size:11px;color:#8a887e">(JWT required)</span></h2><table>
  <tr><td><span class="badge get">GET</span></td><td>/api/cart</td><td style="color:#8a887e">Get cart with totals</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/cart</td><td style="color:#8a887e">Add item {product_id, size, color, quantity}</td></tr>
  <tr><td><span class="badge put">PUT</span></td><td>/api/cart/:id</td><td style="color:#8a887e">Update quantity</td></tr>
  <tr><td><span class="badge del">DEL</span></td><td>/api/cart/:id</td><td style="color:#8a887e">Remove item</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/cart/apply-coupon</td><td style="color:#8a887e">Codes: WELCOME10 · SUMMER20 · FLAT200</td></tr>
  </table>

  <h2>ORDERS  <span style="font-size:11px;color:#8a887e">(JWT required)</span></h2><table>
  <tr><td><span class="badge get">GET</span></td><td>/api/orders</td><td style="color:#8a887e">My orders</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/orders</td><td style="color:#8a887e">Place order from cart</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/orders/:id</td><td style="color:#8a887e">Order detail</td></tr>
  </table>

  <h2>WISHLIST  <span style="font-size:11px;color:#8a887e">(JWT required)</span></h2><table>
  <tr><td><span class="badge get">GET</span></td><td>/api/wishlist</td><td style="color:#8a887e">My wishlist</td></tr>
  <tr><td><span class="badge post">POST</span></td><td>/api/wishlist</td><td style="color:#8a887e">Add {product_id}</td></tr>
  <tr><td><span class="badge del">DEL</span></td><td>/api/wishlist/:productId</td><td style="color:#8a887e">Remove item</td></tr>
  </table>

  <h2>ADMIN  <span style="font-size:11px;color:#8a887e">(admin JWT required)</span></h2><table>
  <tr><td><span class="badge get">GET</span></td><td><a href="/api/admin/stats">/api/admin/stats</a></td><td style="color:#8a887e">Dashboard KPIs</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/admin/orders</td><td style="color:#8a887e">All orders with filters</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/admin/products</td><td style="color:#8a887e">All products (incl. inactive)</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/admin/analytics</td><td style="color:#8a887e">Time-series analytics ?period=7d|30d|90d</td></tr>
  <tr><td><span class="badge get">GET</span></td><td>/api/admin/inventory</td><td style="color:#8a887e">Stock levels + low-stock report</td></tr>
  </table>

  <h2>TEST CREDENTIALS</h2><table>
  <tr><th>Role</th><th>Email</th><th>Password</th></tr>
  <tr><td>Admin</td><td>admin@fashionai.com</td><td>admin123</td></tr>
  <tr><td>Customer</td><td>sara@example.com</td><td>password123</td></tr>
  <tr><td>Customer</td><td>ahmed@example.com</td><td>password123</td></tr>
  </table>
  </body></html>`);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

/* ─── 404 / 405 ──────────────────────────────────────────────── */
const postOnlyRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
app.use((req, res) => {
  if (req.method === 'GET' && postOnlyRoutes.includes(req.path)) {
    return res.status(405).send(`<!DOCTYPE html><html><head><title>POST only</title><style>body{font-family:monospace;background:#1a1a1a;color:#d4c9b8;padding:40px}h2{color:#c4a882}code{background:#2e2e2e;padding:4px 10px;border-radius:3px}a{color:#c4a882}</style></head><body>
      <h2>405 — POST only</h2>
      <p><strong>${req.path}</strong> only accepts POST requests. You can't visit it in the browser.</p>
      <p>Use the <a href="http://localhost:3000/login.html">login page</a> or test with curl:</p>
      <pre><code>curl -s -X POST http://localhost:3001${req.path} \\
  -H "Content-Type: application/json" \\
  -d '{"email":"sara@example.com","password":"password123"}'</code></pre>
      <p><a href="/">← Back to API reference</a></p>
    </body></html>`);
  }
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

/* ─── Error handler ──────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  FashionAI API running at http://localhost:${PORT}`);
  console.log(`  Health:   GET  http://localhost:${PORT}/api/health`);
  console.log(`  Products: GET  http://localhost:${PORT}/api/products`);
  console.log(`  Login:    POST http://localhost:${PORT}/api/auth/login`);
  console.log(`\n  Test credentials:`);
  console.log(`    Admin:    admin@fashionai.com / admin123`);
  console.log(`    Customer: sara@example.com / password123\n`);
});
