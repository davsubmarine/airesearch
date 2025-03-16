import { NextRequest, NextResponse } from 'next/server';
import { scrapeMultipleDays, scrapeNewPapers, scrapePapers, savePapers } from '@/lib/scraper';
import dayjs from 'dayjs';

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
    papersSoFar?: number;
    currentDate?: string;
    logs?: Array<{timestamp: string; message: string}>;
  } | null
};

// Maximum number of log entries to keep
const MAX_LOG_ENTRIES = 500;

// Helper function to add a log entry with timestamp
function addLogEntry(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message };
  
  if (!scrapingStatus.progress) {
    scrapingStatus.progress = {
      currentDay: 0,
      totalDays: 0,
      logs: [logEntry]
    };
  } else {
    if (!scrapingStatus.progress.logs) {
      scrapingStatus.progress.logs = [];
    }
    
    scrapingStatus.progress.logs.push(logEntry);
    
    // Keep only the most recent logs
    if (scrapingStatus.progress.logs.length > MAX_LOG_ENTRIES) {
      scrapingStatus.progress.logs = scrapingStatus.progress.logs.slice(-MAX_LOG_ENTRIES);
    }
  }
  
  // Also log to console for server-side visibility
  console.log(`[SCRAPER] ${message}`);
  
  return logEntry;
}

// Helper function to update progress (not exported)
function updateScrapingProgress(progress: Partial<NonNullable<typeof scrapingStatus.progress>>) {
  if (!scrapingStatus.progress) {
    scrapingStatus.progress = {
      currentDay: progress.currentDay || 0,
      totalDays: progress.totalDays || 0,
      logs: []
    };
  } else {
    // Update existing progress with new values
    scrapingStatus.progress = {
      ...scrapingStatus.progress,
      ...progress
    };
  }

  // Add log entries if provided
  if (progress.logs && progress.logs.length > 0) {
    // This handles the case where logs are already formatted with timestamps
    if (!scrapingStatus.progress.logs) {
      scrapingStatus.progress.logs = [];
    }
    
    scrapingStatus.progress.logs.push(...progress.logs);
    
    // Keep only the most recent logs
    if (scrapingStatus.progress.logs.length > MAX_LOG_ENTRIES) {
      scrapingStatus.progress.logs = scrapingStatus.progress.logs.slice(-MAX_LOG_ENTRIES);
    }
  }
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
    scrapingStatus.progress = {
      currentDay: 0,
      totalDays: 0,
      papersSoFar: 0,
      logs: []
    };
    
    addLogEntry(`Starting new scraping operation in ${mode} mode`);
    
    if (mode === 'days') {
      // Get days from request body
      let body;
      try {
        body = await request.json();
      } catch (error) {
        scrapingStatus.isRunning = false;
        scrapingStatus.lastError = 'Invalid request body. Expected JSON with a "days" property.';
        addLogEntry(`Error: ${scrapingStatus.lastError}`);
        return NextResponse.json(
          { error: scrapingStatus.lastError },
          { status: 400 }
        );
      }
      
      const days = parseInt(body.days) || 7;
      
      // Validate days - allow up to 365 days
      if (isNaN(days) || days < 1) {
        scrapingStatus.isRunning = false;
        scrapingStatus.lastError = 'Invalid days parameter. Must be a positive number.';
        addLogEntry(`Error: ${scrapingStatus.lastError}`);
        return NextResponse.json(
          { error: scrapingStatus.lastError },
          { status: 400 }
        );
      }
      
      // Enforce maximum days limit of 365 days
      const limitedDays = Math.min(365, days);
      if (limitedDays < days) {
        const message = `Limiting requested scraping days from ${days} to ${limitedDays} (maximum allowed)`;
        addLogEntry(message);
      }
      
      scrapingStatus.daysToScrape = limitedDays;
      addLogEntry(`Will scrape papers for the last ${limitedDays} days`);
      
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
    addLogEntry(`Fatal error: ${scrapingStatus.lastError}`);
    
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
    updateScrapingProgress({
      currentDay: 0,
      totalDays: days,
      papersSoFar: 0
    });
    
    addLogEntry(`Starting to scrape papers for the last ${days} days...`);
    
    // Create a wrapper around scrapeMultipleDays that updates progress
    const scrapeWithProgress = async () => {
      try {
        let totalPapers = 0;
        
        for (let i = 0; i < days; i++) {
          // Calculate the date for this offset
          const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
          
          // Update progress
          updateScrapingProgress({
            currentDay: i + 1,
            totalDays: days,
            currentDate: date
          });
          
          addLogEntry(`Processing day ${i + 1}/${days}: ${date}`);
          
          try {
            // Scrape for this day
            const dayResult = await scrapeForDay(i);
            totalPapers += dayResult;
            
            // Update total papers so far
            updateScrapingProgress({
              papersSoFar: totalPapers
            });
            
            addLogEntry(`Day ${i + 1}/${days} complete. Found ${dayResult} papers. Total so far: ${totalPapers}`);
          } catch (dayError) {
            const errorMessage = `Error processing day ${i + 1}/${days} (${date}): ${dayError instanceof Error ? dayError.message : 'Unknown error'}`;
            addLogEntry(errorMessage);
            // Continue with the next day even if there's an error
          }
          
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
        
        const completionMessage = `Completed scraping for ${days} days. Total papers: ${totalPapers}`;
        addLogEntry(completionMessage);
      } catch (error) {
        // Update status with error
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
        
        const errorMessage = `Error in background scraping: ${scrapingStatus.lastError}`;
        addLogEntry(errorMessage);
      }
    };
    
    // Start the scraping process in the background
    scrapeWithProgress().catch(error => {
      // This catch is for any uncaught errors in the async function
      scrapingStatus.isRunning = false;
      scrapingStatus.endTime = new Date().toISOString();
      scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
      addLogEntry(`Uncaught error in scraping process: ${scrapingStatus.lastError}`);
    });
    
    return true;
  } catch (error) {
    // Update status with error
    scrapingStatus.isRunning = false;
    scrapingStatus.endTime = new Date().toISOString();
    scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
    
    const errorMessage = `Error starting background scraping: ${scrapingStatus.lastError}`;
    addLogEntry(errorMessage);
    
    return false;
  }
}

// Function to scrape new papers in the background
async function scrapeNewInBackground() {
  try {
    // Initialize progress
    updateScrapingProgress({
      currentDay: 0,
      totalDays: 0,
      papersSoFar: 0
    });
    
    addLogEntry('Starting to scrape new papers...');
    
    // Start the scraping process in the background
    const scrapeWithProgress = async () => {
      try {
        // Get the most recent paper date from the database
        const { getMostRecentPaperDate } = require('@/lib/scraper');
        const mostRecentDate = await getMostRecentPaperDate();
        
        // Calculate the number of days to scrape
        const today = dayjs().format('YYYY-MM-DD');
        const dayDiff = dayjs(today).diff(dayjs(mostRecentDate), 'day');
        
        // If the most recent paper is from today, we'll still check today again
        // to make sure we have all the latest papers
        const daysToScrape = Math.max(1, dayDiff);
        
        addLogEntry(`Most recent paper date in database: ${mostRecentDate}. Will scrape ${daysToScrape} days.`);
        updateScrapingProgress({
          totalDays: daysToScrape
        });
        
        // Now use the scrapeByDaysInBackground function to do the actual scraping
        scrapingStatus.daysToScrape = daysToScrape;
        await scrapeByDaysInBackground(daysToScrape);
      } catch (error) {
        // Update status with error
        scrapingStatus.isRunning = false;
        scrapingStatus.endTime = new Date().toISOString();
        scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
        
        const errorMessage = `Error in background scraping: ${scrapingStatus.lastError}`;
        addLogEntry(errorMessage);
      }
    };
    
    // Start the scraping process in the background
    scrapeWithProgress().catch(error => {
      // This catch is for any uncaught errors in the async function
      scrapingStatus.isRunning = false;
      scrapingStatus.endTime = new Date().toISOString();
      scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
      addLogEntry(`Uncaught error in scraping process: ${scrapingStatus.lastError}`);
    });
    
    return true;
  } catch (error) {
    // Update status with error
    scrapingStatus.isRunning = false;
    scrapingStatus.endTime = new Date().toISOString();
    scrapingStatus.lastError = error instanceof Error ? error.message : 'An unknown error occurred';
    
    const errorMessage = `Error starting background scraping: ${scrapingStatus.lastError}`;
    addLogEntry(errorMessage);
    
    return false;
  }
}

// Helper function to scrape for a specific day
async function scrapeForDay(dayOffset: number): Promise<number> {
  try {
    // Calculate the date for this offset
    const date = dayjs().subtract(dayOffset, 'day').format('YYYY-MM-DD');
    
    // Update progress with more details
    updateScrapingProgress({
      currentDay: dayOffset + 1,
      totalDays: scrapingStatus.daysToScrape || 1,
      currentBatch: 0,
      totalBatches: 0,
      currentDate: date
    });
    
    addLogEntry(`Scraping for day ${dayOffset + 1}/${scrapingStatus.daysToScrape}: ${date}`);
    
    try {
      // Scrape papers for this day
      const papers = await scrapePapers(date);
      
      if (papers.length > 0) {
        addLogEntry(`Found ${papers.length} papers for date: ${date}`);
        
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
          
          addLogEntry(`Saving batch ${i + 1}/${totalBatches} (${batch.length} papers) for day ${date}`);
          
          try {
            // Save this batch
            await savePapers(batch);
            addLogEntry(`Successfully saved batch ${i + 1}/${totalBatches}`);
          } catch (batchError) {
            addLogEntry(`Error saving batch ${i + 1}/${totalBatches}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`);
            // Continue with the next batch even if there's an error
          }
          
          // Small delay between batches
          if (i < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        addLogEntry(`Successfully processed all ${papers.length} papers for date: ${date}`);
      } else {
        addLogEntry(`No papers found for date: ${date}`);
      }
      
      return papers.length;
    } catch (error) {
      const errorMessage = `Error processing papers for date ${date}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      addLogEntry(errorMessage);
      throw error; // Re-throw to be caught by the caller
    }
  } catch (error) {
    const errorMessage = `Error scraping for day offset ${dayOffset}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    addLogEntry(errorMessage);
    throw error; // Re-throw to be caught by the caller
  }
} 