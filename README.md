# AI Research Summary

A Next.js application that generates concise, structured summaries of AI research papers using OpenAI's GPT-4.

## Features

- Browse recent AI research papers
- Generate structured summaries with TL;DR, key innovations, practical applications, and more
- Admin dashboard to manage papers and summaries
- Responsive design for desktop and mobile

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- OpenAI API
- Tailwind CSS

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Deployment to Vercel

### Prerequisites

- A Vercel account
- A Supabase project
- An OpenAI API key

### Steps

1. Push your code to a GitHub repository

2. In the Vercel dashboard, click "Add New" > "Project"

3. Import your GitHub repository

4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel deployment URL)

6. Click "Deploy"

### Post-Deployment

After deployment, you may need to:

1. Set up the database schema in Supabase
2. Import initial paper data
3. Configure CORS in Supabase to allow requests from your Vercel domain

## Troubleshooting

### Summary Generation Issues

If you encounter issues with summary generation:

1. Check that your OpenAI API key is valid and has sufficient credits
2. Verify that the paper data in Supabase is correctly formatted
3. Check the logs in Vercel for any specific error messages

### Database Connection Issues

If you have issues connecting to Supabase:

1. Verify that your Supabase URL and keys are correct
2. Check that your IP is allowed in Supabase's network settings
3. Ensure that the database schema matches what the application expects

## License

MIT
