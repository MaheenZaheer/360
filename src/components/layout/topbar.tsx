'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onMenuToggle: () => void;
  title: string;
  userEmail?: string;
}

function Topbar({ onMenuToggle, title, userEmail }: TopbarProps) {
  const initials = userEmail
    ? userEmail.charAt(0).toUpperCase()
    : '?';

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white'
          )}
          title={userEmail}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}

export { Topbar };
