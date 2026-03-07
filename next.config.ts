import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'canvas'],
  devIndicators: {
    position: 'top-right',
  },
};

export default nextConfig;
