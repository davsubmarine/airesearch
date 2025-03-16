import { Paper } from '../types';
import { supabaseAdmin, Tables } from './supabase';
import dayjs from 'dayjs';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Define interfaces for the Hugging Face paper data structure
interface PaperData {
  id: string;
  title: string;
  summary: string;
  upvotes: number;
  [key: string]: any; // For any additional properties
}

interface DailyPaperItem {
  paper: PaperData;
  [key: string]: any; // For any additional properties
}

interface DailyPapersData {
  dailyPapers: DailyPaperItem[];
  [key: string]: any; // For any additional properties
}

/**
 * Scrapes papers from Hugging Face for a specific date
 * Note: For future dates or dates with no papers (like holidays),
 * Hugging Face redirects to the nearest date with papers.
 * This function handles those redirects gracefully.
 */
export async function scrapePapers(date: string): Promise<Paper[]> {
  let papers: Paper[] = [];
  
  try {
    // Format date for the URL
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    const url = `https://huggingface.co/papers/date/${formattedDate}`;
    
    console.log(`Scraping papers for date: ${formattedDate} from ${url}`);
    
    // Fetch the page with a timeout
    const response = await axios.get(url, { 
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Check if we were redirected (happens for future dates or dates with no papers)
    const finalUrl = response.request?.res?.responseUrl || url;
    if (finalUrl !== url) {
      console.log(`Note: Redirected to ${finalUrl} (original URL was ${url})`);
    }
    
    // Load the HTML with cheerio
    const $ = cheerio.load(response.data);
    
    // Find the data element that contains the JSON - specifically the DailyPapers component
    const dataElement = $('.SVELTE_HYDRATER[data-target="DailyPapers"]');
    
    if (!dataElement.length) {
      console.log('Could not find the DailyPapers data element on the page');
      return papers;
    }
    
    // Get the data-props attribute which contains the JSON
    const dataProps = dataElement.attr('data-props');
    
    if (!dataProps) {
      console.log('No data-props attribute found on the data element');
      return papers;
    }
    
    // Parse the JSON data
    const dailyPapersData: DailyPapersData = JSON.parse(dataProps);
    
    // Check if the dailyPapers array exists and has items
    if (!dailyPapersData.dailyPapers || !Array.isArray(dailyPapersData.dailyPapers)) {
      console.log('No dailyPapers array found in the data');
      return papers;
    }
    
    if (dailyPapersData.dailyPapers.length === 0) {
      console.log(`No papers found for date: ${formattedDate}`);
      return papers;
    }
    
    // Extract the paper data
    papers = dailyPapersData.dailyPapers
      .map((item: DailyPaperItem) => {
        if (!item.paper) return null;
        
        const paper = item.paper;
        return {
          id: paper.id || '',
          title: paper.title || '',
          abstract: paper.summary || '',
          date: formattedDate,
          url: `https://huggingface.co/papers/${paper.id}`,
          upvotes: paper.upvotes || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          has_summary: false
        } as Paper;
      })
      .filter((paper: Paper | null): paper is Paper => paper !== null);
    
    console.log(`Successfully scraped ${papers.length} papers for date: ${formattedDate}`);
    
    return papers;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error(`Timeout error scraping papers for date ${date}: Request took too long`);
    } else if (axios.isAxiosError(error) && error.response) {
      console.error(`Error scraping papers for date ${date}: Server responded with status ${error.response.status}`);
    } else {
      console.error(`Error scraping papers for date ${date}:`, error);
    }
    return [];
  }
}

/**
 * Saves papers to the database
 */
export async function savePapers(papers: Paper[]): Promise<void> {
  try {
    if (papers.length === 0) {
      console.log('No papers to save');
      return;
    }
    
    console.log(`Saving ${papers.length} papers to the database...`);
    
    // Save papers in batches to avoid timeouts
    const batchSize = 20;
    const batches = [];
    
    for (let i = 0; i < papers.length; i += batchSize) {
      batches.push(papers.slice(i, i + batchSize));
    }
    
    console.log(`Split ${papers.length} papers into ${batches.length} batches of max ${batchSize} papers each`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Saving batch ${i + 1}/${batches.length} (${batch.length} papers)...`);
      
      const { error } = await supabaseAdmin
        .from(Tables.papers)
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error saving batch ${i + 1}:`, error);
      } else {
        console.log(`Successfully saved batch ${i + 1} (${batch.length} papers)`);
      }
      
      // Add a small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Completed saving all ${papers.length} papers`);
  } catch (error) {
    console.error('Error saving papers:', error);
  }
}

/**
 * Scrapes papers for multiple days
 * @param days Number of days to scrape (default: 7)
 */
export async function scrapeMultipleDays(days: number = 7): Promise<{ totalPapers: number, daysProcessed: number }> {
  console.log(`Starting to scrape papers for the last ${days} days...`);
  
  // Enforce maximum days limit
  const limitedDays = Math.min(30, days);
  if (limitedDays < days) {
    console.log(`Limiting scraping to ${limitedDays} days (from ${days} days) to prevent excessive scraping`);
  }
  
  let totalPapers = 0;
  let successfulDays = 0;
  
  for (let i = 0; i < limitedDays; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    console.log(`Processing day ${i + 1}/${limitedDays}: ${date}`);
    
    try {
      // Log progress instead of trying to update it through a function
      console.log(`Progress: ${i + 1}/${limitedDays} days`);
      
      const papers = await scrapePapers(date);
      totalPapers += papers.length;
      
      if (papers.length > 0) {
        await savePapers(papers);
        successfulDays++;
      }
      
      // Add a small delay to avoid overwhelming the server
      if (i < limitedDays - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing day ${date}:`, error);
      // Continue with the next day even if there's an error
    }
  }
  
  console.log(`Completed scraping for all ${limitedDays} days. Total papers scraped: ${totalPapers}`);
  return { totalPapers, daysProcessed: successfulDays };
}

/**
 * Gets the most recent paper date from the database
 */
async function getMostRecentPaperDate(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from(Tables.papers)
      .select('date')
      .order('date', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error getting most recent paper date:', error);
      // Default to 7 days ago if there's an error
      return dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    }
    
    if (!data || data.length === 0) {
      // No papers in the database, default to 7 days ago
      return dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    }
    
    return data[0].date;
  } catch (error) {
    console.error('Error getting most recent paper date:', error);
    // Default to 7 days ago if there's an error
    return dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  }
}

/**
 * Scrapes all new papers since the most recent paper in the database
 * @returns Object with total papers scraped and days processed
 */
export async function scrapeNewPapers(): Promise<{ totalPapers: number, daysProcessed: number }> {
  console.log('Starting to scrape new papers...');
  
  // Get the most recent paper date from the database
  const mostRecentDate = await getMostRecentPaperDate();
  console.log(`Most recent paper date in database: ${mostRecentDate}`);
  
  // Calculate the number of days to scrape
  const today = dayjs().format('YYYY-MM-DD');
  const dayDiff = dayjs(today).diff(dayjs(mostRecentDate), 'day');
  
  // If the most recent paper is from today, we'll still check today again
  // to make sure we have all the latest papers
  const daysToScrape = Math.max(1, dayDiff);
  
  // Limit to 30 days maximum to prevent excessive scraping
  const limitedDaysToScrape = Math.min(30, daysToScrape);
  if (limitedDaysToScrape < daysToScrape) {
    console.log(`Limiting scraping to ${limitedDaysToScrape} days (from ${daysToScrape} days) to prevent excessive scraping`);
  }
  
  // Use the scrapeMultipleDays function to avoid code duplication
  return scrapeMultipleDays(limitedDaysToScrape);
} 