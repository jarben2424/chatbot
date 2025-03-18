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
      <PanelGroup direction="horizontal" className="h-full">
        {/* Visualization panel */}
        <Panel defaultSize={70} minSize={60}>
          <div className="h-full overflow-y-auto overflow-x-hidden p-4 bg-card">
            <div className="border rounded-lg p-4 h-full flex items-center justify-center">
              <StandaloneChart 
                type={settings.type || 'bar'}
                data={visualizationData}
                height={600}
                width="100%"
                startYAxisFromZero={true}
                formatNumbers={true}
                colors={settings.colors}
              />
            </div>
          </div>
        </Panel>
        
        {/* Resize handle */}
        <PanelResizeHandle className="w-1.5 bg-muted hover:bg-muted/80 transition-colors" />
        
        {/* Controls panel */}
        <Panel defaultSize={30} minSize={25}>
          <div className="h-full overflow-auto border-l">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="text-sm font-medium">Visualization Controls</h3>
            </div>
            <VisualizationControls
              type={settings.type || 'bar'}
              data={visualizationData}
              settings={settings}
              onChange={handleSettingsChange}
            />
          </div>
        </Panel>
      </PanelGroup>
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
      description: 'Analyze data',
      icon: <LineChartIcon />,
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: 'user',
          content: 'Can you analyze this data and provide key insights about trends, patterns, or notable features shown in the chart? Please provide a detailed explanation of what this visualization is showing and what it might imply.',
        });
      },
    },
  ],
}); 