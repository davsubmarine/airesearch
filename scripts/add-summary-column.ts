import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSummaryColumn() {
  try {
    // Use direct SQL to alter the table
    const { error } = await supabase.rpc('add_summary_column', {
      sql: `
        ALTER TABLE papers
        ADD COLUMN IF NOT EXISTS summary text;
      `
    });

    if (error) {
      throw error;
    }

    console.log('Successfully added summary column to papers table');
  } catch (error) {
    console.error('Error adding summary column:', error);
    process.exit(1);
  }
}

// Run the script
addSummaryColumn(); 