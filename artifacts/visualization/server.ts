import { ArtifactResponse } from '@vercel/ai';
import { Database, document } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';

export async function createVisualization({
  chatId,
  userId,
  title,
  data,
  settings,
  visualization,
  description,
}: {
  chatId: string;
  userId: string;
  title: string;
  data: any[];
  settings?: any;
  visualization: string;
  description?: string;
}) {
  const response = new ArtifactResponse({
    type: 'visualization',
    url: null,
  });

  // Serialize the visualization data
  const serializedContent = JSON.stringify({
    data,
    settings,
    visualization,
    description,
  });

  // Create basic metadata objects
  const clientId = uuidv4();
  response.stream('id', `${clientId}`);
  response.stream('title', title);

  try {
    const db = drizzle(neon(process.env.DATABASE_URL!), { schema: { document } });

    await db.insert(document).values({
      id: clientId,
      title,
      userId,
      chatId,
      content: serializedContent,
      kind: 'visualization',
      createdAt: new Date(),
    });

    // Stream the visualization data
    response.stream('visualization-data', {
      data,
      settings,
      visualization,
      description,
      title,
    });

    response.stream('finish', '');
    
    return response;
  } catch (error) {
    console.error('Error creating visualization:', error);
    throw error;
  }
}

export async function updateVisualization({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  const db = drizzle(neon(process.env.DATABASE_URL!), {
    schema: { document },
  });

  await db.insert(document).values({
    id: uuidv4(),
    title,
    userId,
    content,
    kind: 'visualization',
    createdAt: new Date(),
    previousVersion: id,
  });
}

export async function getVisualization({
  id,
}: {
  id: string;
}): Promise<{ visualization: any; error?: any }> {
  try {
    const db = drizzle(neon(process.env.DATABASE_URL!), {
      schema: { document },
    });

    const documents = await db
      .select()
      .from(document)
      .where((document) => {
        const conditions = [];
        conditions.push(document.id.equals(id));
        conditions.push(document.kind.equals('visualization'));
        return conditions.reduce((acc, condition) => acc.and(condition));
      });

    if (!documents || documents.length === 0) {
      return { visualization: null, error: 'No visualization found with that ID' };
    }

    // Parse the content
    const parsedContent = JSON.parse(documents[0].content || '{}');

    return { 
      visualization: {
        id: documents[0].id,
        title: documents[0].title,
        data: parsedContent.data || [],
        settings: parsedContent.settings || {},
        visualization: parsedContent.visualization || 'bar',
        description: parsedContent.description || '',
        createdAt: documents[0].createdAt,
      } 
    };
  } catch (error) {
    console.error('Error getting visualization:', error);
    return { visualization: null, error };
  }
} 