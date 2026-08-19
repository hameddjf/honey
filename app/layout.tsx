import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "عسل‌ستان | عسل خالص و طبیعی",
  description:
    "عسل خام و طبیعی، مستقیم از زنبوردار به خانه شما. بدون واسطه، بدون حرارت، با آزمایش اصالت.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
