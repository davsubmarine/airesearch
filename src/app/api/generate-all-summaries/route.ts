import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateSummary } from '@/lib/openai';

// Process papers in batches to avoid overwhelming the system
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000; // Delay between batches to respect rate limits

async function cleanupDatabase() {
  try {
    // First, delete all summaries
    const { error: deleteError } = await supabaseAdmin
      .from('summaries')
      .delete()
      .neq('id', 'dummy'); // This will match all rows

    if (deleteError) {
      console.error('Error deleting summaries:', deleteError);
      return false;
    }

    // Then reset has_summary flag for all papers
    const { error: updateError } = await supabaseAdmin
      .from('papers')
      .update({ has_summary: false })
      .neq('id', 'dummy'); // This will match all rows

    if (updateError) {
      console.error('Error updating papers:', updateError);
      return false;
    }

    console.log('Successfully cleaned up database - all summaries deleted and papers reset');
    return true;
  } catch (err) {
    console.error('Error in cleanupDatabase:', err);
    return false;
  }
}

async function processPaperBatch(papers: any[]) {
  return await Promise.all(papers.map(async (paper) => {
    try {
      console.log(`Generating summary for paper ${paper.id}: ${paper.title}`);
      
      // Generate summary
      const summary = await generateSummary(paper.url);
      
      // Save summary to database
      const { error: summaryError } = await supabaseAdmin
        .from('summaries')
        .insert([{
          id: summary.id, // Use the ID generated by the generateSummary function
          paper_id: paper.id,
          tldr: summary.tldr,
          key_innovation: summary.key_innovation,
          practical_applications: summary.practical_applications,
          limitations_future_work: summary.limitations_future_work,
          key_terms: summary.key_terms,
          created_at: summary.created_at,
          updated_at: summary.updated_at
        }]);

      if (summaryError) {
        throw summaryError;
      }

      // Update paper has_summary flag
      const { error: updateError } = await supabaseAdmin
        .from('papers')
        .update({ has_summary: true })
        .eq('id', paper.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`Successfully generated summary for paper ${paper.id}`);
      return { success: true, paperId: paper.id };
    } catch (err: any) {
      // Set has_summary to false in case of error
      await supabaseAdmin
        .from('papers')
        .update({ has_summary: false })
        .eq('id', paper.id);

      console.error(`Error processing paper ${paper.id}:`, err);
      return { 
        success: false, 
        paperId: paper.id, 
        error: err.message || 'Unknown error'
      };
    }
  }));
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    // Get all papers without summaries
    const { data: papers, error: papersError } = await supabaseAdmin
      .from('papers')
      .select('id, title, url')
      .eq('has_summary', false)
      .order('date', { ascending: false });

    if (papersError) {
      throw papersError;
    }

    if (!papers || papers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No papers found that need summaries',
        results: {
          total: 0,
          processed: 0,
          succeeded: 0,
          failed: 0,
          errors: []
        }
      });
    }

    const results = {
      total: papers.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as { paperId: string; error: string }[]
    };

    // Process papers in batches
    for (let i = 0; i < papers.length; i += BATCH_SIZE) {
      const batch = papers.slice(i, i + BATCH_SIZE);
      const batchResults = await processPaperBatch(batch);
      
      // Update results
      results.processed += batch.length;
      
      batchResults.forEach(result => {
        if (result.success) {
          results.succeeded++;
        } else {
          results.failed++;
          results.errors.push({
            paperId: result.paperId,
            error: result.error
          });
        }
      });

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < papers.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (err: any) {
    console.error('Error in generate-all-summaries:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Failed to generate summaries',
      results: {
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [{ paperId: 'unknown', error: err.message || 'Unknown error' }]
      }
    }, { status: 500 });
  }
} 