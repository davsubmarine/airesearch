import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['huggingface.co'], // Add domains for optimized images if needed
    unoptimized: false, // Enable image optimization
  },
  // Increase timeout for API routes if needed for OpenAI calls
  serverRuntimeConfig: {
    apiTimeout: 60 * 1000, // 60 seconds
  },
};

export default nextConfig;
