import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';
import { DocumentHandler, DocumentHandlerContext } from '../server';

async function onCreateDocument({
  id,
  title,
  dataStream,
  session,
}: DocumentHandlerContext) {
  // Create a new image document (initially empty)
  await db.insert(documents).values({
    id,
    title,
    userId: session.user.id,
    kind: 'image',
    content: '',
  });

  // Indicate that it's ready for image upload
  dataStream.writeData({
    type: 'content',
    content: 'Ready for image upload',
  });
}

export const imageDocumentHandler: DocumentHandler = {
  kind: 'image',
  onCreateDocument,
}; 