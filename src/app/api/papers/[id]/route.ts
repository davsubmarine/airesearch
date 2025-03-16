import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const paperId = await Promise.resolve(params.id);
    
    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: summary, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('paper_id', paperId)
      .single();

    if (error) {
      console.error('Error fetching summary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch summary' },
        { status: 500 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in GET /api/papers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 