import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the demo phone load dev assets from the laptop over Wi-Fi / hotspot.
  // Add the laptop's IP here if it changes (venue Wi-Fi, phone hotspot).
  allowedDevOrigins: ["192.168.0.207", "192.168.*.*", "172.20.10.*", "10.*.*.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
