import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;
  
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  // Calculate range of pages to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust if we're at the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  // Create page numbers array
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <nav className="flex justify-center mt-8" aria-label="Pagination">
      <ul className="inline-flex items-center gap-1 md:gap-2">
        {/* Previous button */}
        <li>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
            }`}
            aria-label="Previous page"
          >
            <FiChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline-block sm:ml-1">Previous</span>
          </button>
        </li>
        
        {/* Show ellipsis if needed at start */}
        {startPage > 1 && (
          <li>
            <button
              onClick={() => onPageChange(1)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              1
            </button>
          </li>
        )}
        
        {startPage > 2 && (
          <li className="px-2 py-2 text-gray-500">
            <span className="text-gray-400">•••</span>
          </li>
        )}
        
        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentPage === page
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        
        {/* Show ellipsis if needed at end */}
        {endPage < totalPages - 1 && (
          <li className="px-2 py-2 text-gray-500">
            <span className="text-gray-400">•••</span>
          </li>
        )}
        
        {endPage < totalPages && (
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              {totalPages}
            </button>
          </li>
        )}
        
        {/* Next button */}
        <li>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
            }`}
            aria-label="Next page"
          >
            <span className="hidden sm:inline-block sm:mr-1">Next</span>
            <FiChevronRight className="h-5 w-5" />
          </button>
        </li>
      </ul>
    </nav>
  );
} 