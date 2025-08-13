import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint pendant le build en dev
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build en dev
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
