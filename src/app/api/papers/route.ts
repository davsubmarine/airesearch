import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin, Tables } from '@/lib/supabase';

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
    
    // Parse query parameters
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const sortBy = url.searchParams.get('sortBy') || 'date'; // date or upvotes
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'; // asc or desc
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    
    // Build the query
    let query = supabase.from(Tables.papers).select('*', { count: 'exact' });
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    // Apply sorting
    if (sortBy === 'upvotes') {
      query = query.order('upvotes', { ascending: sortOrder === 'asc' });
    } else {
      // Default sort by date
      query = query.order('date', { ascending: sortOrder === 'asc' });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    query = query.range(startIndex, startIndex + limit - 1);
    
    // Execute the query
    const { data: papers, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Check for papers with summaries but has_summary = false
    if (papers && papers.length > 0) {
      // Get all paper IDs
      const paperIds = papers.map(paper => paper.id);
      
      // Check which papers have summaries
      const { data: summaries } = await supabaseAdmin
        .from(Tables.summaries)
        .select('paper_id')
        .in('paper_id', paperIds);
      
      if (summaries && summaries.length > 0) {
        // Create a set of paper IDs that have summaries
        const paperIdsWithSummaries = new Set(summaries.map(summary => summary.paper_id));
        
        // Find papers that have summaries but has_summary = false
        const papersToUpdate = papers
          .filter(paper => paperIdsWithSummaries.has(paper.id) && !paper.has_summary)
          .map(paper => paper.id);
        
        if (papersToUpdate.length > 0) {
          console.log(`Updating has_summary flag for ${papersToUpdate.length} papers`);
          
          // Update the has_summary flag for these papers
          await supabaseAdmin
            .from(Tables.papers)
            .update({ has_summary: true })
            .in('id', papersToUpdate);
          
          // Update the papers array in memory
          papers.forEach(paper => {
            if (paperIdsWithSummaries.has(paper.id)) {
              paper.has_summary = true;
            }
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      papers,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Error in papers API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve papers' },
      { status: 500 }
    );
  }
} 