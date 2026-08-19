export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  desc: string;
  longDesc: string;
  price: number;
  oldPrice?: number;
  tag?: string;
  inStock: boolean;
  weight: string;
  images: string[];
};

export const categories = [
  { slug: "all", name: "همه محصولات" },
  { slug: "mountain", name: "تک‌گل کوهستانی" },
  { slug: "desert", name: "تک‌گل کویری" },
  { slug: "wax", name: "موم‌دار" },
  { slug: "multi", name: "چندگل" },
];

export const products: Product[] = [
  {
    slug: "mountain-honey",
    name: "عسل کوهی طبیعی",
    category: "تک‌گل / کوهستانی",
    categorySlug: "mountain",
    desc: "غلیظ، تیره‌رنگ و با عطر قوی؛ برداشت‌شده از ارتفاعات البرز در اواخر تابستان.",
    longDesc:
      "عسل کوهی عسل‌ستان از کندوهایی برداشت می‌شود که در ارتفاعات البرز، دور از هرگونه کشاورزی صنعتی مستقر شده‌اند. رنگ تیره و غلظت بالای این عسل نتیجهٔ تغذیهٔ زنبورها از گل‌های کوهستانی متنوع در اواخر تابستان است. این عسل بدون هیچ حرارت‌دهی، تنها با صاف‌سازی سرد بسته‌بندی شده تا آنزیم‌ها و خواص طبیعی آن دست‌نخورده بماند.",
    price: 485000,
    tag: "پرفروش",
    inStock: true,
    weight: "۹۰۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1568657704598-602700bd9694?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  {
    slug: "desert-honey",
    name: "عسل گون کویری",
    category: "تک‌گل / گون",
    categorySlug: "desert",
    desc: "روشن، خوش‌عطر و با شیرینی ملایم؛ مناسب مصرف روزانه و صبحانه.",
    longDesc:
      "عسل گون از مناطق کویری مرکز ایران برداشت می‌شود، جایی که بوتهٔ گون در بهار شکوفا می‌شود. رنگ روشن و بافت نرم این عسل آن را برای مصرف روزانه و صبحانه بسیار مناسب کرده است.",
    price: 520000,
    tag: "جدید",
    inStock: true,
    weight: "۹۰۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1675419940490-051377d6bc6c?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  {
    slug: "wax-honey",
    name: "عسل با موم طبیعی",
    category: "ویژه / موم‌دار",
    categorySlug: "wax",
    desc: "عسل خام همراه با قطعات موم تازه، برای دوستداران طعم اصیل و سنتی.",
    longDesc:
      "این محصول عسل خام را همراه با قطعاتی از موم طبیعی کندو عرضه می‌کند؛ همان‌طور که در روش سنتی برداشت عسل رایج بوده است. مناسب کسانی که تجربهٔ اصیل‌تری از مصرف عسل می‌خواهند.",
    price: 610000,
    inStock: true,
    weight: "۷۵۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1675419940490-051377d6bc6c?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  {
    slug: "multi-flower-honey",
    name: "عسل چندگل طبیعی",
    category: "چندگل / بهاره",
    categorySlug: "multi",
    desc: "ترکیبی متعادل از چند نوع گل بهاره، مناسب استفادهٔ روزمرهٔ خانواده.",
    longDesc:
      "عسل چندگل حاصل تغذیهٔ زنبورها از چند نوع گیاه بهاره است و طعمی متعادل و ملایم دارد. انتخابی اقتصادی و مناسب برای مصرف روزانهٔ خانواده.",
    price: 390000,
    oldPrice: 430000,
    inStock: false,
    weight: "۹۰۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1568657704598-602700bd9694?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  {
    slug: "mountain-honey-small",
    name: "عسل کوهی طبیعی (بسته کوچک)",
    category: "تک‌گل / کوهستانی",
    categorySlug: "mountain",
    desc: "همان عسل کوهی محبوب، در بسته‌بندی کوچک‌تر برای هدیه یا امتحان.",
    longDesc:
      "نسخهٔ کوچک‌تر عسل کوهی طبیعی عسل‌ستان، مناسب هدیه دادن یا برای کسانی که می‌خواهند پیش از خرید بستهٔ بزرگ، طعم آن را امتحان کنند.",
    price: 210000,
    inStock: true,
    weight: "۳۰۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?q=80&w=1000&auto=format&fit=crop",
    ],
  },
  {
    slug: "desert-honey-large",
    name: "عسل گون کویری (بسته بزرگ)",
    category: "تک‌گل / گون",
    categorySlug: "desert",
    desc: "بستهٔ اقتصادی عسل گون کویری برای مصرف طولانی‌مدت خانواده.",
    longDesc:
      "بستهٔ ۱۵۰۰ گرمی عسل گون کویری، انتخابی مقرون‌به‌صرفه برای خانواده‌هایی که مصرف روزانهٔ بالاتری دارند.",
    price: 780000,
    inStock: true,
    weight: "۱۵۰۰ گرم",
    images: [
      "https://images.unsplash.com/photo-1642067958024-1a2d9f836920?q=80&w=1000&auto=format&fit=crop",
    ],
  },
];
