/** @type {import('next').NextConfig} */
const nextConfig = {
  // `npm run dev:live` sets NEXT_DIST_DIR=.next-live so the emulator dev
  // server and the live one never share a build folder. I learned that two
  // servers writing the same .next corrupt each other's chunks and serve
  // stale 404s.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
