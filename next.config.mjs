/** @type {import('next').NextConfig} */

// The headers every response carries in production. Nothing here changes
// how the app behaves; it closes the usual doors (framing, MIME sniffing,
// referrer leakage, hardware permissions nobody asked for). Firebase's
// Google popup runs on the firebaseapp.com auth domain, not in a frame, so
// denying frames is safe.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig = {
  // `npm run dev:emulator` sets NEXT_DIST_DIR=.next-emulator so the emulator
  // server and the real one never share a build folder. I learned that two
  // servers writing the same .next corrupt each other's chunks and serve
  // stale 404s.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
