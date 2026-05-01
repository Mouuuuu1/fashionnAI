import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, 'fashionai.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ─── Schema ─────────────────────────────────────────────────── */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'customer',
    phone       TEXT,
    avatar      TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    category      TEXT    NOT NULL,
    brand         TEXT    NOT NULL DEFAULT 'Studio Collection',
    price         REAL    NOT NULL,
    sale_price    REAL,
    description   TEXT,
    sizes         TEXT    NOT NULL DEFAULT '["XS","S","M","L","XL"]',
    colors        TEXT    NOT NULL DEFAULT '["Black","White"]',
    images        TEXT    NOT NULL DEFAULT '[]',
    stock         INTEGER NOT NULL DEFAULT 50,
    rating        REAL    NOT NULL DEFAULT 4.5,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL DEFAULT 1,
    size       TEXT    NOT NULL,
    color      TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id, size, color)
  );

  CREATE TABLE IF NOT EXISTS wishlist_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number     TEXT    NOT NULL UNIQUE,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    status           TEXT    NOT NULL DEFAULT 'pending',
    subtotal         REAL    NOT NULL,
    shipping_cost    REAL    NOT NULL DEFAULT 0,
    discount         REAL    NOT NULL DEFAULT 0,
    total            REAL    NOT NULL,
    shipping_address TEXT    NOT NULL,
    payment_method   TEXT    NOT NULL DEFAULT 'card',
    notes            TEXT,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    image      TEXT,
    size       TEXT    NOT NULL,
    color      TEXT    NOT NULL,
    quantity   INTEGER NOT NULL,
    unit_price REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label      TEXT    NOT NULL DEFAULT 'Home',
    first_name TEXT    NOT NULL,
    last_name  TEXT    NOT NULL,
    street     TEXT    NOT NULL,
    city       TEXT    NOT NULL DEFAULT 'Cairo',
    governorate TEXT   NOT NULL DEFAULT 'Cairo',
    postal_code TEXT,
    phone      TEXT,
    is_default INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    title      TEXT,
    body       TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(product_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code         TEXT    NOT NULL UNIQUE,
    type         TEXT    NOT NULL DEFAULT 'percent',
    value        REAL    NOT NULL,
    min_order    REAL    NOT NULL DEFAULT 0,
    max_uses     INTEGER,
    uses         INTEGER NOT NULL DEFAULT 0,
    expires_at   TEXT,
    is_active    INTEGER NOT NULL DEFAULT 1
  );
`);

/* ─── Seed ───────────────────────────────────────────────────── */
function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  /* Users */
  const insertUser = db.prepare(`
    INSERT INTO users (name,email,password,role,phone) VALUES (?,?,?,?,?)
  `);
  insertUser.run('Admin User',   'admin@fashionai.com',    hash('admin123'),    'admin',    '+20 100 000 0001');
  insertUser.run('Sara Mohamed', 'sara@example.com',       hash('password123'), 'customer', '+20 123 456 7890');
  insertUser.run('Ahmed Khalil', 'ahmed@example.com',      hash('password123'), 'customer', '+20 111 222 3333');
  insertUser.run('Layla Hassan', 'layla@example.com',      hash('password123'), 'customer', '+20 100 987 6543');

  /* Addresses */
  const insertAddr = db.prepare(`
    INSERT INTO addresses (user_id,label,first_name,last_name,street,city,governorate,postal_code,phone,is_default)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  insertAddr.run(2,'Home','Sara','Mohamed','15 Nile Street, Dokki','Giza','Giza','12311','+20 123 456 7890',1);
  insertAddr.run(2,'Work','Sara','Mohamed','Nile Tower, Floor 8, Nile Corniche','Cairo','Cairo','11511','+20 123 456 7890',0);

  /* Products */
  const insertProduct = db.prepare(`
    INSERT INTO products (name,category,brand,price,sale_price,description,sizes,colors,images,stock,rating,reviews_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const products = [
    ['Linen Wide-Leg Trousers','women','Studio Collection',1850,null,'Premium Egyptian linen wide-leg trousers with a relaxed silhouette. Breathable and elegant.','["XS","S","M","L","XL"]','["Ivory","Sand","Black","Olive"]','["https://placehold.co/600x800/f5f0eb/6e6353?text=Linen+Trousers"]',80,4.8,124],
    ['Structured Blazer','women','Create Premium',3200,2750,'Tailored blazer in premium wool blend. Sharp shoulders, clean lines.','["XS","S","M","L"]','["Camel","Charcoal","Ivory"]','["https://placehold.co/600x800/e8e0d5/6e6353?text=Blazer"]',45,4.9,87],
    ['Silk Midi Dress','women','Capsule Line',2400,null,'Fluid silk-touch midi dress with adjustable tie waist. Day to evening.','["XS","S","M","L","XL"]','["Blush","Champagne","Forest"]','["https://placehold.co/600x800/f0e8e0/6e6353?text=Silk+Dress"]',60,4.7,203],
    ['Oversized Cotton Tee','women','Create Essentials',480,null,'Relaxed fit organic cotton tee. GOTS certified, ethically made.','["XS","S","M","L","XL","XXL"]','["White","Black","Sage","Dusty Pink"]','["https://placehold.co/600x800/fafaf8/6e6353?text=Oversized+Tee"]',200,4.6,456],
    ['Tailored Chino Trousers','men','Studio Collection',1650,null,'Classic chinos in stretch cotton. Slim fit with a clean finish.','["28","30","32","34","36","38"]','["Khaki","Navy","Charcoal","Olive"]','["https://placehold.co/600x800/d4c9b8/6e6353?text=Chinos"]',95,4.5,178],
    ['Merino Crew Neck Sweater','men','Create Premium',2100,1680,'Superfine merino wool crewneck. Lightweight, temperature-regulating.','["S","M","L","XL","XXL"]','["Camel","Navy","Charcoal","Ivory"]','["https://placehold.co/600x800/c4a882/6e6353?text=Merino+Sweater"]',70,4.8,94],
    ['Oxford Button-Down Shirt','men','Create Essentials',890,null,'Classic Oxford weave shirt. Easy-care, wrinkle-resistant.','["S","M","L","XL","XXL"]','["White","Blue","Pink","Grey"]','["https://placehold.co/600x800/e8f0f5/6e6353?text=Oxford+Shirt"]',120,4.4,267],
    ['Kids Cotton Romper','kids','Create Essentials',390,null,'Comfortable all-day romper in 100% organic cotton. Easy snap buttons.','["0-3M","3-6M","6-12M","12-18M","18-24M"]','["Yellow","Mint","Peach","White"]','["https://placehold.co/600x800/f5f9e8/6e6353?text=Kids+Romper"]',85,4.9,312],
    ['Kids Graphic Hoodie','kids','Studio Collection',650,520,'Cosy fleece hoodie with fun hand-drawn print. Machine washable.','["2T","3T","4T","5T","6T"]','["Navy","Burgundy","Forest"]','["https://placehold.co/600x800/e8ecf5/6e6353?text=Kids+Hoodie"]',60,4.7,88],
    ['Leather Card Holder','accessories','Create Premium',450,null,'Full-grain vegetable-tanned leather card holder. Holds 6 cards.','["One Size"]','["Black","Tan","Navy"]','["https://placehold.co/600x800/c4a882/6e6353?text=Card+Holder"]',150,4.6,54],
    ['Structured Tote Bag','accessories','Studio Collection',1890,null,'Vegetable-tanned leather tote with canvas lining. Fits a 13" laptop.','["One Size"]','["Tan","Black","Ivory"]','["https://placehold.co/600x800/d4b896/6e6353?text=Tote+Bag"]',40,4.8,76],
    ['Silk Scarf 90x90','accessories','Capsule Line',680,null,'Hand-rolled edges, 100% silk. Inspired by Cairo\'s geometric tiles.','["One Size"]','["Terracotta","Sage","Navy","Sand"]','["https://placehold.co/600x800/f5e8d5/6e6353?text=Silk+Scarf"]',90,4.9,143],
    ['Linen Co-Ord Set','women','Studio Collection',2800,2240,'Matching linen jacket and wide-leg trouser set. Wear together or apart.','["XS","S","M","L","XL"]','["Oat","Sage","Sand"]','["https://placehold.co/600x800/efe9df/6e6353?text=Co-Ord+Set"]',35,4.8,67],
    ['Polo Shirt','men','Create Essentials',720,null,'Piqué cotton polo. Classic fit with a modern collar.','["S","M","L","XL","XXL"]','["White","Navy","Bottle Green","Red"]','["https://placehold.co/600x800/f0f5f0/6e6353?text=Polo+Shirt"]',140,4.3,389],
    ['Denim Jacket','women','Create Premium',2600,null,'Premium selvedge denim jacket. Raw edge details, brass hardware.','["XS","S","M","L"]','["Indigo","Black","Light Wash"]','["https://placehold.co/600x800/d0d8e8/6e6353?text=Denim+Jacket"]',25,4.9,45],
  ];

  for (const p of products) insertProduct.run(...p);

  /* Reviews */
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id,user_id,rating,title,body) VALUES (?,?,?,?,?)
  `);
  insertReview.run(1,2,5,'Perfect fit','The linen is so soft and the fit is exactly as described. Highly recommend.');
  insertReview.run(1,3,5,'Summer essential','Wore this all summer. Breathes so well in the Egyptian heat.');
  insertReview.run(2,2,5,'Worth every penny','The blazer is impeccably tailored. Got so many compliments on day one.');
  insertReview.run(3,4,4,'Beautiful dress','Lovely fabric and drape. The colour is exactly as shown.');
  insertReview.run(5,3,4,'Great everyday trouser','Comfortable and smart. The stretch fabric is a game changer.');

  /* Sample orders */
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number,user_id,status,subtotal,shipping_cost,discount,total,shipping_address,payment_method)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id,product_id,name,image,size,color,quantity,unit_price)
    VALUES (?,?,?,?,?,?,?,?)
  `);

  const addr = JSON.stringify({ firstName:'Sara', lastName:'Mohamed', street:'15 Nile Street, Dokki', city:'Giza', governorate:'Giza', postalCode:'12311', phone:'+20 123 456 7890' });

  const o1 = insertOrder.run('FAI-2025-0001',2,'delivered',4050,0,0,4050,addr,'card').lastInsertRowid;
  insertOrderItem.run(o1,1,'Linen Wide-Leg Trousers','https://placehold.co/600x800/f5f0eb/6e6353?text=Linen+Trousers','M','Ivory',1,1850);
  insertOrderItem.run(o1,4,'Oversized Cotton Tee','https://placehold.co/600x800/fafaf8/6e6353?text=Oversized+Tee','S','White',2,480);
  insertOrderItem.run(o1,10,'Leather Card Holder','https://placehold.co/600x800/c4a882/6e6353?text=Card+Holder','One Size','Tan',1,450);

  const o2 = insertOrder.run('FAI-2025-0002',2,'processing',3200,50,0,3250,addr,'cod').lastInsertRowid;
  insertOrderItem.run(o2,2,'Structured Blazer','https://placehold.co/600x800/e8e0d5/6e6353?text=Blazer','S','Camel',1,2750);
  insertOrderItem.run(o2,12,'Silk Scarf 90x90','https://placehold.co/600x800/f5e8d5/6e6353?text=Silk+Scarf','One Size','Sand',1,680);

  const o3 = insertOrder.run('FAI-2025-0003',3,'shipped',1890,50,0,1940,addr,'card').lastInsertRowid;
  insertOrderItem.run(o3,11,'Structured Tote Bag','https://placehold.co/600x800/d4b896/6e6353?text=Tote+Bag','One Size','Tan',1,1890);

  /* Coupons */
  const insertCoupon = db.prepare(`INSERT INTO coupons (code,type,value,min_order) VALUES (?,?,?,?)`);
  insertCoupon.run('WELCOME10','percent',10,0);
  insertCoupon.run('SUMMER20','percent',20,1500);
  insertCoupon.run('FLAT200','fixed',200,500);

  /* Wishlist */
  const insertWish = db.prepare('INSERT INTO wishlist_items (user_id,product_id) VALUES (?,?)');
  insertWish.run(2,1); insertWish.run(2,2); insertWish.run(2,11);
  insertWish.run(3,5); insertWish.run(3,6);

  /* Cart */
  const insertCart = db.prepare('INSERT INTO cart_items (user_id,product_id,quantity,size,color) VALUES (?,?,?,?,?)');
  insertCart.run(2,4,2,'S','White');
  insertCart.run(2,10,1,'One Size','Black');

  console.log('✓ Database seeded');
}

seed();

export function reseedForTests() {
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM cart_items;
    DELETE FROM wishlist_items;
    DELETE FROM reviews;
    DELETE FROM addresses;
    DELETE FROM orders;
    DELETE FROM coupons;
    DELETE FROM products;
    DELETE FROM users;
  `);
  try { db.exec('DELETE FROM sqlite_sequence'); } catch {}
  seed();
}

export default db;
