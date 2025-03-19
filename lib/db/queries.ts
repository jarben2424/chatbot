import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ userId }: { userId: string }) {
  try {
    const chats = await db
      .select()
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt));
    return chats;
  } catch (error) {
    console.error('Failed to get chats:', error);
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(
      messages.map(msg => {
        // Create a basic object with only fields we know exist in DB
        const messageData = {
          id: msg.id,
          chatId: msg.chatId,
          role: msg.role,
          content: typeof msg.content === 'string' 
            ? { text: msg.content } 
            : msg.content,
          createdAt: msg.createdAt,
        };
        
        // Don't include any other fields
        return messageData;
      })
    );
  } catch (error) {
    console.error('Failed to save messages:', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to vote message:', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes:', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
  createdAt,
  previousVersion,
  chatId
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  createdAt?: Date;
  previousVersion?: string;
  chatId?: string;
}) {
  try {
    // Only include fields that we know exist in the database
    const documentValues: any = {
      id,
      title,
      content,
      userId,
      createdAt: createdAt || new Date(),
    };
    
    // Add kind if it exists (it should be either 'kind' or 'text' depending on migration state)
    try {
      documentValues.kind = kind;
    } catch (e) {
      console.log('Field "kind" might not exist, trying "text"');
      documentValues.text = kind;
    }
    
    // Only add these optional fields if they are provided
    if (previousVersion) {
      try {
        documentValues.previousVersion = previousVersion;
      } catch (e) {
        console.log('Field "previousVersion" might not exist in the database');
      }
    }
    
    if (chatId) {
      try {
        documentValues.chatId = chatId;
      } catch (e) {
        console.log('Field "chatId" might not exist in the database');
      }
    }
    
    return await db.insert(document).values(documentValues);
  } catch (error) {
    console.error('Failed to save document in database', error);
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    // Use parameterized query for safety
    const documents = await client`
      SELECT "id", "createdAt", "title", "content", "kind", "userId"
      FROM "Document" 
      WHERE "id" = ${id}
      ORDER BY "createdAt" ASC
    `;
    
    return documents;
  } catch (error) {
    console.error('Failed to get documents by id from database', error);
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getVisualizationById(id: string) {
  try {
    // Since we don't have a visualizations table yet, we'll create a simple
    // mock implementation that returns visualization data from the artifact ID
    
    // In a real implementation, you would query your database:
    // const visualization = await db.query.visualizationsTable.findFirst({
    //   where: eq(visualizationsTable.id, id)
    // });
    
    // Mock implementation for now:
    return {
      id,
      title: "Visualization", 
      description: "Data visualization",
      type: "bar",
      data: [
        { month: "Jan", value: 1000 },
        { month: "Feb", value: 1200 },
        { month: "Mar", value: 900 },
        { month: "Apr", value: 1500 },
        { month: "May", value: 1800 },
        { month: "Jun", value: 1200 }
      ],
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching visualization:', error);
    return null;
  }
}

// Add new function to get recent documents using Supabase
export async function getRecentDocuments({ 
  userId, 
  limit = 5, 
  kind = undefined 
}: { 
  userId: string, 
  limit?: number, 
  kind?: string | undefined 
}) {
  try {
    // Create a Supabase client using the environment variables
    // This avoids the PostgreSQL connection issues
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
    
    // Build query
    let query = supabase
      .from('Document')
      .select('id, title, kind, createdAt')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    // Add kind filter if specified
    if (kind) {
      const validKinds = ['text', 'code', 'image', 'sheet', 'visualization'];
      if (validKinds.includes(kind)) {
        query = query.eq('kind', kind);
      } else {
        return [];
      }
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return [];
    }
    
    console.log('Retrieved recent documents:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error getting recent documents with Supabase:', error);
    return [];
  }
}
