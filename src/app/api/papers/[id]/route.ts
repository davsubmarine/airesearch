import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Define the route handler according to Next.js 15 conventions
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const paperId = context.params.id;
    
    if (!paperId) {
      return NextResponse.json(
        { success: false, error: 'Paper ID is required' },
        { status: 400 }
      );
    }
    
    const { data: summary, error } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('paper_id', paperId)
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      summary
    });
  } catch (err) {
    console.error('Error fetching paper summary:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch paper summary' },
      { status: 500 }
    );
  }
} 