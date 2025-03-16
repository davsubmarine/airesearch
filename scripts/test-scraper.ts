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
  has_summary?: boolean;
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

/**
 * Scrapes papers from Hugging Face for a specific date
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
    
    // Log all SVELTE_HYDRATER elements to see what's available
    console.log('\nFound SVELTE_HYDRATER elements:');
    $('.SVELTE_HYDRATER').each((i, el) => {
      const target = $(el).attr('data-target');
      const hasDataProps = $(el).attr('data-props') ? 'Yes' : 'No';
      console.log(`Element ${i+1}: data-target="${target}", has data-props: ${hasDataProps}`);
    });
    
    // Find the data element that contains the JSON
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
    console.log('\nParsing JSON data...');
    const parsedData = JSON.parse(dataProps);
    
    // Log the keys in the parsed data
    console.log('Keys in parsed data:', Object.keys(parsedData));
    
    // Check for dailyPapers or other relevant keys
    if (parsedData.dailyPapers) {
      console.log('Found dailyPapers array with', parsedData.dailyPapers.length, 'items');
      const dailyPapersData = parsedData;
      
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
    } else if (parsedData.papers) {
      console.log('Found papers array with', parsedData.papers.length, 'items');
      papers = parsedData.papers.map((paper: any) => ({
        id: paper.id || '',
        title: paper.title || '',
        abstract: paper.summary || paper.abstract || '',
        date: formattedDate,
        url: `https://huggingface.co/papers/${paper.id}`,
        upvotes: paper.upvotes || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        has_summary: false
      } as Paper));
    } else {
      console.log('Could not find papers data in the parsed JSON');
      // Log a sample of the parsed data to understand its structure
      console.log('Sample of parsed data:', JSON.stringify(parsedData).substring(0, 500) + '...');
    }
    
    console.log(`Successfully scraped ${papers.length} papers for date: ${formattedDate}`);
    
    return papers;
  } catch (error) {
    console.error(`Error scraping papers for date ${date}:`, error);
    return [];
  }
}

/**
 * Test function to run the scraper
 */
async function testScraper() {
  try {
    // Get the date from command line arguments, default to today
    const args = process.argv.slice(2);
    const date = args.length > 0 ? args[0] : dayjs().format('YYYY-MM-DD');
    
    console.log(`Testing scraper for date: ${date}`);
    
    // Run the scraper
    const papers = await scrapePapers(date);
    
    // Print the results
    console.log(`Found ${papers.length} papers for date: ${date}`);
    
    if (papers.length > 0) {
      console.log('\nFirst paper details:');
      console.log(`ID: ${papers[0].id}`);
      console.log(`Title: ${papers[0].title}`);
      console.log(`Abstract length: ${papers[0].abstract.length} characters`);
      console.log(`Upvotes: ${papers[0].upvotes}`);
      console.log(`URL: ${papers[0].url}`);
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test function
testScraper(); 