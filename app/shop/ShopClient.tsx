"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import { IconHoneyJar } from "@/components/Icons";

type SortKey = "default" | "price-asc" | "price-desc";

export default function ShopClient() {
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = filterOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") {
      list = list.filter((p) => p.categorySlug === activeCategory);
    }
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((p) => p.name.includes(q) || p.desc.includes(q));
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [activeCategory, sort, query]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const activeCount =
    (activeCategory !== "all" ? 1 : 0) + (query.trim() ? 1 : 0) + (sort !== "default" ? 1 : 0);

  const FilterPanel = (
    <>
      <div className="filter-block">
        <h4>جستجو</h4>
        <input
          type="text"
          placeholder="نام محصول..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="filter-search"
        />
      </div>
      <div className="filter-block">
        <h4>دسته‌بندی</h4>
        <div className="filter-cat-list">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setActiveCategory(c.slug)}
              className={`filter-cat-item ${activeCategory === c.slug ? "active" : ""}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-block">
        <h4>مرتب‌سازی</h4>
        <div className="filter-cat-list">
          {[
            { k: "default", l: "پیش‌فرض" },
            { k: "price-asc", l: "ارزان‌ترین" },
            { k: "price-desc", l: "گران‌ترین" },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => setSort(s.k as SortKey)}
              className={`filter-cat-item ${sort === s.k ? "active" : ""}`}
            >
              {s.l}
            </button>
          ))}
        </div>
      </div>
      {activeCount > 0 && (
        <button
          className="filter-clear"
          onClick={() => {
            setQuery("");
            setActiveCategory("all");
            setSort("default");
          }}
        >
          پاک کردن همهٔ فیلترها ({activeCount})
        </button>
      )}
    </>
  );

  return (
    <section className="shop-page-v2 light-section">
      <div className="shop-hero-band">
        <div className="container">
          <div className="eyebrow" style={{ color: "var(--gold-bright)", opacity: 1 }}>
            <span className="dot" style={{ background: "var(--gold-bright)" }} /> فروشگاه عسل‌ستان
          </div>
          <h1 className="shop-hero-title">
            {filtered.length} محصول <span>خالص و طبیعی</span>
          </h1>
        </div>
      </div>

      <div className="container shop-layout">
        <aside className="shop-sidebar desktop-only-block">{FilterPanel}</aside>

        <div className="shop-main">
          <div className="shop-mobile-bar mobile-only-flex">
            <button className="shop-filter-trigger" onClick={() => setFilterOpen(true)}>
              فیلترها {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
            </button>
            <div className="shop-cats-scroll">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setActiveCategory(c.slug)}
                  className={`shop-chip ${activeCategory === c.slug ? "active" : ""}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="shop-masonry">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="shop-masonry">
              {featured && <ProductCard product={featured} featured />}
              {rest.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <div className="shop-empty-icon">
                <IconHoneyJar className="icon-40" />
              </div>
              <h3>محصولی پیدا نشد</h3>
              <p>عبارت جستجو یا دسته‌بندی را تغییر دهید.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("all");
                }}
              >
                پاک کردن فیلترها
              </button>
            </div>
          )}
        </div>
      </div>

      {/* mobile filter bottom sheet */}
      <div
        className={`filter-sheet-backdrop ${filterOpen ? "open" : ""}`}
        onClick={() => setFilterOpen(false)}
      />
      <div className={`filter-sheet ${filterOpen ? "open" : ""}`}>
        <div className="filter-sheet-head">
          <h3>فیلترها</h3>
          <button onClick={() => setFilterOpen(false)} aria-label="بستن">✕</button>
        </div>
        <div className="filter-sheet-body">{FilterPanel}</div>
        <button className="btn-primary filter-sheet-apply" onClick={() => setFilterOpen(false)}>
          نمایش {filtered.length} محصول
        </button>
      </div>
    </section>
  );
}
