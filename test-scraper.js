const axios = require('axios');
const cheerio = require('cheerio');

async function testScraper() {
  try {
    console.log('Fetching Hugging Face papers page...');
    const response = await axios.get('https://huggingface.co/papers/date/2024-07-15');
    console.log('Response received, status:', response.status);
    
    const $ = cheerio.load(response.data);
    console.log('HTML loaded with cheerio');
    
    // Find the SVELTE_HYDRATER div
    const dataEl = $('.SVELTE_HYDRATER[data-target="DailyPapers"]');
    console.log('Found data element:', !!dataEl.length);
    
    if (dataEl.length) {
      const dataProps = dataEl.attr('data-props');
      console.log('Data props exist:', !!dataProps);
      
      if (dataProps) {
        const sample = dataProps.substring(0, 200) + '...';
        console.log('Sample data:', sample);
        
        try {
          const parsedData = JSON.parse(dataProps);
          console.log('Successfully parsed JSON data');
          console.log('Has dailyPapers property:', !!parsedData.dailyPapers);
          
          if (parsedData.dailyPapers && Array.isArray(parsedData.dailyPapers)) {
            console.log('Number of papers:', parsedData.dailyPapers.length);
            
            if (parsedData.dailyPapers.length > 0) {
              const firstPaper = parsedData.dailyPapers[0];
              console.log('First paper has paper property:', !!firstPaper.paper);
              
              if (firstPaper.paper) {
                console.log('Paper ID:', firstPaper.paper.id);
                console.log('Paper Title:', firstPaper.paper.title);
                console.log('Paper Summary length:', firstPaper.paper.summary ? firstPaper.paper.summary.length : 0);
                console.log('Paper Upvotes:', firstPaper.paper.upvotes);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON:', e.message);
        }
      }
    }
  } catch (error) {
    console.error('Error in test scraper:', error.message);
  }
}

testScraper(); 