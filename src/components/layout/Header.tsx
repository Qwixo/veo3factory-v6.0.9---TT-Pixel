import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {

  return (
    <header className="bg-gray-900 border-b border-yellow-400 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
              <span className="text-white">Veo3</span>Factory
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
