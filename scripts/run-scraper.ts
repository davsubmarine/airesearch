// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import { createClient } from '@supabase/supabase-js';

// Define the Paper interface
interface Paper {
  id: string;
  title: string;
  abstract: string;
  date: string;
  url: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  has_summary: boolean;
}

// Interfaces for the data structure
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

// Create Supabase client (only if URL and key are available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully');
} else {
  console.warn('Missing Supabase credentials. Running in dry-run mode (papers will not be saved).');
}

/**
 * Scrapes papers from Hugging Face for a specific date
 * Note: For future dates or dates with no papers (like holidays),
 * Hugging Face redirects to the nearest date with papers.
 * This function handles those redirects gracefully.
 */
async function scrapePapers(date: string): Promise<Paper[]> {
  let papers: Paper[] = [];
  
  try {
    // Format date for the URL
    const formattedDate = dayjs(date).format('YYYY-MM-DD');
    const url = `https://huggingface.co/papers/date/${formattedDate}`;
    
    console.log(`Scraping papers for date: ${formattedDate} from ${url}`);
    
    // Fetch the page
    const response = await axios.get(url);
    
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
    console.error(`Error scraping papers for date ${date}:`, error);
    return [];
  }
}

/**
 * Saves papers to the database
 */
async function savePapers(papers: Paper[]): Promise<void> {
  try {
    if (papers.length === 0) {
      console.log('No papers to save');
      return;
    }
    
    // Check if we have a valid Supabase client
    if (!supabase) {
      console.log(`[DRY RUN] Would save ${papers.length} papers to the database`);
      return;
    }
    
    console.log(`Saving ${papers.length} papers to the database...`);
    
    const { error } = await supabase
      .from('papers')
      .upsert(papers, { onConflict: 'id' });
    
    if (error) {
      console.error('Error saving papers:', error);
    } else {
      console.log(`Successfully saved ${papers.length} papers`);
    }
  } catch (error) {
    console.error('Error saving papers:', error);
  }
}

/**
 * Scrapes papers for multiple days
 * @param days Number of days to scrape (default: 7)
 */
async function scrapeMultipleDays(days: number = 7): Promise<void> {
  console.log(`Starting to scrape papers for the last ${days} days...`);
  
  for (let i = 0; i < days; i++) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    console.log(`Processing day ${i + 1}/${days}: ${date}`);
    
    const papers = await scrapePapers(date);
    
    if (papers.length > 0) {
      await savePapers(papers);
    }
    
    // Add a small delay to avoid overwhelming the server
    if (i < days - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('Completed scraping for all days');
}

/**
 * Main function to run the scraper
 */
async function main() {
  try {
    // Get the number of days to scrape from command line arguments, default to 7
    const args = process.argv.slice(2);
    const days = args.length > 0 ? parseInt(args[0], 10) : 7;
    
    if (isNaN(days) || days <= 0) {
      console.error('Error: Number of days must be a positive number');
      process.exit(1);
    }
    
    console.log(`Starting scraper to fetch papers from the last ${days} days...`);
    if (!supabase) {
      console.log('Running in dry-run mode. Papers will be scraped but not saved to the database.');
    }
    
    // Run the scraper
    await scrapeMultipleDays(days);
    
    console.log('Scraper completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 