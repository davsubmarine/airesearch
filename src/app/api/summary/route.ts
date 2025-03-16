import { NextResponse } from 'next/server';
import { generateSummary, saveSummary } from '@/lib/openai';
import { supabaseAdmin as supabase, Tables } from '@/lib/supabase';
import { Paper, Summary } from '@/types';

// Generate a summary for a paper
export async function POST(request: Request) {
  try {
    const { paperId } = await request.json();
    
    if (!paperId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }
    
    // Get the paper
    const { data: paper, error: paperError } = await supabase
      .from(Tables.papers)
      .select('*')
      .eq('id', paperId)
      .single();
    
    if (paperError || !paper) {
      return NextResponse.json(
        { success: false, error: 'Paper not found' },
        { status: 404 }
      );
    }
    
    // Check if summary already exists
    const { data: existingSummary, error: summaryError } = await supabase
      .from(Tables.summaries)
      .select('*')
      .eq('paper_id', paperId)
      .single();
    
    if (existingSummary) {
      // Update paper has_summary flag if needed
      if (!paper.has_summary) {
        await supabase
          .from(Tables.papers)
          .update({ has_summary: true })
          .eq('id', paperId);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Summary already exists',
        summary: existingSummary
      });
    }
    
    // Generate the summary using the paper object
    const summary = await generateSummary(paper);
    
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate summary' },
        { status: 500 }
      );
    }
    
    // Save the summary
    await saveSummary(summary);
    
    // Update paper has_summary flag
    await supabase
      .from(Tables.papers)
      .update({ has_summary: true })
      .eq('id', paperId);
    
    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error in summary API:', error);
    
    // Return a more specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Get a summary for a paper
export async function GET(request: Request) {
  try {
    // Use a try-catch block specifically for URL parsing
    let url;
    try {
      url = new URL(request.url);
    } catch (urlError) {
      console.error('Invalid URL in request:', request.url);
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }
    
    const paperId = url.searchParams.get('paperId');
    
    if (!paperId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }
    
    // Get the summary
    const { data: summary, error } = await supabase
      .from(Tables.summaries)
      .select('*')
      .eq('paper_id', paperId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error in summary API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve summary' },
      { status: 500 }
    );
  }
} 