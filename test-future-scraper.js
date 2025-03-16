const axios = require('axios');
const cheerio = require('cheerio');

// Function to extract papers data from Hugging Face
async function testScrapeDate(dateStr) {
  try {
    console.log(`\n=== Testing date: ${dateStr} ===`);
    const url = `https://huggingface.co/papers/date/${dateStr}`;
    console.log(`Fetching ${url}...`);
    
    const response = await axios.get(url);
    console.log(`Response status: ${response.status}`);
    
    // Check for redirects
    const finalUrl = response.request?.res?.responseUrl || url;
    if (finalUrl !== url) {
      console.log(`Redirected to: ${finalUrl}`);
      if (finalUrl === 'https://huggingface.co/papers') {
        console.log(`Date ${dateStr} appears invalid or has no papers`);
        return;
      }
    }
    
    const $ = cheerio.load(response.data);
    const dataEl = $('.SVELTE_HYDRATER[data-target="DailyPapers"]');
    
    if (!dataEl.length) {
      console.log('DailyPapers element not found');
      return;
    }
    
    const dataProps = dataEl.attr('data-props');
    if (!dataProps) {
      console.log('No data-props attribute found');
      return;
    }
    
    const data = JSON.parse(dataProps);
    if (!data.dailyPapers || !Array.isArray(data.dailyPapers)) {
      console.log('Invalid data structure');
      return;
    }
    
    console.log(`Found ${data.dailyPapers.length} papers for ${dateStr}`);
    
    if (data.dailyPapers.length > 0) {
      // Show first paper details as a sample
      const firstPaper = data.dailyPapers[0];
      if (firstPaper.paper) {
        console.log('Sample paper:');
        console.log(`  ID: ${firstPaper.paper.id}`);
        console.log(`  Title: ${firstPaper.paper.title}`);
        console.log(`  Upvotes: ${firstPaper.paper.upvotes}`);
      }
    }
  } catch (error) {
    console.error(`Error testing ${dateStr}:`, error.message);
  }
}

// Test dates to check
const testDates = [
  '2024-07-15', // Recent valid date
  '2024-07-01', // Valid date from earlier in the month
  '2023-12-25', // Past date (Christmas)
  '2025-01-01', // Future date
  '2025-02-15', // Future date
  '2025-03-01'  // Future date
];

// Run tests in sequence
async function runTests() {
  for (const date of testDates) {
    await testScrapeDate(date);
  }
}

runTests(); 