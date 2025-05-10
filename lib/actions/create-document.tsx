'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { createArtifact, getArtifactsByUserId } from '@/lib/db/artifacts';
import { ArtifactKind } from '@/lib/db/schema';

export async function createDocument(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const title = formData.get('title') as string;
  const kind = formData.get('kind') as ArtifactKind || 'text';

  // Create a new artifact
  const artifact = await createArtifact({
    title,
    kind,
    userId: user.id,
  });

  revalidatePath('/artifacts');
  redirect(`/artifacts/${artifact.id}`);
}

// This is the function that will be called by the AI
export async function createDocumentFromAI({
  title,
  kind = 'text'
}: {
  title: string;
  kind: string;
}) {
  const user = await currentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Create a new artifact
  const artifact = await createArtifact({
    title,
    kind: kind as ArtifactKind,
    userId: user.id,
  });

  return {
    id: artifact.id,
    title: artifact.title,
    kind: artifact.kind,
    url: `/artifacts/${artifact.id}`
  };
} 