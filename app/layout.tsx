import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
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

const description =
  "An adaptive learning platform for trading education. Educational simulation only — no live trading, no financial advice.";

export const metadata: Metadata = {
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
