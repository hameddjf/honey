import RevealOnScroll from "./RevealOnScroll";

export default function Story() {
  return (
    <section className="band">
      <div className="container band-grid">
        <RevealOnScroll className="band-img">
          <img
            src="https://images.unsplash.com/photo-1758522965474-6ad5059c5437?q=80&w=1000&auto=format&fit=crop"
            alt="زنبوردار"
          />
        </RevealOnScroll>
        <RevealOnScroll>
          <div className="eyebrow" style={{ color: "var(--gold-bright)", opacity: 1 }}>
            <span className="dot" style={{ background: "var(--gold-bright)" }} /> داستان ما
          </div>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 800, margin: "16px 0 20px", color: "#fff" }}>
            همکاری مستقیم با ۴۰ زنبوردار در ۹ استان
          </h2>
          <p style={{ color: "#e3c9d0", lineHeight: 1.9 }}>
            عسل‌ستان سال ۱۳۹۹ با هدف حذف واسطه‌ها بین زنبوردار و مصرف‌کننده شکل گرفت. امروز با
            ده‌ها زنبوردار در سراسر کشور همکاری می‌کنیم و کیفیت هر محموله را پیش از عرضه بررسی
            می‌کنیم.
          </p>
          <div className="band-stats">
            <div className="stat"><b>۴۰+</b><span>زنبوردار همکار</span></div>
            <div className="stat"><b>۹ استان</b><span>مناطق برداشت</span></div>
            <div className="stat"><b>۵ سال</b><span>سابقه فعالیت</span></div>
            <div className="stat"><b>۰ افزودنی</b><span>در تمام محصولات</span></div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
