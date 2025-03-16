import { NextResponse } from 'next/server';
import { supabase, Tables } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    
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