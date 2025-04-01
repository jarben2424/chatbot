'use client';

import { ReactNode, useState, useEffect, KeyboardEvent } from 'react';
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  MessagesSquareIcon, 
  Sparkles, 
  LineChartIcon, 
  FileSpreadsheetIcon, 
  FileTextIcon,
  PieChartIcon
} from 'lucide-react';

interface Command {
  id: string;
  icon: ReactNode;
  label: string;
  action: string;
}

export const commands: Command[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboardIcon className="h-4 w-4" />,
    label: 'View dashboards',
    action: 'View dashboards'
  },
  {
    id: 'segments',
    icon: <UsersIcon className="h-4 w-4" />,
    label: 'Show user segments',
    action: 'Show user segments'
  },
  {
    id: 'campaigns',
    icon: <MessagesSquareIcon className="h-4 w-4" />,
    label: 'View my campaigns',
    action: 'View my campaigns'
  },
  {
    id: 'ai-tools',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Open AI tools',
    action: 'Open AI tools'
  },
  {
    id: 'create-chart',
    icon: <LineChartIcon className="h-4 w-4" />,
    label: 'Create chart',
    action: 'Create chart'
  },
  {
    id: 'create-spreadsheet',
    icon: <FileSpreadsheetIcon className="h-4 w-4" />,
    label: 'Create spreadsheet',
    action: 'Create spreadsheet'
  },
  {
    id: 'create-report',
    icon: <FileTextIcon className="h-4 w-4" />,
    label: 'Create report',
    action: 'Create report'
  },
  {
    id: 'create-segment',
    icon: <PieChartIcon className="h-4 w-4" />,
    label: 'Create segment',
    action: 'Create a new customer segment for our business'
  }
];

interface CommandPaletteProps {
  isVisible: boolean;
  onSelectCommand: (command: Command) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  selectedIndex?: number;
}

export function CommandPalette({ 
  isVisible, 
  onSelectCommand, 
  onKeyDown,
  selectedIndex = 0
}: CommandPaletteProps) {
  if (!isVisible) return null;
  
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) onKeyDown(e);
  };
  
  return (
    <div 
      className="absolute left-0 bottom-full w-full mb-1 bg-gray-50 border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="py-1">
        {commands.map((command, index) => (
          <button
            key={command.id}
            className={`w-full text-left py-2 px-3 text-sm flex items-center gap-3 transition-colors ${
              index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectCommand(command)}
          >
            <div className="flex items-center justify-center w-5 h-5 text-gray-500">
              {command.icon}
            </div>
            <span className="text-gray-700">{command.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 