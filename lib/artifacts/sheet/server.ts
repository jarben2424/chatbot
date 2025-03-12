import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { DocumentHandler, DocumentHandlerContext } from '../server';

async function onCreateDocument({
  id,
  title,
  dataStream,
  session,
}: DocumentHandlerContext) {
  // Initial content for sheet
  const initialContent = JSON.stringify({
    columns: ['A', 'B', 'C'],
    rows: [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ],
    title
  });
  
  // Create a new sheet document
  await db.insert(documents).values({
    id,
    title,
    userId: session.user.id,
    kind: 'sheet',
    content: initialContent,
  });

  // Stream sheet content
  dataStream.writeData({
    type: 'content',
    content: initialContent,
  });
}

export const sheetDocumentHandler: DocumentHandler = {
  kind: 'sheet',
  onCreateDocument,
}; 