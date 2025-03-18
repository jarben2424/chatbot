import React from 'react';

export function NoDataFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
      <p>No data available</p>
    </div>
  );
}
