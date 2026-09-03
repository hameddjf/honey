// اسکریپت ساخت اولین حساب ادمین (موبایل + رمز عبور).
// اجرا: node scripts/create-admin.mjs "09121234567" "رمز-قوی-من" "نام مدیر"
// خروجی یک دستور SQL چاپ می‌کند که باید با wrangler روی D1 اجرا شود.

import { scryptSync, randomBytes } from "node:crypto";

const [, , mobile, password, name = "مدیر فروشگاه"] = process.argv;

if (!mobile || !password) {
  console.error("استفاده: node scripts/create-admin.mjs <mobile> <password> [name]");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

const escapedName = name.replace(/'/g, "''");
const sql = `INSERT INTO admin_users (mobile, name, password_hash, password_salt) VALUES ('${mobile}', '${escapedName}', '${hash}', '${salt}');`;

console.log("\n--- این دستور SQL را کپی و اجرا کنید ---\n");
console.log(sql);
console.log("\n--- یا مستقیم با wrangler اجرا کنید ---\n");
console.log(`npx wrangler d1 execute nika-honey-db --remote --command="${sql.replace(/"/g, '\\"')}"`);
console.log("");
