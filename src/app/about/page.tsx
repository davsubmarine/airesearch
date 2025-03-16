export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About AI Research Summary</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What is this?</h2>
        <p className="text-gray-700 mb-4">
          AI Research Summary is a tool that scrapes, displays, and summarizes AI research papers from Hugging Face.
          It aims to make cutting-edge AI research more accessible to non-technical audiences.
        </p>
        <p className="text-gray-700">
          The summaries are generated using OpenAI's GPT-4 model and are structured to provide a clear, concise overview
          of each paper, highlighting key points, business implications, and defining technical terms.
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>We scrape research papers from Hugging Face's papers section daily.</li>
          <li>Papers are stored in a database with their title, abstract, date, and other metadata.</li>
          <li>Users can browse papers and filter them by date or sort by upvotes.</li>
          <li>For each paper, users can generate a structured summary designed for non-technical readers.</li>
          <li>Summaries include a TL;DR, key points, business implications, and definitions of technical terms.</li>
        </ol>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technologies used</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Next.js for the frontend and API routes</li>
          <li>Supabase for the database</li>
          <li>OpenAI API for generating summaries</li>
          <li>Tailwind CSS for styling</li>
          <li>Cheerio for web scraping</li>
        </ul>
      </div>
    </div>
  );
} 