import RevealOnScroll from "./RevealOnScroll";

const products = [
  {
    tag: "پرفروش",
    img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=800&auto=format&fit=crop",
    cat: "تک‌گل / کوهستانی",
    name: "عسل کوهی طبیعی",
    desc: "غلیظ، تیره‌رنگ و با عطر قوی؛ برداشت‌شده از ارتفاعات البرز در اواخر تابستان.",
    price: "۴۸۵,۰۰۰",
  },
  {
    tag: "جدید",
    img: "https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=800&auto=format&fit=crop",
    cat: "تک‌گل / گون",
    name: "عسل گون کویری",
    desc: "روشن، خوش‌عطر و با شیرینی ملایم؛ مناسب مصرف روزانه و صبحانه.",
    price: "۵۲۰,۰۰۰",
  },
  {
    tag: null,
    img: "https://images.unsplash.com/photo-1675419940490-051377d6bc6c?q=80&w=800&auto=format&fit=crop",
    cat: "ویژه / موم‌دار",
    name: "عسل با موم طبیعی",
    desc: "عسل خام همراه با قطعات موم تازه، برای دوستداران طعم اصیل و سنتی.",
    price: "۶۱۰,۰۰۰",
  },
];

export default function Products() {
  return (
    <section className="light-section" id="products">
      <div className="container">
        <RevealOnScroll className="section-head">
          <div className="eyebrow" style={{ color: "var(--ink)", opacity: 1 }}>
            <span className="dot" style={{ background: "var(--amber)" }} /> محصولات منتخب
          </div>
          <h2>عسل‌هایی برای هر سلیقه</h2>
          <p>
            از عسل کوهی تیره و غلیظ گرفته تا عسل گون روشن و خوش‌عطر — هرکدام با مشخصات کامل منشأ و
            زمان برداشت.
          </p>
        </RevealOnScroll>

        <div className="product-grid">
          {products.map((p) => (
            <RevealOnScroll key={p.name} className="p-card">
              <div className="p-media">
                {p.tag && <span className="p-tag">{p.tag}</span>}
                <img src={p.img} alt={p.name} />
              </div>
              <div className="p-body">
                <div className="p-cat">{p.cat}</div>
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <div className="p-foot">
                  <div className="p-price">
                    {p.price} <span>تومان</span>
                  </div>
                  <button className="p-add" aria-label={`افزودن ${p.name} به سبد`}>+</button>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
