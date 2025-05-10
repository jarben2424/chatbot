'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createArtifact } from '@/lib/db/artifacts';
import { ArtifactKind } from '@/lib/db/schema';

export async function createDocument(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const title = formData.get('title') as string;
  const kind = (formData.get('kind') as ArtifactKind) || 'text';

  if (!title) {
    throw new Error('Title is required');
  }

  // Create the artifact in the database
  const artifact = await createArtifact({
    title,
    kind,
    userId: session.user.id,
    content: ''
  });

  // Revalidate the path and redirect
  revalidatePath('/artifacts');
  redirect(`/artifacts/${artifact.id}`);
}

// This function is called by the AI to create documents
export async function createDocumentFromAI({
  title,
  kind = 'text',
  content = ''
}: {
  title: string;
  kind?: string;
  content?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  if (!title) {
    throw new Error('Title is required');
  }

  try {
    // Create the artifact
    const artifact = await createArtifact({
      title,
      kind: kind as ArtifactKind,
      userId: session.user.id,
      content: content || `# ${title}\n\nDocument created by AI.`
    });

    return {
      id: artifact.id,
      title: artifact.title,
      kind: artifact.kind,
      url: `/artifacts/${artifact.id}`
    };
  } catch (error) {
    console.error('Error creating document:', error);
    throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 