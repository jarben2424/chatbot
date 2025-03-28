import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  TextStreamPart,
  ToolInvocation,
  ToolSet,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  console.log("Converting DB messages to UI messages");
  console.log("Input DB messages:", messages.map(m => ({
    id: m.id,
    role: m.role,
    messageType: m.messageType
  })));
  
  // Group related messages by looking for patterns of assistant->tool->assistant sequence
  // where the first assistant message is a database query
  const processedMessages: Array<DBMessage> = [];
  const skippedIds = new Set<string>();
  
  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    
    // Skip messages that were already processed as part of a group
    if (skippedIds.has(currentMessage.id)) {
      continue;
    }
    
    // Look for database query messages that might need grouping
    if (currentMessage.role === 'assistant' && 
        currentMessage.messageType === 'db_query' && 
        i + 1 < messages.length) {
      
      // Check if next message is a tool message (likely the query result)
      const nextMessage = messages[i + 1];
      if (nextMessage.role === 'tool') {
        // We found a query+tool pair
        console.log(`Found db_query assistant message with ID ${currentMessage.id} followed by tool message with ID ${nextMessage.id}`);
        
        // If followed by another assistant message, include it in our grouping
        let secondAssistantMessage = null;
        if (i + 2 < messages.length && messages[i + 2].role === 'assistant') {
          secondAssistantMessage = messages[i + 2];
          console.log(`Also found follow-up assistant message with ID ${secondAssistantMessage.id}`);
          skippedIds.add(secondAssistantMessage.id);
        }
        
        // Add the initial message to our processed list
        processedMessages.push({
          ...currentMessage,
          // Mark this message for special processing by adding groupedWithTool property
          groupedWithTool: true,
          toolMessageId: nextMessage.id,
          followUpMessageId: secondAssistantMessage?.id
        } as any);
        
        // Skip the tool message in future processing
        skippedIds.add(nextMessage.id);
        continue;
      }
    }
    
    // For non-grouped messages, just add them normally
    processedMessages.push(currentMessage);
  }
  
  console.log("Grouped messages:", processedMessages.map(m => ({
    id: m.id,
    role: m.role,
    messageType: m.messageType,
    isGrouped: !!(m as any).groupedWithTool
  })));
  
  const uiMessages = processedMessages.reduce((chatMessages: Array<Message>, message) => {
    // Handle normal tool messages that aren't part of a grouping
    if (message.role === 'tool' && !skippedIds.has(message.id)) {
      return addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    let reasoning: string | undefined = undefined;
    const toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (content.type === 'text') {
          textContent += content.text;
        } else if (content.type === 'tool-call') {
          toolInvocations.push({
            state: 'call',
            toolCallId: content.toolCallId,
            toolName: content.toolName,
            args: content.args,
          });
        } else if (content.type === 'reasoning') {
          reasoning = content.reasoning;
        }
      }
    }
    
    // For grouped database query messages, find and incorporate the tool message content
    if ((message as any).groupedWithTool && (message as any).toolMessageId) {
      const toolMessageId = (message as any).toolMessageId;
      const toolMessage = messages.find(m => m.id === toolMessageId);
      
      // Add tool invocation results if we found the tool message
      if (toolMessage && toolMessage.role === 'tool' && Array.isArray(toolMessage.content)) {
        console.log(`Adding tool content from message ${toolMessageId} to assistant message ${message.id}`);
        
        // Connect tool invocations with their results
        for (const toolInvocation of toolInvocations) {
          const toolResult = toolMessage.content.find(
            content => content.type === 'tool-result' && content.toolCallId === toolInvocation.toolCallId
          );
          
          if (toolResult) {
            toolInvocation.state = 'result';
            toolInvocation.result = toolResult.result;
          }
        }
        
        // If there's a follow-up message, append its content
        if ((message as any).followUpMessageId) {
          const followUpMessage = messages.find(m => m.id === (message as any).followUpMessageId);
          
          if (followUpMessage) {
            let followUpContent = '';
            
            // Handle different content types for the follow-up message
            if (typeof followUpMessage.content === 'string') {
              followUpContent = followUpMessage.content;
            } else if (Array.isArray(followUpMessage.content)) {
              // Extract text content from array of content parts
              for (const content of followUpMessage.content) {
                if (content.type === 'text') {
                  followUpContent += content.text;
                }
              }
            }
            
            // Only append if we have meaningful content to add
            if (followUpContent.trim()) {
              console.log(`Appending follow-up message content from ${(message as any).followUpMessageId}`);
              
              // If the main message already has content, add a line break before appending
              if (textContent.trim()) {
                textContent += '\n\n';
              }
              
              textContent += followUpContent;
            }
          }
        }
      }
    }

    // Check if this is a database query message either by messageType or by looking for specific tool invocations
    const isDbQuery = message.messageType === 'db_query' || 
      toolInvocations.some(ti => 
        (ti.toolName === 'businessDbQuery' || ti.toolName === 'textToSql') && 
        ti.state === 'result');
    
    // Debug logging to trace message type conversions
    console.log(`Converting message ${message.id}: DB messageType=${message.messageType}, computed isDbQuery=${isDbQuery}`);
    
    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      reasoning,
      toolInvocations: toolInvocations as any, // Type assertion to avoid incompatibility
      messageType: isDbQuery ? 'db_query' : (message.messageType || 'default')
    });

    return chatMessages;
  }, []);
  
  console.log("Output UI messages:", uiMessages.map(m => ({
    id: m.id,
    role: m.role,
    messageType: m.messageType,
    toolInvocations: m.toolInvocations?.map(ti => ti.toolName)
  })));
  
  return uiMessages;
}

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];
  console.log("Sanitizing response messages - Original:", messages.map(m => ({
    id: m.id,
    role: m.role
  })));

  // First, identify all tool results
  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  // Extract tool invocations from messages
  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    // Extract tool invocations from content
    const toolInvocations: Array<ToolInvocation> = [];
    let containsDbQuery = false;
    
    for (const content of message.content) {
      if (content.type === 'tool-call') {
        const toolInvocation: ToolInvocation = {
          state: 'call',
          toolCallId: content.toolCallId,
          toolName: content.toolName,
          args: content.args,
        };
        
        toolInvocations.push(toolInvocation);
        
        // Check if this is a database query tool
        if (content.toolName === 'businessDbQuery' || content.toolName === 'textToSql') {
          containsDbQuery = true;
          console.log(`Found database query tool in message ${message.id}: ${content.toolName}`);
        }
      }
    }
    
    // Look for corresponding tool results and update state
    for (const toolInvocation of toolInvocations) {
      if (toolResultIds.includes(toolInvocation.toolCallId)) {
        toolInvocation.state = 'result';
      }
    }

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    // Determine messageType based on tool invocations
    const isDbQuery = toolInvocations.some(ti => 
      (ti.toolName === 'businessDbQuery' || ti.toolName === 'textToSql') && 
      ti.state === 'result');
    
    const messageType = isDbQuery ? 'db_query' : 'default';
    
    console.log(`Message ${message.id} - Contains DB query: ${containsDbQuery}, Has result state: ${isDbQuery}, Setting messageType: ${messageType}`);

    return {
      ...message,
      content: sanitizedContent,
      toolInvocations,  // Preserve tool invocations
      messageType       // Set message type
    };
  });

  console.log("Sanitized messages:", messagesBySanitizedContent.map(m => ({
    id: m.id,
    role: m.role,
    messageType: (m as any).messageType,
    hasToolInvocations: !!(m as any).toolInvocations?.length
  })));

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };
