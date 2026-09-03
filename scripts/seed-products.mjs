// اسکریپت انتقال محصولات فعلی (lib/products.js) به یک فایل seed.sql
// اجرا: node scripts/seed-products.mjs > seed-products.sql
// سپس: npx wrangler d1 execute nika-honey-db --remote --file=./seed-products.sql

import { PRODUCTS } from "../lib/products.js";

function esc(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

let sql = "";
let i = 0;
for (const [slug, p] of Object.entries(PRODUCTS)) {
  sql += `INSERT INTO products (slug, title, tagline, emoji, price, old_price, weight, badge, origin, harvest, purity, image, description, benefits, sort_order)
VALUES (${esc(slug)}, ${esc(p.title)}, ${esc(p.tagline)}, ${esc(p.emoji)}, ${esc(p.price)}, ${esc(p.oldPrice)}, ${esc(p.weight)}, ${esc(p.badge)}, ${esc(p.origin)}, ${esc(p.harvest)}, ${esc(p.purity)}, ${esc(p.image)}, ${esc(p.desc)}, ${esc(JSON.stringify(p.benefits || []))}, ${i})
ON CONFLICT(slug) DO NOTHING;\n`;
  i += 1;
}

process.stdout.write(sql);
