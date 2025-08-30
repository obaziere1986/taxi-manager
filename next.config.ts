import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  eslint: {
    // Ignorer les erreurs ESLint seulement en développement local
    ignoreDuringBuilds: isDevelopment,
  },
  typescript: {
    // Ignorer les erreurs TypeScript seulement en développement local
    ignoreBuildErrors: isDevelopment,
  }
};

export default nextConfig;
