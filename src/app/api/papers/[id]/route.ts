import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Update the Params interface to match Next.js conventions
type RouteParams = {
  id: string;
};

// Update the function signature to use the correct parameter structure
export async function GET(
  request: Request, 
  { params }: { params: RouteParams }
) {
  try {
    const paperId = params.id;
    
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