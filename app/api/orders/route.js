import { env } from "cloudflare:workers";
import { rowToProduct } from "@/lib/dbProducts";

// همان قاعده‌ی فعلی کسب‌وکار برای هزینه ارسال (بدون تغییر) — قبلاً در
// CheckoutClient.js و app/cart/_bodyScript.js تکرار شده بود.
const FREE_SHIP_THRESHOLD = 1000000;
const SHIP_COST = 45000;

// حداکثر تعداد معقول برای هر قلم سفارش — از سوءاستفاده با مقادیر نجومی
// (که نه یک خرید واقعی است و نه محاسبه‌ی معناداری دارد) جلوگیری می‌کند.
const MAX_QTY_PER_ITEM = 1000;

function isPlainNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isPositiveSafeInteger(v) {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}

// قیمت محصول در D1 به‌صورت متن فارسی‌شده ذخیره می‌شود (مثلاً «۲۴۰,۰۰۰»).
// همان منطق تبدیلی که در ProductGrid.js / CheckoutClient.js / اسکریپت‌های
// سبد خرید و صفحه محصول استفاده می‌شود، اینجا برای سرور تکرار شده است.
function parsePriceToInt(price) {
  const normalized = String(price ?? "").replace(
    /[۰-۹]/g,
    (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]
  );
  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  const n = parseInt(digitsOnly, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "درخواست نامعتبر است." }, { status: 400 });
  }

  // فقط فیلدهای غیرمالی از کلاینت پذیرفته می‌شوند. هرگونه مقدار مالی که
  // کلاینت ارسال کند (price/lineTotal/subtotal/shipping/total) به‌طور کامل
  // نادیده گرفته می‌شود؛ سرور تمام مقادیر مالی را خودش از روی D1 محاسبه می‌کند.
  const { customer, payment, items: rawItems } = body;

  if (
    !isPlainNonEmptyString(customer?.name) ||
    !isPlainNonEmptyString(customer?.phone) ||
    !isPlainNonEmptyString(customer?.city) ||
    !isPlainNonEmptyString(customer?.address)
  ) {
    return Response.json({ ok: false, error: "اطلاعات سفارش ناقص است." }, { status: 400 });
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return Response.json({ ok: false, error: "سبد خرید خالی است." }, { status: 400 });
  }

  // ساختار و مقدار هر قلم را اعتبارسنجی می‌کنیم (بدون هیچ اتکایی به قیمت/جمع
  // ارسالی کلاینت).
  const requested = [];
  for (const raw of rawItems) {
    const slug = isPlainNonEmptyString(raw?.key)
      ? raw.key.trim()
      : isPlainNonEmptyString(raw?.slug)
      ? raw.slug.trim()
      : "";
    if (!slug) {
      return Response.json({ ok: false, error: "شناسه محصول در یکی از اقلام سفارش نامعتبر است." }, { status: 400 });
    }

    const qty = raw?.qty;
    if (!isPositiveSafeInteger(qty)) {
      return Response.json({ ok: false, error: `تعداد نامعتبر برای محصول «${slug}».` }, { status: 400 });
    }
    if (qty > MAX_QTY_PER_ITEM) {
      return Response.json({ ok: false, error: `تعداد درخواستی برای «${slug}» بیش از حد مجاز است.` }, { status: 400 });
    }

    requested.push({ slug, qty });
  }

  // رکوردهای معتبر محصول را از D1 (منبع مرجع) بارگذاری می‌کنیم.
  const uniqueSlugs = [...new Set(requested.map((r) => r.slug))];
  const placeholders = uniqueSlugs.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT * FROM products WHERE slug IN (${placeholders})`
  )
    .bind(...uniqueSlugs)
    .all();

  const productsBySlug = {};
  for (const row of results) productsBySlug[row.slug] = rowToProduct(row);

  // هر محصول درخواستی باید واقعاً در کاتالوگ معتبر (D1) وجود داشته باشد.
  // این پروژه فیلد فعال/غیرفعال جداگانه‌ای برای محصولات ندارد؛ بنابراین
  // «قابل‌خرید بودن» یعنی وجود رکورد در جدول products.
  for (const { slug } of requested) {
    if (!productsBySlug[slug]) {
      return Response.json({ ok: false, error: `محصول «${slug}» یافت نشد یا در دسترس نیست.` }, { status: 400 });
    }
  }

  // اقلام سفارش، جمع کالاها، هزینه ارسال و مبلغ نهایی — همگی سمت سرور و
  // فقط از روی قیمت واقعی D1 محاسبه می‌شوند.
  const orderItems = requested.map(({ slug, qty }) => {
    const product = productsBySlug[slug];
    const price = parsePriceToInt(product.price);
    return {
      key: slug,
      title: product.title,
      weight: product.weight,
      image: product.image,
      qty,
      price,
      lineTotal: price * qty,
    };
  });

  const subtotal = orderItems.reduce((sum, it) => sum + it.lineTotal, 0);
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIP_COST;
  const total = subtotal + shipping;

  const now = new Date();
  const id = "NK-" + now.getTime().toString().slice(-7);
  const storedPayment = isPlainNonEmptyString(payment) ? payment.trim() : "";

  await env.DB.prepare(
    `INSERT INTO orders (id, customer_name, customer_phone, customer_city, customer_address, payment, items, subtotal, shipping, total, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')`
  )
    .bind(
      id,
      customer.name.trim(),
      customer.phone.trim(),
      customer.city.trim(),
      customer.address.trim(),
      storedPayment,
      JSON.stringify(orderItems),
      subtotal,
      shipping,
      total
    )
    .run();

  const order = {
    id,
    date: now.toLocaleDateString("fa-IR"),
    time: now.toLocaleTimeString("fa-IR"),
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      city: customer.city.trim(),
      address: customer.address.trim(),
      postal: isPlainNonEmptyString(customer.postal) ? customer.postal.trim() : "",
    },
    payment: storedPayment,
    items: orderItems,
    subtotal,
    shipping,
    total,
    status: "processing",
  };

  return Response.json({ ok: true, order });
}
