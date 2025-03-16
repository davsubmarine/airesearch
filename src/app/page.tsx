'use client';

import { useState, useEffect } from 'react';
import PaperCard from '@/components/PaperCard';
import PaperFilters from '@/components/PaperFilters';
import Pagination from '@/components/Pagination';
import { Paper } from '@/types';
import { format, subDays } from 'date-fns';
import { FiSearch, FiFileText, FiBookOpen } from 'react-icons/fi';

export default function Home() {
  // Filter and pagination state
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    timeRange: '30d' as '7d' | '30d' | '6m' | '12m' | 'all',
    sortBy: 'date' as 'date' | 'upvotes',
    sortOrder: 'desc' as 'asc' | 'desc',
    page: 1,
    limit: 10,
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });
  
  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      // Reset to first page when filters change
      ...(name !== 'page' && { page: 1 }),
    }));
  };
  
  // Handle page changes
  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };
  
  // Fetch papers based on filters
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query string from filters
        const params = new URLSearchParams({
          timeRange: filters.timeRange,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: String(filters.page),
          limit: String(filters.limit),
        });
        
        const response = await fetch(`/api/papers?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch papers');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPapers(data.papers);
          setPagination({
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        } else {
          throw new Error(data.error || 'Failed to fetch papers');
        }
      } catch (err) {
        console.error('Error fetching papers:', err);
        setError('Failed to load papers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPapers();
  }, [filters]);
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Hero Section */}
      <div className="py-12 mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 shadow-sm">
        <div className="text-center max-w-3xl mx-auto px-6">
          <div className="flex justify-center mb-5">
            <div className="p-3 bg-indigo-100 rounded-full inline-flex text-indigo-600">
              <FiBookOpen className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            AI Research Papers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse and discover the latest research in artificial intelligence with structured summaries
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
              <FiFileText className="mr-2" />
              {pagination.total} Papers Available
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-sm font-medium text-indigo-700">
              <FiSearch className="mr-2" />
              Filter by Date & Upvotes
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <PaperFilters
          timeRange={filters.timeRange}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onFilterChange={handleFilterChange}
        />
      </div>
      
      {/* Results Section */}
      <div className="mb-8">
        {/* Paper count info */}
        {!loading && !error && papers.length > 0 && (
          <div className="mb-4 text-sm text-gray-500 flex justify-between items-center">
            <span>Showing {papers.length} of {pagination.total} papers</span>
            <span>Page {filters.page} of {pagination.totalPages}</span>
          </div>
        )}
        
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                <div className="h-32 bg-gray-100 rounded-lg mb-4 w-full"></div>
                <div className="flex justify-end">
                  <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow-sm">
            <p className="font-medium mb-1">Error</p>
            <p>{error}</p>
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 p-8 rounded-xl shadow-sm text-center">
            <div className="inline-flex items-center justify-center p-3 bg-gray-200 rounded-full mb-4">
              <FiSearch className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-gray-500 text-lg mb-2">No papers found</p>
            <p className="text-gray-400">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination Section */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={filters.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
