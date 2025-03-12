import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { DocumentHandler, DocumentHandlerContext } from '../server';

async function onCreateDocument({
  id,
  title,
  dataStream,
  session,
}: DocumentHandlerContext) {
  // Create a new code document
  const initialContent = `// ${title}\n\n`;
  
  await db.insert(documents).values({
    id,
    title,
    userId: session.user.id,
    kind: 'code',
    content: initialContent,
  });

  // Stream code content
  dataStream.writeData({
    type: 'content',
    content: initialContent,
  });
}

export const codeDocumentHandler: DocumentHandler = {
  kind: 'code',
  onCreateDocument,
}; 