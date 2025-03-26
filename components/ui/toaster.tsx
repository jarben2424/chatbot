'use client';

import React from 'react';
import { useToast } from './use-toast';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 right-0 z-50 p-4 flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-md transition-all transform ${
            toast.open
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
          } ${
            toast.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground'
              : toast.variant === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-background text-foreground border border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            <div>
              <h3 className="font-medium text-sm">{toast.title}</h3>
              {toast.description && (
                <p className="text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button className="text-current opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
