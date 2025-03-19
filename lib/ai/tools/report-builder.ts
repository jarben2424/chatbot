import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/utils';
import { getMessagesByChatId, saveDocument } from '@/lib/db/queries';
import { document } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, desc } from 'drizzle-orm';
import { myProvider } from '@/lib/ai/providers';
import { streamText, smoothStream } from 'ai';

interface ReportBuilderProps {
  session: Session;
  dataStream: DataStreamWriter;
  chatId: string;
}

// Helper function to find visualizations in the database
async function findRelevantVisualizations(topic: string, limit: number = 3) {
  try {
    // Create db connection
    const db = drizzle(neon(process.env.DATABASE_URL!), { schema: { document } });
    
    // Query all visualization documents
    const visualizations = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        createdAt: document.createdAt
      })
      .from(document)
      .where(eq(document.kind, 'visualization'))
      .orderBy(desc(document.createdAt))
      .limit(20);
    
    // Filter visualizations based on relevance to the topic
    // In a production system, you might use embeddings for better matching
    const relevantVisualizations = visualizations.filter(viz => {
      try {
        const content = JSON.parse(viz.content || '{}');
        const title = viz.title.toLowerCase();
        const description = content.description || '';
        
        // Simple keyword matching
        const keywords = topic.toLowerCase().split(' ');
        return keywords.some(keyword => 
          title.includes(keyword) || 
          description.toLowerCase().includes(keyword)
        );
      } catch (error) {
        return false;
      }
    }).slice(0, limit);
    
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

// The report builder tool definition
export const buildReportTool = tool({
  description: 'Create a comprehensive report based on conversation context and available visualizations',
  parameters: z.object({
    topic: z.string().describe('The main topic of the report'),
    title: z.string().describe('The title for the report document'),
    includeVisualizations: z.boolean().default(true).describe('Whether to include relevant visualizations in the report')
  }),
  execute: async ({ topic, title, includeVisualizations }) => {
    // This is a dummy implementation that will be replaced in the route handler
    return `Report tool usage requires the proper session and data context.
    Contact the developer to ensure the report builder is configured correctly.`;
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
    
    // Signal the start of report creation
    dataStream.writeData({
      type: 'kind',
      content: 'text'
    });
    
    dataStream.writeData({
      type: 'id',
      content: documentId
    });
    
    dataStream.writeData({
      type: 'title',
      content: title
    });
    
    // Reset the content stream
    dataStream.writeData({
      type: 'clear',
      content: ''
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
    
    // Create a prompt for the AI to generate the report content
    const reportPrompt = `
Create a professional report about "${topic}" based on the following conversation context:

${chatContext}

${includeVisualizations && visualizationReferences.length > 0 ? `
Include references to the following visualizations:
${visualizationReferences.map((visualization, i) => 
  `${i+1}. ${visualization.title}: ${visualization.description} (Visualization ID: ${visualization.id})`
).join('\n')}

For each visualization, include a section with the heading matching its title, and add a placeholder for the image with:
${visualizationReferences.map(viz => `![${viz.title}](viz:${viz.id})`).join('\n')}
` : ''}

Structure the report with appropriate headings, subheadings, and bullet points where relevant.
Focus on providing valuable insights and a professional analysis.
`;

    // Stream the report content generation
    let reportContent = '';
    
    const { fullStream } = streamText({
      model: myProvider.languageModel('gpt-3.5-turbo'),
      system: 'You are an expert report writer who creates concise, professional business reports with clear structure and valuable insights. Include proper markdown formatting with headings, subheadings, and lists where appropriate.',
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: reportPrompt,
    });
    
    // Process content as it streams in
    for await (const delta of fullStream) {
      if (delta.type === 'text-delta') {
        reportContent += delta.textDelta;
        
        // Stream content to the UI
        try {
          dataStream.writeData({
            type: 'content-update',
            content: delta.textDelta
          });
        } catch (streamError) {
          console.error('Error streaming content update:', streamError);
          // Continue processing even if streaming fails
        }
      }
    }
    
    // Save the report document
    try {
      await saveDocument({
        id: documentId,
        title,
        content: reportContent,
        kind: 'text',
        userId: session.user.id,
      });
      
      console.log(`Successfully created report with ID: ${documentId}`);
      
      // Signal to open the artifact in the UI immediately
      console.log('Sending artifact signal to open document in UI:', { 
        documentId, 
        title, 
        kind: 'text' 
      });

      // Create a client-side script to force open the artifact
      const clientScript = `
        (function() {
          try {
            // Create and dispatch a custom event to open the artifact
            var openEvent = new CustomEvent('openArtifact', {
              detail: {
                documentId: '${documentId}',
                title: '${title}',
                kind: 'text',
                timestamp: ${Date.now()}
              }
            });
            
            console.log('Dispatching openArtifact event from inline script');
            window.dispatchEvent(openEvent);
            
            // Try again after a short delay to ensure it works
            setTimeout(function() {
              console.log('Dispatching delayed openArtifact event');
              window.dispatchEvent(openEvent);
            }, 500);
          } catch (error) {
            console.error('Error in inline script:', error);
          }
        })();
      `;

      // Add script to the document stream
      dataStream.writeData({
        type: 'client-script',
        content: clientScript
      });

      // Send regular artifact signals as backup
      dataStream.writeData({
        type: 'artifact',
        content: {
          documentId,
          title,
          kind: 'text',
          isVisible: true,
          status: 'idle',
          content: reportContent
        }
      });

      // Finish signal to indicate streaming is complete
      dataStream.writeData({
        type: 'finish',
        content: ''
      });
      
      return {
        id: documentId,
        title,
        kind: 'text',
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