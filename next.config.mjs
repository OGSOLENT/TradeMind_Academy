/** @type {import('next').NextConfig} */

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const isDev = process.env.NODE_ENV !== "production";

/**
 * The Content Security Policy: the browser refuses to load or run anything
 * from a source not named here. It was missing until the September audit.
 *
 * Every source is here because the app needs it:
 *   script   'self', plus Google's API loader, which Firebase's Google
 *            sign-in pulls into the page.
 *   connect  Firebase Auth and Firestore (*.googleapis.com), and the
 *            Firebase auth domain.
 *   frame    the auth domain's helper iframe and Google's account chooser.
 *   media    'self': the lesson recordings are served by the app itself.
 *
 * Two honest weaknesses. 'unsafe-inline' is allowed for scripts because
 * Next 14 inlines its hydration data and the accessibility boot script
 * (lib/a11y-boot.ts) must run before React to avoid a flash of the wrong
 * theme; removing it needs per-request nonces, which need middleware, which
 * would expose the app to the middleware advisories on this Next major.
 * And 'unsafe-inline' for styles, because React and Framer Motion set
 * inline style attributes. The policy still blocks the thing CSP exists to
 * block: script loaded from anywhere other than this site and Google.
 *
 * The local emulators (and the dev server's hot reload) get their own
 * sources only in builds that use them.
 */
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

// The headers every response carries. Nothing here changes how the app
// behaves; it closes the usual doors (script injection, framing, MIME
// sniffing, referrer leakage, hardware permissions nobody asked for).
// Firebase's Google popup opens as a window on the firebaseapp.com auth
// domain, not in a frame, so denying frames is safe.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
  // Every image on the site is already served as-is (SVG posters and
  // figures, the OG image). Turning the optimizer off removes its API route,
  // which is where the image-optimisation advisories for this Next major
  // live (including the AVIF remote-code-execution one), and costs nothing
  // here.
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // The lesson recordings are content-stable: a lesson's file name
        // never changes, and a re-encode gets a new name. Without this they
        // go out as max-age=0 and every play re-downloads six megabytes,
        // which is the learner's data and the project's bandwidth for no
        // reason. A year, immutable, so a second viewing is free.
        source: "/videos-web/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
