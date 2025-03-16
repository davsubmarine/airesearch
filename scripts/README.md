# Scripts

This directory contains utility scripts for the AI Research Summary application.

## Paper Scraper

The `run-scraper.ts` script fetches research papers from Hugging Face and saves them to the Supabase database.

### Prerequisites

Before running the scraper, make sure you have the following:

1. Node.js and npm installed
2. Required packages installed:
   ```bash
   npm install axios cheerio dayjs @supabase/supabase-js dotenv
   ```
3. Environment variables set up:
   - Your project's `.env.local` file should already contain the required credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```
   - No additional configuration is needed if these variables are already set

### Usage

Run the script using ts-node:

```bash
# Scrape papers from the last 7 days (default)
ts-node scripts/run-scraper.ts

# Scrape papers from the last 14 days
ts-node scripts/run-scraper.ts 14
```

### Setting up as a Cron Job

To automatically run the scraper on a schedule, you can set up a cron job:

#### Example: Daily Scraper

This example runs the scraper every day at 2:00 AM to fetch the papers from the previous day:

1. Edit your crontab:
   ```bash
   crontab -e
   ```

2. Add the following line (adjust the path to your project directory):
   ```
   0 2 * * * cd /path/to/ai-research-summary-v3 && /usr/local/bin/ts-node scripts/run-scraper.ts 1
   ```

#### Example: Weekly Scraper

This example runs the scraper every Sunday at 3:00 AM to fetch the papers from the past week:

1. Edit your crontab:
   ```bash
   crontab -e
   ```

2. Add the following line (adjust the path to your project directory):
   ```
   0 3 * * 0 cd /path/to/ai-research-summary-v3 && /usr/local/bin/ts-node scripts/run-scraper.ts 7
   ```

### Notes

- The scraper handles future dates and dates with no papers by redirecting to the nearest date with available papers.
- For holiday dates or weekends without papers, the Hugging Face site redirects to the last day with papers.
- The script includes proper error handling and logging.
- Papers are upserted into the database, so running the script multiple times won't create duplicates. 