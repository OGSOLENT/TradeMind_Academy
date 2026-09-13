import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { PREFS_BOOT_SCRIPT } from "@/lib/a11y-boot";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// The readable typeface, for the accessibility setting. Loaded up front so
// switching it on is instant, but it's only used when data-font="readable".
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const description =
  "An adaptive learning platform for trading education. Educational simulation only — no live trading, no financial advice.";

// Absolute URLs for the open-graph tags. Vercel sets VERCEL_URL on every
// deployment; NEXT_PUBLIC_SITE_URL wins when it's set (the production
// domain), and localhost is the fallback for a local build.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TradeMind Academy",
    template: "%s · TradeMind Academy",
  },
  description,
  applicationName: "TradeMind Academy",
  // The dev and kitchen-sink routes are for me, not for search engines.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "TradeMind Academy",
    title: "TradeMind Academy",
    description,
  },
  twitter: {
    card: "summary",
    title: "TradeMind Academy",
    description,
  },
  appleWebApp: {
    title: "TradeMind",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning because the boot script below stamps the
    // learner's saved accessibility choices onto <html> before React loads,
    // and React would otherwise complain about attributes it didn't render.
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
