import RevealOnScroll from "./RevealOnScroll";

const steps = [
  { n: "۱", title: "برداشت فصلی", desc: "هر نوع عسل تنها در فصل شکوفایی گیاه میزبان برداشت می‌شود." },
  { n: "۲", title: "آزمایش خلوص", desc: "هر پارتی پیش از عرضه در آزمایشگاه از نظر خلوص بررسی می‌شود." },
  { n: "۳", title: "بسته‌بندی سرد", desc: "بدون حرارت‌دهی، برای حفظ آنزیم‌ها و خواص طبیعی عسل." },
  { n: "۴", title: "ارسال ایمن", desc: "بسته‌بندی ضدضربه و ارسال سریع به سراسر کشور." },
];

export default function Process() {
  return (
    <section className="process" id="process">
      <div className="container">
        <RevealOnScroll className="section-head">
          <div className="eyebrow"><span className="dot" /> فرآیند</div>
          <h2>از کندو تا شیشه، در چهار گام</h2>
        </RevealOnScroll>
        <div className="process-grid">
          {steps.map((s) => (
            <RevealOnScroll key={s.n} className="p-step">
              <div className="hex-num">
                <svg viewBox="0 0 100 100">
                  <polygon points="50,3 93,26 93,74 50,97 7,74 7,26" fill="#E3A429" />
                </svg>
                <span>{s.n}</span>
              </div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
