import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/legal", "/sign-in", "/sign-up"],
      disallow: ["/dev/", "/dashboard", "/lesson/", "/quiz/", "/skill-tree", "/review", "/mistakes", "/profile", "/settings", "/placement", "/practice", "/consent"],
    },
  };
}
