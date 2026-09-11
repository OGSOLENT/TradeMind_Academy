import type { MetadataRoute } from "next";

/** So the app installs to a home screen with the right name, colour and icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TradeMind Academy",
    short_name: "TradeMind",
    description: "An adaptive tutor for trading education. Simulated data only.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
