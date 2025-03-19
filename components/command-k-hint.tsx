'use client';

import { useCommandPalette } from './command-palette-provider';

export function CommandKHint() {
  const { openCommandPalette } = useCommandPalette();
  
  return (
    <button 
      className="absolute right-12 bottom-3 p-1 text-xs flex items-center gap-1 transition-colors text-gray-500 hover:text-gray-700 focus:outline-none"
      onClick={openCommandPalette}
      aria-label="Open command palette"
      title="Press Command+K to open commands"
    >
      <div className="flex items-center gap-0.5">
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded text-xs border border-gray-300 bg-gray-50">⌘</span>
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded text-xs border border-gray-300 bg-gray-50">K</span>
      </div>
    </button>
  );
} 