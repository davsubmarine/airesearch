import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-xl text-indigo-600">
              AI Research Summary
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 