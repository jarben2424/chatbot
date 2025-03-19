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
    includeVisualizations: z.boolean().default(false).describe('Whether to include relevant visualizations in the report')
  }),
  execute: async ({ topic, title, includeVisualizations }) => {
    // This is a dummy implementation that will be replaced in the route handler
    return `Report tool usage requires the proper session and data context.`;
  }
});

// The main function to be exported for use in the chat API route
export async function buildReport(
  { topic, title, includeVisualizations = false }: {
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
      content: `# ${title}`,
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
        isVisible: false, // Start as hidden until we have content
        status: 'idle',
        autoFocus: false,
        shouldOpen: false
      }
    });
    
    // First send the progress status - this appears right away
    dataStream.writeData({
      type: 'tool-status',
      content: {
        toolCallId,
        status: 'running',
        message: `Analyzing chat context, data, and charts...`
      }
    });
    
    // Extract context from recent messages
    const chatContext = await extractChatContext(chatId);
    
    // Update status to show progress
    dataStream.writeData({
      type: 'tool-status',
      content: {
        toolCallId,
        status: 'running',
        message: `Organizing report structure and generating content...`
      }
    });
    
    // Find relevant visualizations (only if includeVisualizations is true)
    let relevantVisualizations: any[] = [];
    // Disable visualizations by default to avoid errors
    if (includeVisualizations) {
      try {
        relevantVisualizations = await findRelevantVisualizations(topic);
        console.log(`Found ${relevantVisualizations.length} relevant visualizations for topic: ${topic}`);
      } catch (vizError) {
        console.error('Error finding visualizations, proceeding without them:', vizError);
        relevantVisualizations = [];
      }
    }
    
    // Prepare visualization references (empty by default)
    const visualizationReferences: any[] = [];
    
    // Only process visualizations if explicilty enabled and there are valid ones found
    if (includeVisualizations && relevantVisualizations.length > 0) {
      for (const viz of relevantVisualizations) {
        try {
          const content = typeof viz.content === 'string' ? JSON.parse(viz.content || '{}') : (viz.content || {});
          visualizationReferences.push({
            id: viz.id,
            title: viz.title || 'Visualization',
            description: content.description || '',
            type: content.visualization || 'bar',
            data: content.data || []
          });
        } catch (parseError) {
          console.error('Error parsing visualization content, skipping:', parseError);
          // Skip this visualization
        }
      }
    }
    
    // Create a professional report template with proper sections
    // Don't include visualization section by default
    const reportTemplate = `
# ${title}

## Executive Summary
[Brief 2-3 sentence overview of key findings]

## Key Points
- [First important point]
- [Second important point]
- [Third important point]

## Analysis
[Main analysis of the topic - keep this concise]

## Recommendations
[Actionable recommendations based on the analysis]

## Conclusion
[Brief conclusion summarizing next steps]
${visualizationReferences.length > 0 && includeVisualizations ? `

## Data Visualization
${visualizationReferences.map(viz => `
### ${viz.title}
${viz.description}
[Analysis of what this visualization shows]
`).join('\n')}
` : ''}
`;
    
    // Create a prompt for the AI to generate the report content
    const reportPrompt = `
You are creating a concise business report about "${topic}" that needs to be formatted to display well in a preview card.

Use the following conversation context to inform your report:
${chatContext}

Your report should follow this exact structure, replacing the placeholder text with actual content while keeping all headers.
IMPORTANT: Only use a SINGLE small paragraph per section (max 2-3 sentences):

# ${title}

## Executive Summary
[Brief 1-2 sentence overview]

## Key Points
- [First point - keep to one line]
- [Second point - keep to one line]
- [Third point - keep to one line]

## Analysis
[Main analysis in 2-3 sentences max]

## Recommendations
[Recommendations in 2-3 sentences max]

## Conclusion
[Brief 1-2 sentence conclusion]

CRITICAL GUIDELINES:
- Keep ALL content extremely concise and compact
- The Executive Summary should be 1-2 sentences maximum
- Each bullet point should be one line only 
- Each section should be 2-3 sentences maximum
- Use shorter words where possible
- Minimize vertical space/line breaks between sections
- Put the most important information at the very top.
`;

    // Generate the report content
    let reportContent = '';
    const { fullStream } = streamText({
      model: myProvider.languageModel('gpt-4'),
      system: 'You are an expert business report writer who creates concise, professional reports with clear structure and valuable insights. Your reports are well-formatted with proper markdown, have excellent visual hierarchy, and present information in a way that executives can quickly understand and act upon.',
      experimental_transform: smoothStream({ chunking: 'line' }),
      prompt: reportPrompt,
    });
    
    // Now that we're about to stream text, update document visibility
    await saveDocument({
      id: documentId,
      title,
      content: `# ${title}\n\n## Executive Summary\n_Preparing report..._\n\n## Key Points\n_Loading..._\n\n## Analysis\n_Loading..._`,
      kind: 'text',
      userId: session.user.id,
    });

    // Make the document visible now that we're actually generating content
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
    
    // Process content as it streams in
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        reportContent += delta.textDelta;
        
        // Every ~500 characters, update the saved document to show progress
        if (reportContent.length % 500 < 20) {
          try {
            // Make sure content includes the title
            const contentWithTitle = reportContent.startsWith('# ') ? 
              reportContent : 
              `# ${title}\n\n${reportContent}`;
            
            await saveDocument({
              id: documentId,
              title,
              content: contentWithTitle,
              kind: 'text',
              userId: session.user.id,
            });
            
            // Send progress update with more descriptive message based on size
            const progress = Math.round(reportContent.length / 1000);
            let progressMessage = `Generating report... (${progress}KB)`;
            
            // Add more descriptive messages based on progress
            if (progress < 2) {
              progressMessage = 'Writing executive summary...';
            } else if (progress < 4) {
              progressMessage = 'Developing analysis section...';
            } else if (progress < 6) {
              progressMessage = 'Formulating recommendations...';
            } else if (progress < 8) {
              progressMessage = 'Finalizing report content...';
            } else {
              progressMessage = 'Polishing final report details...';
            }
            
            dataStream.writeData({
              type: 'tool-status',
              content: {
                toolCallId,
                status: 'running',
                message: progressMessage
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
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .replace(/^# (.*?)$/m, '# $1\n'); // Ensure there's a line break after the title
      
      // Skip visualization processing to avoid errors
      const finalContent = enhancedContent;
      
      // Log the content for debugging
      console.log('Final content length:', finalContent.length);
      console.log('Content starts with:', finalContent.substring(0, 100));
      
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
          status: 'completed', 
          autoFocus: true,
          shouldOpen: true
        }
      });
      
      // Send final status for tool completion
      dataStream.writeData({
        type: 'tool-status',
        content: {
          toolCallId,
          status: 'success',
          message: `Report successfully generated`
        }
      });
      
      // Return the result for the tool, without visualization data
      return {
        documentId,
        title,
        content: finalContent
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