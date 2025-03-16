import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  swcMinify: true, // Use SWC minifier for better performance
  images: {
    domains: ['huggingface.co'], // Add domains for optimized images if needed
    unoptimized: false, // Enable image optimization
  },
  experimental: {
    // Enable server components for better performance
    serverComponentsExternalPackages: [],
  },
  // Increase timeout for API routes if needed for OpenAI calls
  serverRuntimeConfig: {
    apiTimeout: 60 * 1000, // 60 seconds
  },
};

export default nextConfig;
