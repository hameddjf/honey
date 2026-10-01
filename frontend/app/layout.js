import "./globals.css";
import { SITE_URL, SITE_NAME, organizationJsonLd, websiteJsonLd, jsonLdProps } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | طبیعت در هر قطره`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "عسل طبیعی نیکا؛ عسل خالص و بدون افزودنی، مستقیم از طبیعت برای سلامتی شما و عزیزانتان.",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fa_IR",
    url: SITE_URL,
    title: `${SITE_NAME} | طبیعت در هر قطره`,
    description:
      "عسل طبیعی نیکا؛ عسل خالص و بدون افزودنی، مستقیم از طبیعت برای سلامتی شما و عزیزانتان.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | طبیعت در هر قطره`,
    description:
      "عسل طبیعی نیکا؛ عسل خالص و بدون افزودنی، مستقیم از طبیعت برای سلامتی شما و عزیزانتان.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <script {...jsonLdProps(organizationJsonLd())} />
        <script {...jsonLdProps(websiteJsonLd())} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
