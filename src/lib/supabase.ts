import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Client for browser-side operations (with restricted permissions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (with elevated permissions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// DB schema helper - defines table structure that matches our types
export const Tables = {
  papers: 'papers',
  summaries: 'summaries'
} as const; 