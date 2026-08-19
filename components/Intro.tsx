import RevealOnScroll from "./RevealOnScroll";

export default function Intro() {
  return (
    <section id="intro">
      <div className="container intro-grid">
        <RevealOnScroll>
          <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="#E3A429" strokeWidth="1.4" opacity="0.9">
              <polygon points="140,20 220,65 220,155 140,200 60,155 60,65" />
              <polygon points="280,20 360,65 360,155 280,200 200,155 200,65" />
              <polygon points="140,200 220,245 220,335 140,380 60,335 60,245" />
              <polygon points="280,200 360,245 360,335 280,380 200,335 200,245" />
            </g>
            <clipPath id="c1">
              <polygon points="140,20 220,65 220,155 140,200 60,155 60,65" />
            </clipPath>
            <clipPath id="c2">
              <polygon points="280,200 360,245 360,335 280,380 200,335 200,245" />
            </clipPath>
            <image
              href="https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=800&auto=format&fit=crop"
              x="60" y="20" width="160" height="180" clipPath="url(#c1)" preserveAspectRatio="xMidYMid slice"
            />
            <image
              href="https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=800&auto=format&fit=crop"
              x="200" y="200" width="160" height="180" clipPath="url(#c2)" preserveAspectRatio="xMidYMid slice"
            />
          </svg>
        </RevealOnScroll>

        <RevealOnScroll className="intro-copy">
          <div className="eyebrow" style={{ color: "var(--gold)", opacity: 1 }}>
            <span className="dot" /> معرفی محصول
          </div>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 800, margin: "16px 0 22px", color: "var(--cream)" }}>
            از دل کوهستان تا شیشه‌ی روی میز شما
          </h2>
          <p>
            هر شیشه از عسل‌ستان، مسیری مشخص را طی می‌کند: انتخاب کندوهای زنبوردارانی که سال‌هاست
            می‌شناسیم، برداشت در فصل مناسب، و بسته‌بندی بدون حرارت‌دهی تا آنزیم‌ها و خواص طبیعی عسل
            دست‌نخورده بمانند.
          </p>
          <ul className="intro-list">
            <li><span className="chk">✓</span> آزمایش اصالت و خلوص برای هر پارتی تولید</li>
            <li><span className="chk">✓</span> خرید مستقیم از زنبوردار، بدون واسطه</li>
            <li><span className="chk">✓</span> بسته‌بندی سرد، بدون افزودنی و شکر مصنوعی</li>
            <li><span className="chk">✓</span> ارسال به سراسر کشور با بسته‌بندی ایمن</li>
          </ul>
        </RevealOnScroll>
      </div>
    </section>
  );
}
