export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          <div>
            <div className="foot-logo">عسل‌ستان</div>
            <p>عسل خام و طبیعی، مستقیم از زنبوردار به خانه شما. بدون واسطه، بدون حرارت، با آزمایش اصالت.</p>
          </div>
          <div>
            <h5>فروشگاه</h5>
            <ul>
              <li><a href="#products">همه محصولات</a></li>
              <li><a href="#products">عسل تک‌گل</a></li>
              <li><a href="#products">موم و فرآورده‌ها</a></li>
            </ul>
          </div>
          <div>
            <h5>درباره ما</h5>
            <ul>
              <li><a href="#intro">داستان عسل‌ستان</a></li>
              <li><a href="#process">فرآیند تولید</a></li>
              <li><a href="#reviews">نظرات مشتریان</a></li>
            </ul>
          </div>
          <div>
            <h5>پشتیبانی</h5>
            <ul>
              <li><a href="#">پیگیری سفارش</a></li>
              <li><a href="#">شرایط بازگشت کالا</a></li>
              <li><a href="#">تماس با ما</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© ۱۴۰۴ عسل‌ستان — تمامی حقوق محفوظ است.</span>
          <span>ساخته‌شده با ♥ برای دوستداران عسل خالص</span>
        </div>
      </div>
    </footer>
  );
}
