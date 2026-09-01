import "./globals.css";

export const metadata = {
  title: "عسل طبیعی نیکا | طبیعت در هر قطره",
  description:
    "عسل طبیعی نیکا؛ عسل خالص و بدون افزودنی، مستقیم از طبیعت برای سلامتی شما و عزیزانتان.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=Allura&display=swap"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
