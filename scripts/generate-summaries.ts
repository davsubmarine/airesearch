import { createClient } from '@supabase/supabase-js';
import { generateSummary } from '../src/lib/summarizer';
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

async function generateSummaries() {
  try {
    // Fetch papers without summaries
    const { data: papers, error } = await supabase
      .from('papers')
      .select('*')
      .is('summary', null)
      .order('date', { ascending: true });

    if (error) throw error;

    if (!papers || papers.length === 0) {
      console.log('No papers found without summaries');
      return;
    }

    console.log(`Found ${papers.length} papers without summaries`);

    // Process papers in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      
      for (const paper of batch) {
        try {
          console.log(`Generating summary for paper: ${paper.title}`);
          
          const summary = await generateSummary(paper.abstract);
          
          // Update the paper with the new summary
          const { error: updateError } = await supabase
            .from('papers')
            .update({ summary })
            .eq('id', paper.id);

          if (updateError) throw updateError;
          
          console.log(`Successfully updated summary for paper: ${paper.title}`);
          
          // Add a small delay between papers to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error processing paper ${paper.title}:`, error);
        }
      }
      
      // Add a delay between batches
      if (i + batchSize < papers.length) {
        console.log('Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('Finished generating summaries');
  } catch (error) {
    console.error('Error generating summaries:', error);
  }
}

// Run the script
generateSummaries(); 