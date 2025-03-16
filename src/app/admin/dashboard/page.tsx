'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scrapingMessage, setScrapingMessage] = useState<string | null>(null);
  const [daysToScrape, setDaysToScrape] = useState<string>('7');
  const [status, setStatus] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ paperId: string; error: string }>;
  } | null>(null);
  const [scrapingResult, setScrapingResult] = useState<{
    totalPapers?: number;
    daysProcessed?: number;
  } | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleGenerateSummaries = async () => {
    setIsGenerating(true);
    setStatus(null);
    setMessage(null);
    
    try {
      const response = await fetch('/api/generate-all-summaries', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.message) {
        setMessage(data.message);
      }
      
      if (data.results) {
        setStatus(data.results);
      }
    } catch (error) {
      console.error('Failed to generate summaries:', error);
      setMessage('An error occurred while generating summaries');
      setStatus({
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [{ paperId: 'unknown', error: 'Failed to generate summaries' }]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScrapeNewPapers = async () => {
    setIsScraping(true);
    setScrapingMessage(null);
    setScrapingResult(null);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'new' }),
      });
      
      const data = await response.json();
      
      if (data.message) {
        setScrapingMessage(data.message);
      }
      
      if (data.result) {
        setScrapingResult(data.result);
      }
    } catch (error) {
      console.error('Failed to scrape new papers:', error);
      setScrapingMessage('An error occurred while scraping new papers');
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapeByDays = async () => {
    setIsScraping(true);
    setScrapingMessage(null);
    setScrapingResult(null);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'days', days: daysToScrape }),
      });
      
      const data = await response.json();
      
      if (data.message) {
        setScrapingMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to scrape papers:', error);
      setScrapingMessage('An error occurred while scraping papers');
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Paper Scraping Section */}
        <div className="px-4 py-6 sm:px-0 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Paper Scraping</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scrape by Days */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Scrape by Days</h3>
                <p className="text-gray-600 mb-4">
                  Scrape papers from the last X days. Enter the number of days to scrape.
                </p>
                
                <div className="flex items-end space-x-4 mb-4">
                  <div>
                    <label htmlFor="daysToScrape" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Days
                    </label>
                    <input
                      type="number"
                      id="daysToScrape"
                      min="1"
                      max="30"
                      value={daysToScrape}
                      onChange={(e) => setDaysToScrape(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={handleScrapeByDays}
                    disabled={isScraping}
                    className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isScraping 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {isScraping ? 'Scraping...' : 'Scrape Papers'}
                  </button>
                </div>
              </div>
              
              {/* Scrape New Papers */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Scrape New Papers</h3>
                <p className="text-gray-600 mb-4">
                  Scrape all new papers since the most recent paper in the database.
                </p>
                
                <button
                  onClick={handleScrapeNewPapers}
                  disabled={isScraping}
                  className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    isScraping 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {isScraping ? 'Scraping...' : 'Scrape New Papers'}
                </button>
              </div>
            </div>
            
            {scrapingMessage && (
              <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-md">
                {scrapingMessage}
              </div>
            )}
            
            {isScraping && (
              <div className="mt-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                Scraping papers... This may take a while. Please don't close this page.
              </div>
            )}
            
            {scrapingResult && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Scraping Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">Total Papers Scraped</p>
                    <p className="text-2xl font-bold">{scrapingResult.totalPapers || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">Days Processed</p>
                    <p className="text-2xl font-bold">{scrapingResult.daysProcessed || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary Generation Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Summary Generation</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Click the button below to generate summaries for all papers that don't have one yet.
                This process uses OpenAI to create summaries and may take some time.
              </p>
              <button
                onClick={handleGenerateSummaries}
                disabled={isGenerating}
                className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isGenerating ? 'Generating Summaries...' : 'Generate Missing Summaries'}
              </button>
            </div>

            {message && (
              <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
                {message}
              </div>
            )}

            {isGenerating && (
              <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                Generating summaries... This may take a while. Please don't close this page.
              </div>
            )}

            {status && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Generation Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">Total Papers</p>
                    <p className="text-2xl font-bold">{status.total}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="text-2xl font-bold">{status.processed}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-md">
                    <p className="text-sm text-green-600">Succeeded</p>
                    <p className="text-2xl font-bold text-green-700">{status.succeeded}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{status.failed}</p>
                  </div>
                </div>

                {status.errors && status.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Errors</h4>
                    <div className="bg-red-50 p-4 rounded-md max-h-60 overflow-y-auto">
                      {status.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          Paper {error.paperId}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 