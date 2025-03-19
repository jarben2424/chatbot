import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/utils';
import { getMessagesByChatId, saveDocument } from '@/lib/db/queries';
import { document } from '@/lib/db/schema';
import { myProvider } from '@/lib/ai/providers';
import { streamText, smoothStream } from 'ai';

interface ReportBuilderProps {
  session: Session;
  dataStream: DataStreamWriter;
  chatId: string;
}

// Helper function to find visualizations in the database
async function findRelevantVisualizations(topic: string, limit: number = 1) {
  try {
    // Create Supabase client using the environment variables
    const { createClient } = await import('@supabase/supabase-js');
    
    // Get Supabase URL and key from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return [];
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query all visualization documents, ordered by most recent first
    const { data: visualizations, error } = await supabase
      .from('Document')
      .select('id, title, content, createdAt')
      .eq('kind', 'visualization')
      .order('createdAt', { ascending: false })
      .limit(5); // Get a few to filter for relevance
    
    if (error) {
      console.error('Supabase query error:', error);
      return [];
    }
    
    // Just get the most recent visualization since that's likely most relevant
    const relevantVisualizations = visualizations?.length > 0 ? [visualizations[0]] : [];
    
    return relevantVisualizations;
  } catch (error) {
    console.error('Error finding relevant visualizations:', error);
    return [];
  }
}

// Helper function to extract context from recent chat messages
async function extractChatContext(chatId: string, messageLimit: number = 10) {
  try {
    // Get recent messages
    const messages = await getMessagesByChatId({ id: chatId });
    
    // Use only the last messageLimit messages
    const recentMessages = messages.slice(-messageLimit);
    
    // Format messages into a context string
    const formattedMessages = recentMessages.map(msg => {
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : Array.isArray(msg.content)
          ? msg.content.map(c => c.type === 'text' ? c.text : '').join(' ')
          : '';
          
      return `${msg.role}: ${content}`;
    }).join('\n');
    
    return formattedMessages;
  } catch (error) {
    console.error('Error extracting chat context:', error);
    return '';
  }
}

// The report builder tool definition - simplified to match Vercel AI SDK patterns
export const buildReportTool = tool({
  description: 'Create a comprehensive report based on conversation context and available visualizations',
  parameters: z.object({
    topic: z.string().describe('The main topic of the report'),
    title: z.string().describe('The title for the report document'),
    includeVisualizations: z.boolean().default(true).describe('Whether to include relevant visualizations in the report')
  }),
  execute: async ({ topic, title, includeVisualizations }) => {
    // This is a dummy implementation that will be replaced in the route handler
    return `Report tool usage requires the proper session and data context.`;
  }
});

// The main function to be exported for use in the chat API route
export async function buildReport(
  { topic, title, includeVisualizations = true }: {
    topic: string;
    title: string;
    includeVisualizations?: boolean;
  },
  { toolCallId, dataStream, session, chatId }: {
    toolCallId: string;
    dataStream: DataStreamWriter;
    session: Session;
    chatId: string;
  }
) {
  try {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }
    
    // Generate a unique ID for the document
    const documentId = generateUUID();
    
    // First, create and save an empty document with placeholder content
    console.log('Creating initial document with ID:', documentId);
    await saveDocument({
      id: documentId,
      title,
      content: `# ${title}\n\nGenerating report...`,
      kind: 'text',
      userId: session.user.id,
    });
    
    // Send initial signal that document is created
    dataStream.writeData({
      type: 'artifact',
      content: {
        documentId,
        title,
        kind: 'text',
        isVisible: true,
        status: 'idle',
        autoFocus: true,
        shouldOpen: true
      }
    });
    
    // Extract context from recent messages
    const chatContext = await extractChatContext(chatId);
    
    // Find relevant visualizations
    let relevantVisualizations: any[] = [];
    if (includeVisualizations) {
      relevantVisualizations = await findRelevantVisualizations(topic);
      console.log(`Found ${relevantVisualizations.length} relevant visualizations for topic: ${topic}`);
    }
    
    // Prepare visualization references to include in the markdown
    const visualizationReferences = relevantVisualizations.map(viz => {
      try {
        const content = JSON.parse(viz.content || '{}');
        return {
          id: viz.id,
          title: viz.title,
          description: content.description || '',
          type: content.visualization || 'bar',
          data: content.data || []
        };
      } catch (error) {
        return { id: viz.id, title: viz.title, description: '', type: 'bar', data: [] };
      }
    });
    
    // Create a professional report template with proper sections
    const reportTemplate = `
# ${title}

## Executive Summary

[One or two paragraphs summarizing the report's key findings and recommendations]

## Introduction

[Brief introduction to the topic and the purpose of this report]

## Analysis

[Main analysis section with findings and insights]

## Recommendations

[Actionable recommendations based on the analysis]

## Conclusion

[Brief conclusion summarizing the main points and next steps]

${visualizationReferences.length > 0 ? `
## Data Visualization

${visualizationReferences.map(viz => `
### ${viz.title}

${viz.description}

<div class="report-visualization">
  <div class="visualization-container">
    <img src="/api/visualization-image?id=${viz.id}" alt="${viz.title}" title="${viz.title}" class="viz-image" />
  </div>
  <div class="viz-caption">${viz.title}</div>
</div>

[Analysis of what this visualization shows and its relevance to the topic]
`).join('\n')}
` : ''}
`;
    
    // Create a prompt for the AI to generate the report content
    const reportPrompt = `
You are creating a professional business report about "${topic}" that needs to be well-formatted, comprehensive, and visually appealing.

Use the following conversation context to inform your report:
${chatContext}

Your report should follow this exact structure, replacing the placeholder text with actual content while keeping all headers:
${reportTemplate}

${includeVisualizations && visualizationReferences.length > 0 ? `
IMPORTANT: For each visualization in the "Data Visualization" section:
1. Keep the heading with the visualization's title
2. Keep the visualization HTML exactly as is, including all <div> and <img> tags
3. Write a thoughtful analysis of what the visualization shows and its relevance to the overall topic
` : ''}

FORMATTING GUIDELINES:
- Use proper markdown heading levels (# for main title, ## for sections, ### for subsections)
- Use **bold** and *italic* text for emphasis on important points
- Use bullet points and numbered lists where appropriate
- Include proper spacing between sections for readability
- Keep paragraphs concise (3-5 sentences maximum)
- Use professional business language throughout
`;

    // Generate the report content
    let reportContent = '';
    const { fullStream } = streamText({
      model: myProvider.languageModel('gpt-4'),
      system: 'You are an expert business report writer who creates concise, professional reports with clear structure and valuable insights. Your reports are well-formatted with proper markdown, have excellent visual hierarchy, and present information in a way that executives can quickly understand and act upon.',
      experimental_transform: smoothStream({ chunking: 'line' }),
      prompt: reportPrompt,
    });
    
    // Process content as it streams in
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        reportContent += delta.textDelta;
        
        // Every ~500 characters, update the saved document to show progress
        if (reportContent.length % 500 < 20) {
          try {
            await saveDocument({
              id: documentId,
              title,
              content: reportContent,
              kind: 'text',
              userId: session.user.id,
            });
            
            // Send progress update
            dataStream.writeData({
              type: 'tool-status',
              content: {
                toolCallId,
                status: 'running',
                message: `Generating report... (${Math.round(reportContent.length / 1000)}KB)`
              }
            });
          } catch (updateError) {
            console.error('Error updating document during streaming:', updateError);
          }
        }
      }
    }
    
    // Final save of the complete document with proper formatting
    try {
      // Clean up the markdown content
      const enhancedContent = reportContent
        .trim()
        .replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks
      
      // For markdown content that doesn't already have HTML visualization divs,
      // convert any viz: format markdown images to proper HTML
      const processedContent = enhancedContent.replace(
        /!\[(.*?)\]\(viz:(.*?)\)/g, 
        (match, title, vizId) => `
          <div class="report-visualization">
            <div class="visualization-container">
              <img src="/api/visualization-image?id=${vizId}" alt="${title}" title="${title}" class="viz-image" />
            </div>
            <div class="viz-caption">${title}</div>
          </div>
        `
      );
      
      // Don't wrap the content in a div with report-content class, as our document-preview component
      // now handles the rendering directly via the Markdown component
      const finalContent = processedContent;
      
      // Save the final document
      await saveDocument({
        id: documentId,
        title,
        content: finalContent,
        kind: 'text',
        userId: session.user.id,
      });
      
      // Send final signal to ensure document is opened
      dataStream.writeData({
        type: 'artifact',
        content: {
          documentId,
          title,
          kind: 'text',
          isVisible: true,
          status: 'idle', 
          autoFocus: true,
          shouldOpen: true
        }
      });
      
      // Return the result for the tool
      return {
        documentId,
        title,
        content: finalContent,
        visualizations: visualizationReferences.map(viz => viz.id)
      };
    } catch (saveError) {
      console.error('Error saving report document:', saveError);
      throw new Error(`Failed to save report: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error(`Failed to create report: ${error instanceof Error ? error.message : String(error)}`);
  }
} 