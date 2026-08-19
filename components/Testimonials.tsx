import RevealOnScroll from "./RevealOnScroll";

const reviews = [
  {
    text: "«طعم عسل کوهی واقعاً با چیزی که تا حالا خریده بودم فرق داشت. غلظت و رنگش هم کاملاً طبیعی بود.»",
    name: "سارا احمدی",
    city: "تهران",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  {
    text: "«بسته‌بندی و ارسال خیلی مرتب بود و توضیحات کامل درباره منشأ عسل روی برچسب نوشته شده بود.»",
    name: "رضا کریمی",
    city: "اصفهان",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    text: "«برای صبحانه خانواده همیشه از عسل‌ستان سفارش می‌دیم. کیفیت هیچ‌وقت افت نکرده.»",
    name: "مریم رستمی",
    city: "شیراز",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
];

export default function Testimonials() {
  return (
    <section className="testimonials light-section" id="reviews">
      <div className="container">
        <RevealOnScroll className="section-head">
          <div className="eyebrow" style={{ color: "var(--ink)", opacity: 1 }}>
            <span className="dot" style={{ background: "var(--amber)" }} /> نظرات مشتریان
          </div>
          <h2>تجربه‌ی کسانی که عسل‌ستان را امتحان کرده‌اند</h2>
        </RevealOnScroll>
        <div className="t-grid">
          {reviews.map((r) => (
            <RevealOnScroll key={r.name} className="t-card">
              <div className="stars">★★★★★</div>
              <p>{r.text}</p>
              <div className="t-who">
                <img src={r.avatar} alt={r.name} />
                <div>
                  <b>{r.name}</b>
                  <span>{r.city}</span>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
