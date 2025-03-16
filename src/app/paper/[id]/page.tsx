'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Paper, Summary } from '@/types';
import { FiExternalLink, FiArrowLeft } from 'react-icons/fi';

interface PaperDetailProps {
  params: {
    id: string;
  };
}

export default function PaperDetail({ params }: PaperDetailProps) {
  const paperId = params.id;
  const [paper, setPaper] = useState<Paper | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch paper details
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/papers/${paperId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch paper');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPaper(data.paper);
          setSummary(data.summary);
        } else {
          throw new Error(data.error || 'Failed to fetch paper');
        }
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError('Failed to load paper. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaper();
  }, [paperId]);
  
  // Generate summary
  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paperId: paperId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.summary);
        // Update paper has_summary flag
        if (paper) {
          setPaper({
            ...paper,
            has_summary: true,
          });
        }
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('Failed to generate summary. Please try again later.');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
        <div className="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }
  
  if (error || !paper) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p>{error || 'Paper not found'}</p>
        <Link href="/" className="mt-4 inline-flex items-center text-red-700 hover:underline">
          <FiArrowLeft className="mr-2" /> Back to papers
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <Link href="/" className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6">
        <FiArrowLeft className="mr-2" /> Back to papers
      </Link>
      
      {summary ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{paper.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>{format(new Date(paper.date), 'MMMM d, yyyy')}</span>
            <span className="mx-2">•</span>
            <span>{paper.upvotes} upvotes</span>
          </div>

          <div className="prose max-w-none mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">TL;DR</h2>
              <ul className="list-disc pl-5 space-y-2">
                {summary.tldr.map((point: string, index: number) => (
                  <li key={index} className="text-gray-700 text-lg leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Key Innovation</h2>
              <ul className="list-disc pl-5 space-y-2">
                {summary.key_innovation.map((point: string, index: number) => (
                  <li key={index} className="text-gray-700 leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Practical Applications</h2>
              <ul className="list-disc pl-5 space-y-2">
                {summary.practical_applications.slice(0, 3).map((point: string, index: number) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Limitations & Future Work</h2>
              <ul className="list-disc pl-5 space-y-2">
                {summary.limitations_future_work.slice(0, 3).map((point: string, index: number) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Key Terms</h2>
              <dl className="grid grid-cols-1 gap-4">
                {Object.entries(summary.key_terms).map(([term, definition]: [string, string], index: number) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <dt className="font-medium text-gray-900">{term}</dt>
                    <dd className="mt-2 text-gray-700">{definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Paper Details</h2>
            <p className="text-gray-700 mb-6">{paper.abstract}</p>
            
            <div className="flex flex-wrap gap-4">
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View on Hugging Face <FiExternalLink className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{paper.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>{format(new Date(paper.date), 'MMMM d, yyyy')}</span>
            <span className="mx-2">•</span>
            <span>{paper.upvotes} upvotes</span>
          </div>
          
          <p className="text-gray-700 mb-6">{paper.abstract}</p>
          
          <div className="flex flex-wrap gap-4">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View on Hugging Face <FiExternalLink className="ml-2" />
            </a>
            
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {summaryLoading ? 'Generating Summary...' : 'Generate Structured Summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 