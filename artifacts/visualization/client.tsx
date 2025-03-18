import { Artifact } from '@/components/create-artifact';
import {
  CopyIcon,
  RedoIcon,
  UndoIcon,
  SparklesIcon,
  LineChartIcon
} from '@/components/icons';
import { StandaloneChart } from '@/components/data-visualization/charts/standalone-chart';
import { VisualizationControls } from '@/components/data-visualization/visualization-controls';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { useEffect } from 'react';

type VisualizationSettings = {
  type: string;
  colors: string[];
  showLegend: boolean;
  showDataLabels: boolean;
  showTitle: boolean;
  showLabels: boolean;
  title: string;
  xAxis?: string;
};

type VisualizationData = {
  data: any[];
  settings: VisualizationSettings;
  version: number;
  timestamp?: string;
  createdAt?: string;
};

type VisualizationMetadata = {
  versions: VisualizationData[];
  currentVersion: number;
};

export const visualizationArtifact = new Artifact<'visualization', VisualizationMetadata>({
  kind: 'visualization',
  description: 'Interactive data visualization chart',
  initialize: async ({ documentId, setMetadata }) => {
    // Initialize with empty metadata
    setMetadata({
      versions: [],
      currentVersion: 0
    });
  },
  onStreamPart: ({ setArtifact, streamPart, setMetadata }) => {
    if (streamPart.type === 'visualization-data') {
      try {
        const content = typeof streamPart.content === 'string' 
          ? JSON.parse(streamPart.content)
          : streamPart.content;
        
        // Store content in the artifact
        setArtifact((draftArtifact) => ({
          ...draftArtifact,
          content: JSON.stringify(content),
          isVisible: true,
          status: 'streaming'
        }));
        
        // Also update metadata to maintain version history
        setMetadata((metadata) => {
          const now = new Date().toISOString();
          const newVersion = {
            data: content.data || [],
            settings: content.settings || {
              type: content.visualization || 'bar',
              colors: ['hsl(var(--chart-1, 221 83% 53%))', 'hsl(var(--chart-2, 358 84% 56%))', 
                      'hsl(var(--chart-3, 160 84% 39%))', 'hsl(var(--chart-4, 45 93% 47%))',
                      'hsl(var(--chart-5, 262 80% 63%))'],
              showLegend: true,
              showDataLabels: false,
              showTitle: true,
              showLabels: true,
              title: content.title || 'Data Visualization',
              xAxis: content.data && content.data.length > 0 ? Object.keys(content.data[0])[0] : undefined
            },
            version: (metadata?.versions?.length || 0) + 1,
            timestamp: now,
            createdAt: now
          };
          
          return {
            versions: [...(metadata?.versions || []), newVersion],
            currentVersion: (metadata?.versions?.length || 0)
          };
        });
      } catch (error) {
        console.error('Error parsing visualization data:', error);
      }
    }
  },
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    metadata,
    setMetadata,
    getDocumentContentById,
    isLoading
  }) => {
    // Parse the content string into visualization data
    let parsedContent;
    try {
      parsedContent = content ? JSON.parse(content) : null;
    } catch (e) {
      parsedContent = null;
    }
    
    // Get data and settings from metadata if available, or from content
    const versions = metadata?.versions || [];
    const currentVersion = metadata?.currentVersion ?? versions.length - 1;
    
    // Current version's data and settings
    const visualizationData = versions[currentVersion]?.data || 
      (parsedContent?.data || []);
    
    const settings = versions[currentVersion]?.settings || 
      (parsedContent?.settings || {
        type: parsedContent?.visualization || 'bar',
        colors: ['hsl(var(--chart-1, 221 83% 53%))', 'hsl(var(--chart-2, 358 84% 56%))', 
                'hsl(var(--chart-3, 160 84% 39%))', 'hsl(var(--chart-4, 45 93% 47%))',
                'hsl(var(--chart-5, 262 80% 63%))'],
        showLegend: true,
        showDataLabels: false,
        showTitle: true,
        showLabels: true,
        title: parsedContent?.title || 'Data Visualization'
      });
    
    // Get timestamp from metadata or content
    const timestamp = 
      versions[currentVersion]?.timestamp || 
      parsedContent?.timestamp || 
      parsedContent?.lastModified ||
      new Date().toISOString();
    
    // Effect to handle dropdown toggle and overlay
    useEffect(() => {
      // Function to handle save button click
      const handleSaveClick = () => {
        const dropdown = document.getElementById('dashboard-save-dropdown');
        const overlay = document.getElementById('dashboard-dropdown-overlay');
        
        if (dropdown?.classList.contains('hidden')) {
          dropdown?.classList.remove('hidden');
          overlay?.classList.remove('hidden');
        } else {
          dropdown?.classList.add('hidden');
          overlay?.classList.add('hidden');
        }
      };
      
      // Set up click listener
      const saveButton = document.querySelector('[data-save-button="true"]');
      saveButton?.addEventListener('click', handleSaveClick);
      
      return () => {
        saveButton?.removeEventListener('click', handleSaveClick);
      };
    }, []);
    
    // Handle settings changes - create a new version
    const handleSettingsChange = (newSettings: VisualizationSettings) => {
      if (!isCurrentVersion) return;
      
      // Create a new version
      const newVersion = {
        data: visualizationData,
        settings: newSettings,
        version: versions.length + 1
      };
      
      // Update metadata
      setMetadata({
        versions: [...versions, newVersion],
        currentVersion: versions.length
      });
      
      // Save content
      const newContent = JSON.stringify({
        data: visualizationData,
        settings: newSettings,
        visualization: newSettings.type
      });
      
      onSaveContent(newContent, true);
    };
    
    return (
      <div className="h-full relative">
        {/* Main visualization area - not using PanelGroup anymore */}
        <div className="flex h-full flex-col">
          {/* Top bar without border-bottom for cleaner look */}
          <div className="p-3 flex justify-between items-center">
            {/* Empty div to maintain height while removing the title */}
            <div></div>
          </div>
          
          {/* Content area with chart and controls */}
          <div className="flex flex-1 h-[calc(100%-43px)]">
            {/* Left side: Chart area - taking ~70% of the space */}
            <div className="flex-1 h-full p-4 bg-card overflow-hidden">
              <div className="border rounded-lg p-4 h-[calc(100%-40px)] flex justify-center items-center">
                <div className="pt-12 w-full h-full flex justify-center items-start">
                  <StandaloneChart 
                    type={settings.type || 'bar'}
                    data={visualizationData}
                    height={580}
                    width="100%"
                    startYAxisFromZero={true}
                    formatNumbers={true}
                    colors={settings.colors}
                  />
                </div>
              </div>
            </div>
            
            {/* Right side: Controls panel - changed to floating box style */}
            <div className="w-[320px] h-full pt-4 pr-4 bg-transparent flex items-start justify-end">
              {/* Floating box with shadow and rounded corners */}
              <div className="w-full h-auto rounded-xl border shadow-lg bg-card overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Controls</h3>
                  
                  {/* Improved save button with dropdown */}
                  <div className="relative group">
                    <button
                      className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      data-save-button="true"
                      onClick={() => {
                        const dropdown = document.getElementById('dashboard-save-dropdown');
                        const overlay = document.getElementById('dashboard-dropdown-overlay');
                        
                        if (dropdown?.classList.contains('hidden')) {
                          dropdown?.classList.remove('hidden');
                          overlay?.classList.remove('hidden');
                        } else {
                          dropdown?.classList.add('hidden');
                          overlay?.classList.add('hidden');
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Save</span>
                    </button>
                    
                    {/* Dropdown menu */}
                    <div id="dashboard-save-dropdown" className="absolute right-0 mt-1 w-56 bg-card rounded-md border shadow-lg z-50 hidden">
                      <ul className="py-1">
                        <li>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                            onClick={() => {
                              // Save the current visualization
                              const newContent = JSON.stringify({
                                data: visualizationData,
                                settings: settings,
                                visualization: settings.type
                              });
                              onSaveContent(newContent, true);
                              
                              // Hide dropdown and overlay
                              const dropdown = document.getElementById('dashboard-save-dropdown');
                              const overlay = document.getElementById('dashboard-dropdown-overlay');
                              dropdown?.classList.add('hidden');
                              overlay?.classList.add('hidden');
                              
                              // Show success toast
                              toast.success('Dashboard added to My Dashboards');
                              
                              // Close the visualization editor and return to chat
                              // Find the close button and simulate a click
                              const closeButton = document.querySelector('.artifact-close-button');
                              if (closeButton instanceof HTMLElement) {
                                closeButton.click();
                              }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            New dashboard
                          </button>
                        </li>
                        <li>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                            onClick={() => {
                              // Save content
                              const newContent = JSON.stringify({
                                data: visualizationData,
                                settings: settings,
                                visualization: settings.type
                              });
                              onSaveContent(newContent, true);
                              
                              // Hide dropdown and overlay
                              const dropdown = document.getElementById('dashboard-save-dropdown');
                              const overlay = document.getElementById('dashboard-dropdown-overlay');
                              dropdown?.classList.add('hidden');
                              overlay?.classList.add('hidden');
                              
                              // Show "coming soon" toast
                              toast.info('Existing dashboard feature coming soon');
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 10H6V16H8V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M13 7H11V16H13V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M18 13H16V16H18V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Existing dashboard
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-160px)]">
                  <VisualizationControls
                    type={settings.type || 'bar'}
                    data={visualizationData}
                    settings={settings}
                    onChange={handleSettingsChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add click away listener to close dropdown when clicking outside */}
        <div 
          className="fixed inset-0 z-40 hidden" 
          id="dashboard-dropdown-overlay"
          onClick={() => {
            document.getElementById('dashboard-save-dropdown')?.classList.add('hidden');
            document.getElementById('dashboard-dropdown-overlay')?.classList.add('hidden');
          }}
        />
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'Previous version',
      onClick: ({ handleVersionChange, metadata, setMetadata }) => {
        handleVersionChange('prev');
        
        // Also update our internal version tracking
        if (metadata && metadata.currentVersion > 0) {
          setMetadata({
            ...metadata,
            currentVersion: metadata.currentVersion - 1
          });
        }
      },
      isDisabled: ({ metadata, currentVersionIndex }) => {
        // Disable when there are no previous versions to navigate to
        return currentVersionIndex === 0 || (metadata?.currentVersion === 0);
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'Next version',
      onClick: ({ handleVersionChange, metadata, setMetadata }) => {
        handleVersionChange('next');
        
        // Also update our internal version tracking
        if (metadata && metadata.versions && metadata.currentVersion < metadata.versions.length - 1) {
          setMetadata({
            ...metadata,
            currentVersion: metadata.currentVersion + 1
          });
        }
      },
      isDisabled: ({ isCurrentVersion, metadata }) => {
        return isCurrentVersion || 
          !metadata || 
          !metadata.versions || 
          metadata.currentVersion >= metadata.versions.length - 1;
      },
    },
    {
      icon: <CopyIcon />,
      description: 'Export data as CSV',
      onClick: ({ content }) => {
        try {
          // Parse the content
          const parsedContent = JSON.parse(content);
          const data = parsedContent.data || [];
          
          if (data.length === 0) {
            toast.error('No data to export');
            return;
          }
          
          // Convert to CSV
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map((row: any) => 
            Object.values(row).map(value => 
              typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
          );
          const csv = [headers, ...rows].join('\n');
          
          // Copy to clipboard
          navigator.clipboard.writeText(csv);
          toast.success('Data copied to clipboard as CSV');
        } catch (error) {
          console.error('Error exporting CSV:', error);
          toast.error('Failed to export data');
        }
      }
    },
  ],
  toolbar: [
    {
      description: 'Optimize chart',
      icon: <SparklesIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you optimize the visualization to better highlight the key insights in this data?',
        });
      },
    },
    {
      description: 'Analyze chart',
      icon: <LineChartIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you analyze this data and provide key insights about trends, patterns, or notable features shown in the chart? Please provide a detailed explanation of what this visualization is showing and what it might imply. Do not include a visualization or chart in your response, as I can already see the data visualization.',
        });
      },
    },
  ],
}); 