"use client";

// این فایل فقط برای خطاهای درون خودِ layout ریشه (بسیار نادر) استفاده می‌شود.
// چون در این حالت layout اصلی (و در نتیجه globals.css و فونت‌ها) ممکن است
// خودش عامل خطا باشد، این صفحه عمداً ساده و مستقل نگه داشته شده تا در هر
// شرایطی قابل نمایش باشد.

export default function GlobalError({ reset }) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          fontFamily: "Tahoma, Arial, sans-serif",
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBF6EA",
          color: "#3A2E1E",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🐝</div>
          <h1 style={{ fontSize: 20, marginBottom: 10 }}>یک مشکل غیرمنتظره پیش آمد</h1>
          <p style={{ fontSize: 14, lineHeight: 1.9, color: "#6b5c42", marginBottom: 22 }}>
            متأسفانه سایت با یک خطای غیرمنتظره مواجه شد. لطفاً دوباره تلاش کنید یا کمی بعد مجدداً سر بزنید.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#D9A630",
              color: "#3A2408",
              border: "none",
              borderRadius: 999,
              padding: "12px 26px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            دوباره تلاش کنید
          </button>
        </div>
      </body>
    </html>
  );
}
