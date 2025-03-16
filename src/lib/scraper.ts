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
export async function savePapers(papers: Paper[]): Promise<void> {
  try {
    if (papers.length === 0) {
      console.log('No papers to save');
      return;
    }
    
    console.log(`Saving ${papers.length} papers to the database...`);
    
    const { error } = await supabaseAdmin
      .from(Tables.papers)
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
export async function scrapeMultipleDays(days: number = 7): Promise<void> {
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