import React from 'react';
import { Summary } from '@/types';

interface PaperSummaryProps {
  summary: Summary | null;
  isLoading?: boolean;
}

export default function PaperSummary({ summary, isLoading = false }: PaperSummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6"></div>
        
        <div className="h-4 bg-gray-200 rounded mb-4 mt-6"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No summary available for this paper yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">TL;DR</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summary.tldr.map((point, index) => (
            <li key={index} className="text-gray-700">{point}</li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Key Innovation</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summary.key_innovation.map((point, index) => (
            <li key={index} className="text-gray-700">{point}</li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Practical Applications</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summary.practical_applications.map((application, index) => (
            <li key={index} className="text-gray-700">{application}</li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Limitations & Future Work</h3>
        <ul className="list-disc pl-5 space-y-1">
          {summary.limitations_future_work.map((limitation, index) => (
            <li key={index} className="text-gray-700">{limitation}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Key Terms</h3>
        <dl className="space-y-2">
          {Object.entries(summary.key_terms).map(([term, definition], index) => (
            <div key={index} className="pb-2 border-b border-gray-200 last:border-0">
              <dt className="font-medium text-gray-900">{term}</dt>
              <dd className="mt-1 text-gray-700">{definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
} 