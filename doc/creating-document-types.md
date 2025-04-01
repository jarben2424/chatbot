# Creating New Document Types in the Chat Application

This document provides comprehensive instructions for adding new document types to the chat application. The application supports various document kinds (like charts, spreadsheets, reports, and segments) that can be created, displayed, and edited within the chat interface.

## Table of Contents
- [Overview](#overview)
- [Step 1: Define the New Document Kind](#step-1-define-the-new-document-kind)
- [Step 2: Create Document Editor Component](#step-2-create-document-editor-component)
- [Step 3: Update Document Preview Component](#step-3-update-document-preview-component)
- [Step 4: Create AI Tool for Document Creation](#step-4-create-ai-tool-for-document-creation)
- [Step 5: Update AI Prompts](#step-5-update-ai-prompts)
- [Step 6: Update Command Palette](#step-6-update-command-palette)
- [Step 7: Add Handling in Multimodal Input](#step-7-add-handling-in-multimodal-input)
- [Step 8: Update Document Service](#step-8-update-document-service-backend)
- [File Changes Summary](#file-changes-summary)
- [Testing Your Implementation](#testing-your-implementation)

## Overview

The document system allows users to create, view, and edit various document types within the chat interface. Documents can be:
- Created via AI commands
- Created via slash commands
- Viewed in a compact preview mode within the chat
- Expanded to a full editing mode
- Versioned and managed with consistent UI controls

## Step 1: Define the New Document Kind

### Update Artifact Types
First, define your new document kind in the artifact system:

1. Update `/components/artifact.tsx`:
   ```tsx
   // Add to ArtifactKind type
   export type ArtifactKind = 'chart' | 'spreadsheet' | 'report' | 'segment' | 'your_new_kind';

   // Add to artifactDefinitions array
   export const artifactDefinitions = [
     // Existing definitions
     {
       kind: 'your_new_kind',
       name: 'Your Document Name',
       icon: <YourDocumentIcon className="h-4 w-4" />,
       toolbar: [], // Define any toolbar tools specific to this document type
       // Add other required properties similar to existing definitions
     },
   ];
   ```

## Step 2: Create Document Editor Component

Create a new editor component file at `/components/your-document-editor.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react';
import { UIArtifact } from '@/types';
import { ArtifactActions } from './artifact-actions';
import { EditorHeader } from './editor-header';

interface YourDocumentEditorProps {
  artifact: UIArtifact;
  isExpanded?: boolean;
  onClose?: () => void;
}

export function YourDocumentEditor({ artifact, isExpanded = false, onClose }: YourDocumentEditorProps) {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load your document content here
    if (artifact && artifact.content) {
      try {
        const parsedContent = JSON.parse(artifact.content);
        setContent(parsedContent);
      } catch (e) {
        console.error('Failed to parse document content', e);
      }
      setIsLoading(false);
    }
  }, [artifact]);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-background">
      {/* Header with actions */}
      <EditorHeader
        title={artifact.name || 'Untitled Document'}
        onClose={onClose}
        isExpanded={isExpanded}
      >
        <ArtifactActions 
          artifact={artifact}
          handleVersionChange={() => {}} // Implement version change handling
          currentVersionIndex={0}
          isCurrentVersion={true}
          mode="edit"
          metadata={{}}
          setMetadata={() => {}}
        />
      </EditorHeader>

      {/* Your editor content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading document...</p>
          </div>
        ) : (
          // Your document editing UI here
          <div className="h-full">
            {/* Implement your document editor UI */}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 3: Update Document Preview Component

Modify `/components/document-preview.tsx` to handle your new document kind:

```tsx
// Add your new component import
import { YourDocumentEditor } from './your-document-editor';

// In the PureDocumentPreview function, update the content rendering switch:
const renderContent = () => {
  switch (artifact.kind) {
    // Existing cases...
    case 'your_new_kind':
      return (
        <YourDocumentEditor
          artifact={artifact}
          isExpanded={isExpanded}
          onClose={onClose}
        />
      );
    default:
      return null;
  }
};
```

## Step 4: Create AI Tool for Document Creation

Create a new tool in `/lib/ai/tools/your-document-builder.ts`:

```typescript
import { ArtifactKind } from '@/components/artifact';
import { createDocument } from './document-builder';

export async function buildYourDocument(
  name: string, 
  content: string
): Promise<{ toolName: string; args: [string]; }> {
  // Convert content to appropriate format if needed
  const formattedContent = content;
  
  // Use the standard document creation pattern
  return createDocument(name, formattedContent, 'your_new_kind' as ArtifactKind);
}
```

## Step 5: Update AI Prompts

Modify `/lib/ai/prompts.ts` to include instructions for your new document type:

```typescript
// Add to systemPrompt or relevant prompt sections
`You can create a new document of type "your_new_kind" using the createDocument tool with kind='your_new_kind'.
Use this for [describe when this document type should be used].
`
```

## Step 6: Update Command Palette

Add your document to the command palette in `/components/command-palette.tsx`:

```tsx
export const commands: Command[] = [
  // Existing commands...
  {
    id: 'create-your-document',
    icon: <YourDocumentIcon className="h-4 w-4" />,
    label: 'Create your document',
    action: 'Create a new your_document_type'
  }
];
```

## Step 7: Add Handling in Multimodal Input

Update `/components/multimodal-input.tsx` to handle your new document command:

```tsx
// In handleCommandSelect or similar function
if (command.id === 'create-your-document') {
  setInput('Create a new your_document_type');
  setTimeout(() => {
    submitForm();
  }, 50);
  return;
}
```

## Step 8: Update Document Service (Backend)

If needed, update your backend service that handles document storage:

- Add necessary database migrations/schema updates for the new document type
- Update API endpoints to handle this document type
- Ensure proper serialization/deserialization of your document's content structure

## File Changes Summary

### Files to Create
1. `/components/your-document-editor.tsx` - Main editor component
2. `/lib/ai/tools/your-document-builder.ts` - AI tool for document creation

### Files to Update
1. `/components/artifact.tsx` - Add new document kind definition
2. `/components/document-preview.tsx` - Handle preview rendering of your document
3. `/lib/ai/prompts.ts` - Add AI instructions for the new document
4. `/components/command-palette.tsx` - Add command for creating the document
5. `/components/multimodal-input.tsx` - Handle the document creation command
6. `/components/create-artifact.tsx` - May need updates if it contains document-specific logic
7. `/lib/utils.ts` - May need updates if it contains document-specific utilities

## Testing Your Implementation

1. **Test slash command:** Type `/` and select your new document command
2. **Test direct AI instruction:** Ask the AI to create your document type
3. **Test document preview:** Ensure it appears correctly in chat
4. **Test expansion:** Verify the document can expand to full mode and collapse back
5. **Test editing:** Ensure changes to the document are saved correctly
6. **Test closing:** Verify the document can be closed properly

## Best Practices

1. **Follow existing patterns:** Maintain consistency with how other document types are implemented
2. **Keep UI consistent:** Use the same design patterns and components as other document types
3. **Handle errors gracefully:** Provide appropriate feedback when documents fail to load or save
4. **Test thoroughly:** Document types can have complex interactions with the chat UI
