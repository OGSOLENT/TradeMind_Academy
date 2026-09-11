/** @type {import('next').NextConfig} */
const nextConfig = {
  // `npm run dev:emulator` sets NEXT_DIST_DIR=.next-emulator so the emulator
  // server and the real one never share a build folder. I learned that two
  // servers writing the same .next corrupt each other's chunks and serve
  // stale 404s.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
