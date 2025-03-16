import React from 'react';
import { FiFilter, FiClock, FiTrendingUp, FiCalendar } from 'react-icons/fi';

interface FilterProps {
  timeRange: '7d' | '30d' | '6m' | '12m' | 'all';
  sortBy: 'date' | 'upvotes';
  sortOrder: 'asc' | 'desc';
  onFilterChange: (name: string, value: string) => void;
}

export default function PaperFilters({
  timeRange,
  sortBy,
  sortOrder,
  onFilterChange,
}: FilterProps) {
  const timeRanges = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '6m', label: '6 months' },
    { value: '12m', label: '12 months' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FiFilter className="mr-2 text-indigo-500" />
          Filter Papers
        </h2>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Time Range Filter */}
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FiClock className="mr-1 text-gray-400" />
            Time Range
          </label>
          <div className="flex gap-2 flex-nowrap overflow-x-auto pb-2 md:pb-0">
            {timeRanges.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange('timeRange', value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  timeRange === value
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sort Options */}
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onFilterChange('sortBy', 'date');
                onFilterChange('sortOrder', 'desc');
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center ${
                sortBy === 'date'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <FiCalendar className={`mr-1.5 ${sortBy === 'date' ? 'text-indigo-500' : 'text-gray-400'}`} />
              Latest
            </button>
            <button
              onClick={() => {
                onFilterChange('sortBy', 'upvotes');
                onFilterChange('sortOrder', 'desc');
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center ${
                sortBy === 'upvotes'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <FiTrendingUp className={`mr-1.5 ${sortBy === 'upvotes' ? 'text-indigo-500' : 'text-gray-400'}`} />
              Most Upvotes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 