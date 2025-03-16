import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Define the route handler according to Next.js 15 conventions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Need to await params in Next.js 15
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch both paper and summary data
    const [paperResult, summaryResult] = await Promise.all([
      supabaseAdmin
        .from('papers')
        .select('*')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('summaries')
        .select('*')
        .eq('paper_id', id)
        .single()
    ]);
    
    if (paperResult.error) {
      return NextResponse.json(
        { success: false, error: paperResult.error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      paper: paperResult.data,
      summary: summaryResult.data || null
    });
  } catch (err) {
    console.error('Error fetching paper and summary:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch paper and summary' },
      { status: 500 }
    );
  }
} 