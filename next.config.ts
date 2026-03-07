import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'canvas'],
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: {
    position: 'top-right',
  },
};

export default nextConfig;
