import { IconDroplet } from "./Icons";

export default function Hero() {
  return (
    <section className="hero">
      <svg className="hex-pattern" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexPat" width="44" height="76" patternUnits="userSpaceOnUse">
            <polygon points="22,0 44,12.7 44,38 22,50.9 0,38 0,12.7" fill="none" stroke="#E3A429" strokeWidth="0.6" />
            <polygon points="22,25.4 44,38 44,63.6 22,76 0,63.6 0,38" fill="none" stroke="#E3A429" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexPat)" />
      </svg>

      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot" /> عسل خام و طبیعی، مستقیم از کندو
          </div>
          <h1>
            عسلی که <span className="accent">خالص</span>
            <br />
            می‌ماند، از کندو تا خانه شما
          </h1>
          <p className="lead">
            عسل‌ستان عسل طبیعی و بدون واسطه را از زنبورداران معتمد سراسر کشور تهیه می‌کند؛
            بدون حرارت، بدون افزودنی، با آزمایش اصالت روی هر محموله.
          </p>
          <div className="hero-actions">
            <a href="#products" className="btn-primary">
              خرید عسل خالص ←
            </a>
            <a href="#intro" className="btn-ghost">
              آشنایی با فرآیند تولید
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <b>۱۲۰۰+</b>
              <span>مشتری راضی</span>
            </div>
            <div>
              <b>۱۸ نوع</b>
              <span>عسل تک‌گل و چندگل</span>
            </div>
            <div>
              <b>۱۰۰٪</b>
              <span>بدون حرارت‌دهی</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hex-frame">
            <div className="hex-clip">
              <img
                src="https://images.unsplash.com/photo-1568657704598-602700bd9694?q=80&w=1200&auto=format&fit=crop"
                alt="ظرف عسل خالص"
              />
            </div>
            <div className="badge-float">
              <div className="ic">
                <IconDroplet className="icon-20" />
              </div>
              <div>
                <b>عسل کوهی طبیعی</b>
                <span>برداشت پاییز ۱۴۰۳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-cue">
        <span>پیمایش</span>
        <div className="line" />
      </div>
    </section>
  );
}
