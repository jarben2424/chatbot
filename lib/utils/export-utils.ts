/**
 * Export a chart as an image
 */
export async function exportChartAsImage(
  elementId: string,
  fileName: string = 'chart'
) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
    
    // Use html2canvas if available
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) {
      throw new Error('html2canvas library not available');
    }
    
    const canvas = await html2canvas(element);
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    
    return true;
  } catch (error) {
    console.error('Error exporting chart as image:', error);
    throw error;
  }
}

/**
 * Export data as CSV
 */
export async function exportChartAsCSV(
  data: any[],
  fileName: string = 'data'
) {
  try {
    if (!data || !data.length) {
      throw new Error('No data to export');
    }
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV
    const csvContent = [
      // Headers row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle different value types
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return String(value);
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting data as CSV:', error);
    throw error;
  }
} 