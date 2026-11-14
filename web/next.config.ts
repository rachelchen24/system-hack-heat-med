import path from "node:path";
import type { NextConfig } from "next";

// The app lives in web/, but it imports shared code from the repo root
// (../lib/thermal, ../lib/types, ../lib/patient) and reads JSON from
// ../data/kb and ../data/processed. Turbopack only resolves files inside its
// root, so the root is set to the repo root (one level up). This replaces the
// old webpack-era `experimental.externalDir` flag.
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
