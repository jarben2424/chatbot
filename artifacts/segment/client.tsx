import { Artifact } from '@/components/create-artifact';
import { SegmentEditor } from '@/components/segment-editor';
import {
  CopyIcon,
  RedoIcon,
  UndoIcon,
  UserIcon,
} from '@/components/icons';
import { toast } from 'sonner';

type Metadata = any;

export const segmentArtifact = new Artifact<'segment', Metadata>({
  kind: 'segment',
  description: 'Useful for creating customer segments',
  initialize: async () => {},
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === 'text-delta') {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.content as string,
        isVisible: true,
        status: 'streaming',
      }));
    }
  },
  toolbar: [],
  content: ({
    content,
    currentVersionIndex,
    isCurrentVersion,
    onSaveContent,
    status,
  }) => {
    return (
      <SegmentEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={isCurrentVersion}
        saveContent={onSaveContent}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy content',
      onClick: async ({ content }) => {
        try {
          await navigator.clipboard.writeText(content);
          toast.success('Copied to clipboard');
        } catch (e) {
          toast.error('Failed to copy to clipboard');
        }
      },
    },
    {
      icon: <UserIcon />,
      description: 'View segment details',
      onClick: ({ content }) => {
        try {
          const segmentData = JSON.parse(content);
          toast.success(`Segment: ${segmentData.name || 'Untitled'}`);
        } catch (e) {
          toast.error('Invalid segment data');
        }
      },
    },
  ],
});

