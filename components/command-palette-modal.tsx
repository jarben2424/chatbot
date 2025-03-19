'use client';

import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  MessagesSquareIcon, 
  Sparkles, 
  LineChartIcon, 
  FileSpreadsheetIcon, 
  FileTextIcon,
  SearchIcon,
  XIcon
} from 'lucide-react';

interface Command {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: string;
  shortcut?: string[];
}

const commands: Command[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    label: 'View dashboards',
    action: 'View dashboards',
    shortcut: ['⌘', 'D']
  },
  {
    id: 'segments',
    icon: <UsersIcon className="h-4 w-4" />,
    label: 'Show user segments',
    action: 'Show user segments',
    shortcut: ['⌘', 'S']
  },
  {
    id: 'campaigns',
    icon: <MessagesSquareIcon className="h-4 w-4" />,
    label: 'View my campaigns',
    action: 'View my campaigns',
    shortcut: ['⌘', 'C']
  },
  {
    id: 'ai-tools',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Open AI tools',
    action: 'Open AI tools',
    shortcut: ['⌘', 'A']
  },
  {
    id: 'create-chart',
    icon: <LineChartIcon className="h-4 w-4" />,
    label: 'Create chart',
    action: 'Create chart',
    shortcut: ['⌘', '1']
  },
  {
    id: 'create-spreadsheet',
    icon: <FileSpreadsheetIcon className="h-4 w-4" />,
    label: 'Create spreadsheet',
    action: 'Create spreadsheet',
    shortcut: ['⌘', '2']
  },
  {
    id: 'create-report',
    icon: <FileTextIcon className="h-4 w-4" />,
    label: 'Create report',
    action: 'Create report',
    shortcut: ['⌘', '3']
  }
];

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: Command) => void;
}

export function CommandPaletteModal({ isOpen, onClose, onSelectCommand }: CommandPaletteModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filter commands based on search input
  const filteredCommands = commands.filter(command => 
    command.label.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelectCommand(filteredCommands[selectedIndex]);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setSelectedIndex(0);
      setSearchInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-zinc-900 text-white p-1">
          <div className="flex items-center px-3 py-2 bg-zinc-800 rounded mb-1">
            <SearchIcon className="h-4 w-4 text-zinc-400 mr-2" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-500"
              placeholder="Search command..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSelectedIndex(0);
              }}
            />
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="rounded border border-zinc-700 min-w-5 h-5 flex items-center justify-center px-1">esc</span>
              <span>to close</span>
            </div>
          </div>
          
          <div className="text-xs font-medium text-zinc-500 px-3 py-1">SuperHuman Command</div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  className={`w-full text-left py-2 px-3 text-sm flex items-center justify-between rounded transition-colors ${
                    index === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/70'
                  }`}
                  onClick={() => {
                    onSelectCommand(command);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 text-zinc-400">
                      {command.icon}
                    </div>
                    <span className="text-zinc-200">{command.label}</span>
                  </div>
                  
                  {command.shortcut && (
                    <div className="flex items-center gap-0.5">
                      {command.shortcut.map((key, i) => (
                        <span key={i} className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded text-xs border border-zinc-700 text-zinc-500">
                          {key}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-zinc-500">No commands found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 