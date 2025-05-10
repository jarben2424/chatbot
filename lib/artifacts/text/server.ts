import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { DocumentHandler, DocumentHandlerContext } from '../server';

async function onCreateDocument({
  id,
  title,
  dataStream,
  session,
}: DocumentHandlerContext) {
  // Create a new text document
  await db.insert(documents).values({
    id,
    title,
    userId: session.user.id,
    kind: 'text',
    content: `# ${title}\n\n`,
  });

  // Stream markdown content
  dataStream.writeData({
    type: 'content',
    content: `# ${title}\n\n`,
  });
}

export const textDocumentHandler: DocumentHandler = {
  kind: 'text',
  onCreateDocument,
}; 