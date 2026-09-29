/** @type {import('next').NextConfig} */

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  ["default-src", "'self'"],
  ["script-src", "'self'", "'unsafe-inline'", "https://apis.google.com", ...(isDev ? ["'unsafe-eval'"] : [])],
  ["style-src", "'self'", "'unsafe-inline'"],
  ["img-src", "'self'", "data:", "blob:", "https://*.googleusercontent.com"],
  ["font-src", "'self'", "data:"],
  ["media-src", "'self'"],
  [
    "connect-src",
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    "https://*.firebaseapp.com",
    ...(useEmulators ? ["http://localhost:9099", "http://localhost:8080", "ws://localhost:8080", "http://127.0.0.1:9099", "http://127.0.0.1:8080"] : []),
    ...(isDev ? ["ws://localhost:*"] : []),
  ],
  [
    "frame-src",
    "https://*.firebaseapp.com",
    "https://accounts.google.com",
    "https://apis.google.com",
    ...(useEmulators ? ["http://localhost:9099"] : []),
  ],
  ["worker-src", "'self'", "blob:"],
  ["manifest-src", "'self'"],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
  ...(!isDev && !useEmulators ? [["upgrade-insecure-requests"]] : []),
]
  .map((d) => d.join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/videos-web/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
