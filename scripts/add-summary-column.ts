import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSummaryColumn() {
  try {
    const { error } = await supabase
      .from('papers')
      .alter('summary', { type: 'text' });

    if (error) {
      throw error;
    }

    console.log('Successfully added summary column to papers table');
  } catch (error) {
    console.error('Error adding summary column:', error);
  }
}

// Run the script
addSummaryColumn(); 