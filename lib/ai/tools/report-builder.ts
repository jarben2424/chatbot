import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import { generateUUID } from '@/lib/utils';
import { getMessagesByChatId, saveDocument } from '@/lib/db/queries';
import { document } from '@/lib/db/schema';
import { myProvider, createAnthropicProvider, CLAUDE_OPUS_3_5_MODEL_NAME } from '@/lib/ai/providers';
import { streamText, smoothStream } from 'ai';
import { performWebSearch } from './web-search';
import { queryDatabase } from './query-data';

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

// Helper function to perform web search on a topic for additional research
async function researchTopicOnWeb(topic: string): Promise<string> {
  try {
    console.log(`Performing web research for report on topic: "${topic}"`);
    
    // Construct a more targeted search query based on the topic
    const searchQuery = `latest research ${topic} business analysis`;
    const { success, results, error } = await performWebSearch(searchQuery);
    
    if (!success || !results || results.length === 0) {
      console.warn('Web search failed or returned no results:', error);
      return '';
    }
    
    // Format the search results into a context string for the AI
    const researchContext = results.slice(0, 5).map((result, index) => {
      return `
SOURCE ${index + 1}: ${result.title}
URL: ${result.url}
CONTENT: ${result.snippet}
`;
    }).join('\n');
    
    console.log(`Found ${results.length} research sources for topic "${topic}"`);
    return researchContext;
  } catch (error) {
    console.error('Error researching topic on web:', error);
    return '';
  }
}

// Helper function to query database for relevant data
async function queryDataForReport(topic: string): Promise<string> {
  console.log(`Querying database for data related to: "${topic}"`);
  
  try {
    // Construct queries based on the topic
    let queries = [];
    const lowercaseTopic = topic.toLowerCase();
    
    if (lowercaseTopic.includes('revenue') || lowercaseTopic.includes('sales')) {
      queries.push(`
        SELECT 
          DATE_TRUNC('month', transaction_date) as month, 
          SUM(total_amount) as revenue 
        FROM HANG_LOYALTY_PUBLIC.transactions 
        GROUP BY DATE_TRUNC('month', transaction_date) 
        ORDER BY month DESC 
        LIMIT 12
      `);
    }
    
    if (lowercaseTopic.includes('customer') || lowercaseTopic.includes('transaction')) {
      queries.push(`
        SELECT 
          customer_id,
          COUNT(*) as transaction_count,
          SUM(amount) as total_spent
        FROM HANG_LOYALTY_PUBLIC.customer_transactions
        GROUP BY customer_id
        ORDER BY total_spent DESC
        LIMIT 10
      `);
    }
    
    if (lowercaseTopic.includes('product') || lowercaseTopic.includes('item')) {
      queries.push(`
        SELECT 
          product_id,
          COUNT(*) as purchase_count,
          AVG(unit_price) as avg_price
        FROM HANG_LOYALTY_PUBLIC.transaction_line_items
        GROUP BY product_id
        ORDER BY purchase_count DESC
        LIMIT 10
      `);
    }
    
    // Default query if no specific topic matched
    if (queries.length === 0) {
      queries.push(`
        SELECT 
          DATE_TRUNC('month', transaction_date) as month, 
          COUNT(*) as transaction_count
        FROM HANG_LOYALTY_PUBLIC.transactions 
        GROUP BY DATE_TRUNC('month', transaction_date) 
        ORDER BY month DESC 
        LIMIT 12
      `);
    }
    
    // Execute queries and format results
    let queryResults = '';
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        const results = await queryDatabase(query);
        if (results && results.length > 0) {
          queryResults += `\nDATABASE QUERY ${i+1} RESULTS:\n`;
          queryResults += JSON.stringify(results.slice(0, 10), null, 2);
          queryResults += '\n';
        }
      } catch (queryError) {
        console.error(`Error executing query ${i+1}:`, queryError);
      }
    }
    
    if (!queryResults) {
      return '';
    }
    
    return `DATABASE QUERY RESULTS:\n${queryResults}`;
  } catch (error) {
    console.error('Error querying database for report:', error);
    return '';
  }
}

// The report builder tool definition - simplified to match Vercel AI SDK patterns
export const buildReportTool = tool({
  description: 'Create a professional MBA-level business report with Claude Opus 3.5. Includes executive summary, industry analysis, strategic recommendations, and implementation steps. Automatically enhances the report with relevant web research for authoritative insights.',
  parameters: z.object({
    topic: z.string().describe('The main topic of the report'),
    title: z.string().describe('The title for the report document'),
    includeVisualizations: z.boolean().default(false).describe('Whether to include relevant visualizations in the report'),
    webResearch: z.boolean().default(true).describe('Whether to enhance the report with web-searched information'),
    queryData: z.boolean().default(true).describe('Whether to query the database for relevant data to include in the report')
  }),
  execute: async ({ topic, title, includeVisualizations, webResearch, queryData }) => {
    // This is a dummy implementation that will be replaced in the route handler
    return `Report tool usage requires the proper session and data context.`;
  }
});

// The main function to be exported for use in the chat API route
export async function buildReport(
  { topic, title, includeVisualizations = false, webResearch = true, queryData = true }: {
    topic: string;
    title: string;
    includeVisualizations?: boolean;
    webResearch?: boolean;
    queryData?: boolean;
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
        message: `Extracting context from recent chat messages...`
      }
    });
    
    // Extract context from recent messages
    const chatContext = await extractChatContext(chatId);
    
    // Perform web research to enhance report quality (MBA-level analysis)
    if (webResearch) {
      dataStream.writeData({
        type: 'tool-status',
        content: {
          toolCallId,
          status: 'running',
          message: `Researching latest information on ${topic} via web search...`
        }
      });
    }
    
    const webResearchData = webResearch ? await researchTopicOnWeb(topic) : '';
    
    // Query the database for relevant data if requested
    let databaseData = '';
    if (queryData) {
      dataStream.writeData({
        type: 'tool-status',
        content: {
          toolCallId,
          status: 'running',
          message: `Executing SQL queries to find business data related to ${topic}...`
        }
      });
      
      databaseData = await queryDataForReport(topic);
    }
    
    // Update status to show progress
    dataStream.writeData({
      type: 'tool-status',
      content: {
        toolCallId,
        status: 'running',
        message: includeVisualizations ? 
          `Searching for relevant data visualizations for ${topic}...` : 
          `Preparing report template and structure...`
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
![${viz.title}](viz:${viz.id})
[Analysis of what this visualization shows]
`).join('\n')}
` : ''}
`;
    
    // Create a prompt for the AI to generate the report content
    const reportPrompt = `
You are creating a comprehensive MBA-level business report about "${topic}" that will be formatted to display well in a preview card.

CONVERSATION CONTEXT:
${chatContext}

${webResearch && webResearchData ? `
WEB RESEARCH FINDINGS:
${webResearchData}
` : ''}

${queryData && databaseData ? `
DATABASE QUERY RESULTS:
${databaseData}
` : ''}

Your report should follow this exact structure, replacing the placeholder text with actual content while maintaining all markdown formatting and headers.
Make sure to use proper markdown formatting:
- Use # for main title
- Use ## for section headers
- Use bold text with ** for emphasis
- Use proper list formatting with hyphens for bullet points
- Use numbered lists with 1., 2., etc. when appropriate

# ${title}

## Executive Summary
[Concise 2-3 sentence overview with key insights]

## Key Points
- [Primary insight from analysis - one line]
- [Important market trend - one line]
- [Critical recommendation - one line]

## Industry Analysis
[Thorough analysis incorporating latest research findings and relevant database query results - 3-4 sentences]

## Strategic Recommendations
[Actionable MBA-level strategic recommendations based on both research and data analysis - 3-4 sentences]

## Implementation Roadmap
[Brief phased approach to implementation - 2-3 sentences]

## Conclusion
[Concise conclusion with expected outcomes - 2 sentences]

${queryData && databaseData ? `
## Data Analysis
[Specific analysis of the database query results, with insights about what the data reveals - 3-4 sentences]
` : ''}

FORMATTING GUIDELINES:
- Create a professional, executive-level report with MBA-quality analysis
- Include insights from the web research where relevant
- When database query results are available, incorporate specific numbers and trends from the data
- Ensure proper spacing between markdown elements (add blank lines between sections)
- Make sure all headers have a space after the # symbols
- Use bold text for emphasis on important points
- Incorporate industry-standard business frameworks where appropriate (SWOT, Porter's Five Forces, etc.)
`;

    // Generate the report content using Claude Opus 3.5 for MBA-quality analysis
    let reportContent = '';
    
    // Create Anthropic provider with Claude Opus 3.5
    const anthropicProvider = createAnthropicProvider(CLAUDE_OPUS_3_5_MODEL_NAME);
    
    // Log which model we're using
    console.log(`Using model for report generation: ${anthropicProvider ? 'Claude Opus 3.5' : 'GPT-4 (fallback)'}`);
    
    // Due to type issues, we need to use myProvider.languageModel for both cases
    // but we can select different model IDs based on availability
    const modelName = anthropicProvider ? 'gpt-4' : 'gpt-4';
    
    // Generate the report
    const { fullStream } = streamText({
      model: myProvider.languageModel(modelName),
      system: `You are an expert MBA-level business report writer who creates professional, insightful reports with clear structure and strategic analysis. 
Your reports are formatted with proper markdown syntax, have excellent visual hierarchy, and present information in a way that executives can quickly understand and act upon.
Always use proper markdown formatting with blank lines between sections, correct header syntax (# with a space after), properly formatted lists (with hyphens or numbers), and use bold or italic text for emphasis where appropriate.
Incorporate insights from web research data to create a more authoritative, well-researched report that demonstrates MBA-level business acumen.`,
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
        // Fix the markdown formatting for proper bullet points
        let formattedDelta = delta.textDelta;
        
        // Replace asterisk-based bullets with proper markdown bullets
        formattedDelta = formattedDelta.replace(/\*\*\s+([^*]+)\s+\*\*/g, '* $1');
        
        // Add the properly formatted content
        reportContent += formattedDelta;
        
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
            
            // Send progress update with more descriptive message based on actual content
            const progress = Math.round(reportContent.length / 1000);
            let progressMessage = `Generating report... (${progress}KB)`;
            
            // Add more descriptive messages based on actual content in the report
            if (reportContent.includes('Executive Summary') && !reportContent.includes('Key Points')) {
              progressMessage = 'Generating executive summary...';
            } else if (reportContent.includes('Key Points') && !reportContent.includes('Industry Analysis')) {
              progressMessage = 'Identifying key points and insights...';
            } else if (reportContent.includes('Industry Analysis') && !reportContent.includes('Strategic Recommendations')) {
              progressMessage = 'Analyzing industry trends and market data...';
            } else if (reportContent.includes('Strategic Recommendations') && !reportContent.includes('Implementation Roadmap')) {
              progressMessage = 'Developing strategic recommendations...';
            } else if (reportContent.includes('Implementation Roadmap') && !reportContent.includes('Conclusion')) {
              progressMessage = 'Creating implementation roadmap...';
            } else if (reportContent.includes('Conclusion') && !reportContent.includes('Data Analysis')) {
              progressMessage = 'Formulating conclusion and final points...';
            } else if (reportContent.includes('Data Analysis')) {
              progressMessage = 'Analyzing database query results...';
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
      
      // We'll use the enhanced content directly - no need to process visualizations or wrap in HTML
      // since the markdown component will handle the rendering properly
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
    console.error('Error building report:', error);
    // Update status to show failure
    dataStream.writeData({
      type: 'tool-status',
      content: {
        toolCallId,
        status: 'failed',
        message: 'Report generation failed'
      }
    });
  }
}