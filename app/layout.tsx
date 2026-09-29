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

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const description =
  "An adaptive learning platform for trading education. Educational simulation only — no live trading, no financial advice.";

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
