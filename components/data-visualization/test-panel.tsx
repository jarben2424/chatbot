'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export function TestPanel() {
  return (
    <div className="relative h-full">
      {/* Full-width visualization panel */}
      <div className="h-full w-full p-3 bg-card overflow-hidden">
        <div className="border rounded-lg h-full flex justify-center items-center p-2">
          Chart goes here
        </div>
      </div>
      
      {/* Floating controls panel - positioned absolutely */}
      <div className="absolute top-6 right-6 w-72 z-10">
        <div className="rounded-lg border bg-card shadow-lg">
          <div className="p-3 flex justify-end items-center border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('save')}
              className="flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          </div>
          <div className="p-4">
            Controls go here
          </div>
        </div>
      </div>
    </div>
  );
} 