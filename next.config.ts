import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  swcMinify: true, // Use SWC minifier for better performance
  images: {
    domains: ['arxiv.org'],
  },
  experimental: {
    serverExternalPackages: ['@supabase/supabase-js'],
  },
  // Increase timeout for API routes if needed for OpenAI calls
  serverRuntimeConfig: {
    apiTimeout: 60 * 1000, // 60 seconds
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  publicRuntimeConfig: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
