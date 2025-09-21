import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages compatibility
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // Image optimization for static export
  images: {
    unoptimized: true,
  },
  
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
