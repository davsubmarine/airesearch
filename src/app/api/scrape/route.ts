import { NextResponse } from 'next/server';
import { scrapeMultipleDays, scrapeNewPapers } from '@/lib/scraper';

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
    
    // Get mode parameter - 'days' or 'new'
    const mode = url.searchParams.get('mode') || 'days';
    
    if (mode === 'new') {
      // Start scraping new papers asynchronously
      scrapeNewPapers().catch(error => {
        console.error('Scraping error:', error);
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Started scraping all new papers since the most recent paper in the database.' 
      });
    } else {
      // Get days parameter from URL, default to 7 days
      const days = parseInt(url.searchParams.get('days') || '7', 10);
      
      // Start scraping asynchronously (we'll return immediately)
      scrapeMultipleDays(days).catch(error => {
        console.error('Scraping error:', error);
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Started scraping for the last ${days} days.` 
      });
    }
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start scraping' },
      { status: 500 }
    );
  }
}

// Add a POST endpoint to handle form submissions from the admin dashboard
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, days } = body;
    
    if (mode === 'new') {
      // Start scraping new papers asynchronously
      const result = await scrapeNewPapers();
      
      return NextResponse.json({ 
        success: true, 
        message: `Completed scraping ${result.totalPapers} new papers across ${result.daysProcessed} days.`,
        result
      });
    } else {
      // Default to 7 days if not specified
      const daysToScrape = parseInt(days || '7', 10);
      
      // Start scraping and wait for it to complete
      await scrapeMultipleDays(daysToScrape);
      
      return NextResponse.json({ 
        success: true, 
        message: `Completed scraping for the last ${daysToScrape} days.` 
      });
    }
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start scraping' },
      { status: 500 }
    );
  }
} 