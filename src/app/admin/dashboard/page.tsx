'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ paperId: string; error: string }>;
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
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Paper Management</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Click the button below to generate summaries for all papers that don&apos;t have one yet.
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
                Generating summaries... This may take a while. Please don&apos;t close this page.
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