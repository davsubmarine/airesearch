import { createClient } from '@supabase/supabase-js';
import { generateSummary, saveSummary } from '../src/lib/openai';
import { Paper } from '../src/types';
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

async function regenerateSummaries() {
  try {
    console.log('Finding papers with existing summaries...');
    
    // Get papers with has_summary=true
    const { data: papers, error: papersError } = await supabase
      .from('papers')
      .select('*')
      .eq('has_summary', true)
      .order('date', { ascending: false });
    
    if (papersError) {
      throw papersError;
    }
    
    if (!papers || papers.length === 0) {
      console.log('No papers found with summaries');
      return;
    }
    
    console.log(`Found ${papers.length} papers with summaries to regenerate`);
    
    // Process papers in batches to avoid rate limits
    const batchSize = 5;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      
      for (const paper of batch) {
        try {
          console.log(`Regenerating summary for paper: ${paper.title}`);
          
          // Generate a new summary with the updated structure
          const summary = await generateSummary(paper.url);
          
          if (!summary) {
            throw new Error('Failed to generate summary');
          }
          
          // Save the new summary
          await saveSummary(summary);
          
          console.log(`Successfully regenerated summary for paper: ${paper.title}`);
          successCount++;
          
          // Add a small delay between papers to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error processing paper ${paper.title}:`, error);
          errorCount++;
        }
      }
      
      // Add a delay between batches
      if (i + batchSize < papers.length) {
        console.log('Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`Regeneration complete. Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error regenerating summaries:', error);
  }
}

regenerateSummaries(); 