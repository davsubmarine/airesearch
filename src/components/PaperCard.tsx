import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiBookOpen, FiCpu } from 'react-icons/fi';
import { Paper, Summary } from '@/types';
import { format } from 'date-fns';

interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch summary if paper has one
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/papers/${paper.id}`);
        const data = await response.json();
        
        if (data.success && data.summary) {
          setSummary(data.summary);
          
          // If the paper has a summary but the flag is not set, update it locally
          if (!paper.has_summary) {
            paper.has_summary = true;
          }
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [paper.id, paper.has_summary]);

  const handleGenerateSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id }),
      });
      
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out">
      <div className="p-6">
        {/* Header with title and metadata */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-5">
          <h3 className="text-xl font-bold text-gray-800 leading-tight hover:text-indigo-600 transition-colors md:max-w-[75%]">
            {paper.title}
          </h3>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 whitespace-nowrap">
              {paper.upvotes} upvotes
            </span>
            <span className="inline-flex items-center text-sm text-gray-500 whitespace-nowrap">
              {format(new Date(paper.date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {summary ? (
          <div className="prose max-w-none">
            {/* TL;DR Section */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2 text-indigo-600">TL;DR</span>
                <div className="h-px flex-grow bg-gradient-to-r from-indigo-200 to-transparent"></div>
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                {summary.tldr.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${expanded ? 'opacity-100 max-h-[5000px]' : 'opacity-70 max-h-0 overflow-hidden'}`}>
              {/* Key Innovation Section */}
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2 text-purple-600">Key Innovation</span>
                  <div className="h-px flex-grow bg-gradient-to-r from-purple-200 to-transparent"></div>
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.key_innovation.map((point, index) => (
                    <li key={index} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>

              {/* Practical Applications Section */}
              <div className="mb-6 bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2 text-green-600">Practical Applications</span>
                  <div className="h-px flex-grow bg-gradient-to-r from-green-200 to-transparent"></div>
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.practical_applications.map((point, index) => (
                    <li key={index} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations & Future Work Section */}
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border-l-4 border-amber-500">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2 text-amber-600">Limitations & Future Work</span>
                  <div className="h-px flex-grow bg-gradient-to-r from-amber-200 to-transparent"></div>
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.limitations_future_work.map((point, index) => (
                    <li key={index} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </div>

              {/* Key Terms Section */}
              <div className="mb-6 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border-l-4 border-gray-500">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2 text-gray-600">Key Terms</span>
                  <div className="h-px flex-grow bg-gradient-to-r from-gray-200 to-transparent"></div>
                </h4>
                <dl className="grid grid-cols-1 gap-3">
                  {Object.entries(summary.key_terms).map(([term, definition], index) => (
                    <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <dt className="font-medium text-gray-900">{term}</dt>
                      <dd className="mt-1 text-gray-700">{definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
              {/* Show/Hide Details Button */}
              <button 
                onClick={toggleExpanded}
                className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <FiBookOpen className="mr-1" />
                {expanded ? 'Show Less' : 'Show More Details'}
              </button>
              
              {/* View Paper Button */}
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 border border-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                View on Hugging Face <FiExternalLink className="ml-1" />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-600">Generating AI summary...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-gray-500 bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <FiCpu className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                  <p className="text-lg font-medium mb-2">No AI summary available yet</p>
                  <p className="text-sm text-gray-500 mb-4">Generate a structured summary of this research paper with key points and insights.</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={handleGenerateSummary}
                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors focus:ring-4 focus:ring-indigo-300"
                  >
                    Generate Summary
                  </button>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg text-sm transition-colors focus:ring-4 focus:ring-gray-200"
                  >
                    View on Hugging Face <FiExternalLink className="ml-2" />
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 