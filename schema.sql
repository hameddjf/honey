-- اسکیمای دیتابیس Cloudflare D1 برای پروژه عسل نیکا
-- اجرا: npx wrangler d1 execute nika-honey-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customer_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  emoji TEXT,
  price TEXT,
  old_price TEXT,
  weight TEXT,
  badge TEXT,
  origin TEXT,
  harvest TEXT,
  purity TEXT,
  image TEXT,
  description TEXT,
  benefits TEXT,          -- JSON string: [{icon,label}]
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  customer_city TEXT,
  customer_address TEXT,
  payment TEXT,
  items TEXT,              -- JSON string
  subtotal INTEGER,
  shipping INTEGER,
  total INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT              -- JSON string
);
