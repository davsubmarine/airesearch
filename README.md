# AI Research Summary

A lightweight application to scrape, display, and summarize AI research papers from Hugging Face.

## Features

- **Paper Scraping**: Automatically scrapes papers from Hugging Face's papers section
- **Filtering & Sorting**: Filter papers by date and sort by upvotes or date
- **AI-Powered Summaries**: Generate structured summaries for non-technical readers using OpenAI
- **Responsive UI**: Clean, mobile-friendly interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **AI**: OpenAI API (GPT-4)
- **Scraping**: Axios, Cheerio

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-research-summary.git
   cd ai-research-summary
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up your Supabase database with the following tables:

   **papers**
   - id (text, primary key)
   - title (text)
   - abstract (text)
   - date (date)
   - url (text)
   - upvotes (integer)
   - created_at (timestamp with timezone)
   - updated_at (timestamp with timezone)
   - has_summary (boolean)

   **summaries**
   - id (text, primary key)
   - paper_id (text, foreign key to papers.id)
   - tldr (text)
   - key_points (json array)
   - business_implications (json array)
   - key_terms (json)
   - created_at (timestamp with timezone)
   - updated_at (timestamp with timezone)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scraping Papers

To scrape papers, make a GET request to the `/api/scrape` endpoint:

```
GET /api/scrape?days=7
```

This will scrape papers from the last 7 days. You can adjust the `days` parameter as needed.

## Structured Summaries

This application uses a standardized structure for AI-generated summaries to make research papers more accessible to non-technical audiences.

### Summary Structure

Each paper summary includes the following sections:

1. **TL;DR (Quick Overview)**: A concise summary of the paper in 1-2 sentences.
2. **Key Innovation**: Explains what's new or novel about the research.
3. **Practical Applications**: Lists potential real-world uses for the research.
4. **Limitations & Future Work**: Outlines current limitations and potential improvements.
5. **Key Terms**: Defines technical terms in simple language.

### Implementation Steps

To update existing summaries to the new structure:

1. First, update the database schema:
   - Run the SQL script in `scripts/modify-summaries-table.sql` in your Supabase SQL Editor.
   - This will add the required columns to the summaries table.

2. Regenerate existing summaries:
   - Run `npx ts-node scripts/regenerate-summaries.ts` to regenerate all existing summaries using the new structure.

3. All new summaries will automatically use the new structure.

### Customizing the Structure

If you want to modify the summary structure:

1. Update the `Summary` interface in `src/types/index.ts`
2. Modify the OpenAI prompt in `src/lib/openai.ts`
3. Update the UI components that display summaries in `src/app/paper/[id]/page.tsx`

## License

MIT
