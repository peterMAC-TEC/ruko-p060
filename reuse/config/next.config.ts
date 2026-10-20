import path from "path";
import type { NextConfig } from "next";

// Cache Components is off on purpose: every page here is per-tab and dynamic,
// so the classic request-time rendering model is simpler (see docs/DECISIONS.md).
// Tab pages carry secrets in their URLs: never index them, never leak them as a referrer.
const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "private, no-store" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/t/:path*", headers: privateHeaders },
      { source: "/stats", headers: privateHeaders },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "X-Frame-Options", value: "DENY" }] },
    ];
  },
  turbopack: {
    // Pin the root: a stray lockfile in the user folder otherwise confuses root detection.
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
