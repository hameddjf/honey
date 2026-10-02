// دانلود تصاویر واقعی از Pexels و ذخیره در public/images
// اجرا: npm run images:download
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// تصاویر محصولات اینجا نیستند: آن‌ها از قبل داخل public/images/products قرار دارند و دانلود نمی‌شوند.
// هر آیتم: مسیر مقصد (همان چیزی که در کد به آن ارجاع داده شده) + آدرس منبع در Pexels
const IMAGES = [
  { dest: "images/about-photo.jpg", src: "https://images.pexels.com/photos/8805426/pexels-photo-8805426.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { dest: "images/blog/spot-fake-honey.jpg", src: "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=1000" },
  { dest: "images/blog/storage-tips.jpg", src: "https://images.pexels.com/photos/7728087/pexels-photo-7728087.jpeg?auto=compress&cs=tinysrgb&w=1000" },
  { dest: "images/blog/crystallization.jpg", src: "https://images.pexels.com/photos/33272/honey-bees-insect-macro.jpg?auto=compress&cs=tinysrgb&w=1000" },
  { dest: "images/blog/cooking-with-honey.jpg", src: "https://images.pexels.com/photos/6551047/pexels-photo-6551047.jpeg?auto=compress&cs=tinysrgb&w=1000" },
  { dest: "images/blog/honey-types.jpg", src: "https://images.pexels.com/photos/162979/hexagon-bee-honeycomb-comb-162979.jpeg?auto=compress&cs=tinysrgb&w=1000" },
  { dest: "images/blog/honey-cinnamon.jpg", src: "https://images.pexels.com/photos/1123259/pexels-photo-1123259.jpeg?auto=compress&cs=tinysrgb&w=1000" },
];

async function downloadOne({ dest, src }) {
  const outPath = path.join(PUBLIC_DIR, dest);
  await mkdir(path.dirname(outPath), { recursive: true });
  const res = await fetch(src, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NikaHoneyImageFetcher/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} برای ${src}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  console.log(`✓ ${dest}  (${(buf.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  console.log(`در حال دانلود ${IMAGES.length} تصویر از Pexels...\n`);
  let ok = 0;
  let fail = 0;
  for (const img of IMAGES) {
    try {
      await downloadOne(img);
      ok++;
    } catch (err) {
      fail++;
      console.error(`✗ ${img.dest} — ${err.message}`);
    }
  }
  console.log(`\nتمام شد: ${ok} موفق، ${fail} ناموفق.`);
  if (fail > 0) process.exitCode = 1;
}

main();
