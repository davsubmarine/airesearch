import { NextResponse } from 'next/server';
import { scrapeMultipleDays } from '@/lib/scraper';

export async function GET(request: Request) {
  try {
    // Get days parameter from URL, default to 7 days
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    
    // Start scraping asynchronously (we'll return immediately)
    scrapeMultipleDays(days).catch(error => {
      console.error('Scraping error:', error);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Started scraping for the last ${days} days.` 
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start scraping' },
      { status: 500 }
    );
  }
} 