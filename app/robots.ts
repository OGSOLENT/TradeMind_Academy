import type { MetadataRoute } from "next";

/** Public pages are fine to index. The signed-in area and my dev pages aren't. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal", "/sign-in", "/sign-up"],
      disallow: ["/dev/", "/dashboard", "/lesson/", "/quiz/", "/skill-tree", "/review", "/mistakes", "/profile", "/settings", "/placement", "/practice", "/consent"],
    },
  };
}
