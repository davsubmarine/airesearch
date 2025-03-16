import { NextRequest, NextResponse } from 'next/server';
import { scrapeMultipleDays, scrapeNewPapers } from '@/lib/scraper';

// Global object to track scraping status
const scrapingStatus = {
  isRunning: false,
  startTime: null as string | null,
  endTime: null as string | null,
  lastError: null as string | null,
  mode: null as string | null,
  daysToScrape: null as number | null,
  lastResult: null as { totalPapers: number; daysProcessed: number } | null,
  progress: null as { 
    currentDay: number; 
    totalDays: number;
    currentBatch?: number;
    totalBatches?: number;
  } | null
};

// Helper function to update progress (not exported)
function updateScrapingProgress(progress: typeof scrapingStatus.progress) {
  scrapingStatus.progress = progress;
}

export async function GET(request: NextRequest) {
  // Check if this is a status request
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  
  if (statusParam === 'true') {
    return NextResponse.json(scrapingStatus);
  }
  
  return NextResponse.json({ message: 'Use POST to start scraping' });
}

export async function POST(request: NextRequest) {
  try {
    // If scraping is already in progress, return status
    if (scrapingStatus.isRunning) {
      return NextResponse.json({
        message: `Scraping already in progress (${scrapingStatus.mode} mode). Started at ${scrapingStatus.startTime}`,
        status: scrapingStatus
      });
    }
    
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    
    if (!mode || (mode !== 'days' && mode !== 'new')) {
      return NextResponse.json(
        { error: 'Invalid mode. Use "days" or "new".' },
        { status: 400 }
      );
    }
    
    // Reset status for new scraping operation
    scrapingStatus.isRunning = true;
    scrapingStatus.startTime = new Date().toISOString();
    scrapingStatus.endTime = null;
    scrapingStatus.lastError = null;
    scrapingStatus.mode = mode;
    scrapingStatus.lastResult = null;
    scrapingStatus.progress = null;
    
    if (mode === 'days') {
      // Get days from request body
      let body;
      try {
        body = await request.json();
      } catch (error) {
        scrapingStatus.isRunning = false;
        scrapingStatus.lastError = 'Invalid request body. Expected JSON with a "days" property.';
        return NextResponse.json(
          { error: scrapingStatus.lastError },
          { status: 400 }
        );
      }
      
      const days = parseInt(body.days) || 7;
      
      // Validate days - strictly enforce the 30-day limit
      if (isNaN(days) || days < 1) {
        scrapingStatus.isRunning = false;
        scrapingStatus.lastError = 'Invalid days parameter. Must be a positive number.';
        return NextResponse.json(
          { error: scrapingStatus.lastError },
          { status: 400 }
        );
      }
      
      // Enforce maximum days limit
      const limitedDays = Math.min(30, days);
      if (limitedDays < days) {
        console.log(`Limiting requested scraping days from ${days} to ${limitedDays} to prevent timeouts`);
      }
      
      scrapingStatus.daysToScrape = limitedDays;
      
      // Start scraping in the background
      scrapeByDaysInBackground(limitedDays);
      
      return NextResponse.json({
        message: `Started scraping papers for the last ${limitedDays} days in the background.${limitedDays < days ? ' (Limited from ' + days + ' days to prevent timeouts)' : ''}`,
        status: scrapingStatus
      });
    } else if (mode === 'new') {
      // Start scraping in the background
      scrapeNewInBackground();
      
      return NextResponse.json({
        message: 'Started scraping new papers in the background.',
        status: scrapingStatus
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid mode. Use "days" or "new".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in scrape API:', error);
    
    // Update status with error
    scrapingStatus.isRunning = false;
    scrapingStatus.endTime = new Date().toISOString();
    scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { error: scrapingStatus.lastError },
      { status: 500 }
    );
  }
}

// Function to scrape by days in the background
async function scrapeByDaysInBackground(days: number) {
  try {
    // Initialize progress
    scrapingStatus.progress = {
      currentDay: 0,
      totalDays: days
    };
    
    // Create a wrapper around scrapeMultipleDays that updates progress
    const scrapeWithProgress = async () => {
      try {
        let totalPapers = 0;
        
        for (let i = 0; i < days; i++) {
          // Update progress
          scrapingStatus.progress = {
            currentDay: i + 1,
            totalDays: days
          };
          
          // Scrape for this day
          const dayResult = await scrapeForDay(i);
          totalPapers += dayResult;
          
          // Small delay to prevent overwhelming the server
          if (i < days - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Update status on completion
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastResult = {
          totalPapers,
          daysProcessed: days
        };
        scrapingStatus.progress = null;
        
        console.log(`Completed scraping for ${days} days. Total papers: ${totalPapers}`);
      } catch (error) {
        // Update status with error
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
        scrapingStatus.progress = null;
        
        console.error('Error in background scraping:', error);
      }
    };
    
    // Start the scraping process in the background
    scrapeWithProgress();
    
    return true;
  } catch (error) {
    // Update status with error
    scrapingStatus.isRunning = false;
    scrapingStatus.endTime = new Date().toISOString();
    scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
    scrapingStatus.progress = null;
    
    console.error('Error starting background scraping:', error);
    return false;
  }
}

// Function to scrape new papers in the background
async function scrapeNewInBackground() {
  try {
    // Start the scraping process in the background
    const scrapeWithProgress = async () => {
      try {
        const result = await scrapeNewPapers();
        
        // Update status on completion
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastResult = result;
        scrapingStatus.progress = null;
        
        console.log(`Completed scraping new papers. Total papers: ${result.totalPapers}`);
      } catch (error) {
        // Update status with error
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
        scrapingStatus.progress = null;
        
        console.error('Error in background scraping:', error);
      }
    };
    
    // Start the scraping process in the background
    scrapeWithProgress();
    
    return true;
  } catch (error) {
    // Update status with error
    scrapingStatus.isRunning = false;
    scrapingStatus.endTime = new Date().toISOString();
    scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
    
    console.error('Error starting background scraping:', error);
    return false;
  }
}

// Helper function to scrape for a specific day
async function scrapeForDay(dayOffset: number): Promise<number> {
  try {
    // Import dayjs for date calculations
    const dayjs = require('dayjs');
    
    // Calculate the date for this offset
    const date = dayjs().subtract(dayOffset, 'day').format('YYYY-MM-DD');
    
    // Update progress with more details
    updateScrapingProgress({
      currentDay: dayOffset + 1,
      totalDays: scrapingStatus.daysToScrape || 1,
      currentBatch: 0,
      totalBatches: 0
    });
    
    console.log(`Scraping for day ${dayOffset + 1}/${scrapingStatus.daysToScrape}: ${date}`);
    
    // Import the scraper functions directly to avoid circular dependencies
    const { scrapePapers, savePapers } = require('@/lib/scraper');
    
    try {
      // Scrape papers for this day
      const papers = await scrapePapers(date);
      
      if (papers.length > 0) {
        // Calculate batches for progress tracking
        const batchSize = 20;
        const totalBatches = Math.ceil(papers.length / batchSize);
        
        // Process in batches
        for (let i = 0; i < totalBatches; i++) {
          // Update progress before saving this batch
          updateScrapingProgress({
            currentDay: dayOffset + 1,
            totalDays: scrapingStatus.daysToScrape || 1,
            currentBatch: i + 1,
            totalBatches
          });
          
          // Get the current batch
          const start = i * batchSize;
          const end = Math.min(start + batchSize, papers.length);
          const batch = papers.slice(start, end);
          
          console.log(`Saving batch ${i + 1}/${totalBatches} (${batch.length} papers) for day ${date}`);
          
          // Save this batch
          await savePapers(batch);
          
          // Small delay between batches
          if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        console.log(`No papers found for date: ${date}`);
      }
      
      return papers.length;
    } catch (error) {
      console.error(`Error processing papers for date ${date}:`, error);
      return 0;
    }
  } catch (error) {
    console.error(`Error scraping for day offset ${dayOffset}:`, error);
    return 0;
  }
} 