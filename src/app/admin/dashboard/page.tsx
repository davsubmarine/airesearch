'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Define the scraping status type
interface ScrapingStatus {
  isRunning: boolean;
  startTime: string | null;
  endTime: string | null;
  lastError: string | null;
  mode: string | null;
  daysToScrape: number | null;
  lastResult: { totalPapers: number; daysProcessed: number } | null;
  progress?: { 
    currentDay: number; 
    totalDays: number;
    currentBatch?: number;
    totalBatches?: number;
  } | null;
}

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
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus>({
    isRunning: false,
    startTime: null,
    endTime: null,
    lastError: null,
    mode: null,
    daysToScrape: null,
    lastResult: null,
    progress: null
  });
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Poll for scraping status when scraping is in progress
  useEffect(() => {
    // Clear any existing interval when component unmounts or when isScraping changes
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, [statusPollingInterval]);

  // Function to start polling for status
  const startStatusPolling = () => {
    // Clear any existing interval
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }

    // Check status immediately
    checkScrapingStatus();

    // Set up polling every 3 seconds
    const interval = setInterval(() => {
      checkScrapingStatus();
    }, 3000);

    setStatusPollingInterval(interval);
  };

  // Function to check scraping status
  const checkScrapingStatus = async () => {
    try {
      const response = await fetch('/api/scrape?status=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch scraping status');
      }
      
      const data = await response.json();
      
      setScrapingStatus(data);
      
      // If scraping was running but is now complete
      if (isScraping && data.isRunning === false && data.endTime) {
        setIsScraping(false);
        
        if (data.lastError) {
          setScrapingMessage(`Error during scraping: ${data.lastError}`);
        } else if (data.lastResult) {
          if (data.mode === 'new' && data.lastResult.totalPapers !== undefined) {
            setScrapingMessage(`Completed scraping ${data.lastResult.totalPapers} new papers across ${data.lastResult.daysProcessed} days.`);
            setScrapingResult(data.lastResult);
          } else if (data.mode === 'days') {
            setScrapingMessage(`Completed scraping for the last ${data.daysToScrape} days.`);
          }
        }
        
        // Stop polling when scraping is complete
        if (statusPollingInterval) {
          clearInterval(statusPollingInterval);
          setStatusPollingInterval(null);
        }
      }
    } catch (error) {
      console.error('Failed to check scraping status:', error);
      // Don't stop polling on error, just log it
    }
  };

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
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.message) {
        setScrapingMessage(data.message);
      }
      
      // Start polling for status updates
      startStatusPolling();
    } catch (error) {
      console.error('Failed to scrape new papers:', error);
      setScrapingMessage(`An error occurred while scraping new papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsScraping(false);
    }
  };

  const handleScrapeByDays = async () => {
    // Validate days input
    const days = parseInt(daysToScrape) || 7;
    if (days > 30) {
      setScrapingMessage("Error: Maximum scraping period is 30 days to prevent timeouts. Please enter a smaller number.");
      return;
    }
    
    setIsScraping(true);
    setScrapingMessage(null);
    setScrapingResult(null);
    
    try {
      const response = await fetch('/api/scrape?mode=days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });
      
      if (!response.ok) {
        if (response.status === 504) {
          throw new Error("Request timed out. Try scraping fewer days (maximum recommended: 30 days).");
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Server response was not valid JSON. The request likely timed out.");
      }
      
      if (data.message) {
        setScrapingMessage(data.message);
      }
      
      // Start polling for status updates
      startStatusPolling();
    } catch (error) {
      console.error('Failed to scrape papers:', error);
      setScrapingMessage(`An error occurred while scraping papers: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsScraping(false);
    }
  };

  // Check scraping status on initial load
  useEffect(() => {
    checkScrapingStatus();
  }, []);

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString();
  };

  const calculateProgress = () => {
    if (!scrapingStatus.progress) return 0;
    const { currentDay, totalDays } = scrapingStatus.progress;
    return Math.round((currentDay / totalDays) * 100);
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
              <Card>
                <CardHeader>
                  <CardTitle>Scrape by Days</CardTitle>
                  <CardDescription>
                    Scrape papers for a specific number of days in the past.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={daysToScrape}
                      onChange={(e) => setDaysToScrape(e.target.value)}
                      min="1"
                      max="30"
                      className="w-24"
                    />
                    <span>days</span>
                    <span className="text-xs text-gray-500">(max: 30)</span>
                  </div>
                  <Button 
                    onClick={handleScrapeByDays} 
                    disabled={isScraping || scrapingStatus.isRunning}
                    className="w-full"
                  >
                    {isScraping || scrapingStatus.mode === 'days' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scraping by Days...
                      </>
                    ) : 'Scrape by Days'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Scrape New Papers */}
              <Card>
                <CardHeader>
                  <CardTitle>Scrape New Papers</CardTitle>
                  <CardDescription>
                    Scrape papers that have been published since the most recent paper in the database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleScrapeNewPapers} 
                    disabled={isScraping || scrapingStatus.isRunning}
                    className="w-full"
                  >
                    {isScraping || scrapingStatus.mode === 'new' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scraping New Papers...
                      </>
                    ) : 'Scrape New Papers'}
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {scrapingMessage && (
              <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-md">
                {scrapingMessage}
              </div>
            )}
            
            {scrapingStatus.isRunning && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Scraping Status</CardTitle>
                  <CardDescription>
                    Current progress of the scraping operation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Mode: {scrapingStatus.mode}</span>
                    <span>Started at: {formatTime(scrapingStatus.startTime)}</span>
                  </div>
                  
                  {scrapingStatus.progress && (
                    <>
                      <Progress value={calculateProgress()} className="w-full" />
                      <div className="text-sm text-center">
                        Processing day {scrapingStatus.progress.currentDay} of {scrapingStatus.progress.totalDays}
                        {scrapingStatus.progress.currentBatch && (
                          <span> (Batch {scrapingStatus.progress.currentBatch} of {scrapingStatus.progress.totalBatches})</span>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
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
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating summaries... This may take a while. Please don't close this page.</span>
                </div>
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