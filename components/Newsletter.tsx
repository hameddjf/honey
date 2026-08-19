"use client";

import RevealOnScroll from "./RevealOnScroll";

export default function Newsletter() {
  return (
    <section className="cta-band">
      <div className="container">
        <RevealOnScroll>
          <h2>از عرضه محصولات جدید باخبر شوید</h2>
        </RevealOnScroll>
        <RevealOnScroll>
          <p>
            هر فصل، عسل‌های جدید از مناطق مختلف کشور اضافه می‌شود. ایمیل خود را ثبت کنید تا اول از
            همه بدانید.
          </p>
        </RevealOnScroll>
        <RevealOnScroll>
          <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="ایمیل شما" required />
            <button type="submit">ثبت‌نام</button>
          </form>
        </RevealOnScroll>
      </div>
    </section>
  );
}
