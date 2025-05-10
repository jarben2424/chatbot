import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { nanoid } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { ArtifactKind } from '@/components/artifact';

export async function createDocument({
  title,
  content,
  kind,
  userId
}: {
  title: string;
  content: string;
  kind: ArtifactKind;
  userId?: string;
}) {
  const id = nanoid();
  
  const [document] = await db
    .insert(documents)
    .values({
      id,
      title,
      content,
      kind,
      userId
    })
    .returning();
  
  return document;
}

export async function getDocuments({
  id,
  userId
}: {
  id?: string;
  userId?: string;
}) {
  let query = db.select().from(documents);
  
  if (id) {
    query = query.where(eq(documents.id, id));
  }
  
  if (userId) {
    query = query.where(eq(documents.userId, userId));
  }
  
  return await query;
} 