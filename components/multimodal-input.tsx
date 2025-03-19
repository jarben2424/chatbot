'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
  Message,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { useSidebar } from './ui/sidebar';
import { useRouter } from 'next/navigation';

import { sanitizeUIMessages } from '@/lib/utils';
import { generateUUID } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import { CommandPalette } from './command-palette';
import { CommandKHint } from './command-k-hint';
import { commands } from './command-palette'; // Import the commands array

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions,
  ) => void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const { setOpen } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = messages.length === 0 ? '120px' : '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      
      // Set initial height based on whether it's the welcome screen
      if (messages.length === 0) {
        textareaRef.current.style.height = '120px';
      } else {
        adjustHeight();
      }
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Setup a click handler to dismiss the command palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCommandPalette && textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setShowCommandPalette(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCommandPalette]);

  // Track the currently selected command index for keyboard navigation
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInput(value);
    
    // Show command palette when "/" is typed at the start of the input
    if (value === '/') {
      setShowCommandPalette(true);
      // Reset selection index when command palette is opened
      setSelectedCommandIndex(0);
    } else {
      setShowCommandPalette(false);
    }
    
    adjustHeight();
  };

  const handleCommandSelect = (command: { id: string; label: string; action: string }) => {
    setInput(command.action);
    setShowCommandPalette(false);
    
    // Immediately action the command based on its ID
    const commandActions: Record<string, () => void> = {
      'dashboard': () => router.push('/dashboards'),
      'campaigns': () => router.push('/campaigns'),
      'segments': () => router.push('/segments'),
      // Add other direct actions here as needed
    };
    
    // If we have a direct action for this command, execute it immediately
    if (command.id in commandActions) {
      commandActions[command.id]();
      return;
    }
    
    // Otherwise, auto-submit the command to be processed
    setTimeout(() => {
      submitForm();
    }, 50);
  };

  // Handle keyboard navigation for command palette
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault(); // Prevent cursor from moving in textarea
          setSelectedCommandIndex(prev => 
            prev <= 0 ? commands.length - 1 : prev - 1 // Wrap around to the last command
          );
          break;
        case 'ArrowDown':
          event.preventDefault(); // Prevent cursor from moving in textarea
          setSelectedCommandIndex(prev => 
            prev >= commands.length - 1 ? 0 : prev + 1 // Wrap around to the first command
          );
          break;
        case 'Enter':
          event.preventDefault(); // Prevent form submission
          // Select the command at the current index
          if (selectedCommandIndex >= 0 && selectedCommandIndex < commands.length) {
            handleCommandSelect(commands[selectedCommandIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setShowCommandPalette(false);
          break;
      }
    } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      
      if (isLoading) {
        toast.error('Please wait for the model to finish its response!');
      } else {
        submitForm();
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // Function to handle hardcoded prompt redirections
    const handleHardcodedPrompts = (inputText: string): boolean => {
      const lowerInput = inputText.toLowerCase().trim();
      
      // Map of trigger phrases to redirect paths
      const redirectMap: Record<string, string> = {
        'view my campaigns': '/campaigns',
        'view campaigns': '/campaigns',
        'show campaigns': '/campaigns',
        'show my campaigns': '/campaigns',
        'go to campaigns': '/campaigns',
        'view dashboards': '/dashboards',
        'show dashboards': '/dashboards',
        'view my dashboards': '/dashboards',
        'show my dashboards': '/dashboards',
        'go to dashboards': '/dashboards',
      };

      // Check if the input matches any of our trigger phrases
      for (const [phrase, path] of Object.entries(redirectMap)) {
        if (lowerInput === phrase) {
          // We'll both navigate and still submit the form
          setTimeout(() => {
            router.push(path);
          }, 100);
          return false; // Return false to allow form submission to proceed
        }
      }

      return false; // Not a hardcoded prompt, or we're handling both actions
    };

    // Check for hardcoded prompts
    if (handleHardcodedPrompts(input)) {
      return; // If a hardcoded prompt was handled, don't proceed with normal submission
    }

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    // Auto-open the sidebar when submitting from the welcome/fresh chat screen
    if (messages.length === 0) {
      setTimeout(() => {
        setOpen(true);
      }, 300); // Small delay to let the UI update with the new message first
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    messages.length,
    setOpen,
    input,
    router,
    setInput,
    resetHeight
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative">
        {showCommandPalette && (
          <CommandPalette
            isVisible={showCommandPalette}
            onSelectCommand={(command) => {
              handleCommandSelect(command);
            }}
            selectedIndex={selectedCommandIndex}
          />
        )}
        <Textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl border border-border !text-base bg-background/80 pb-10 shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus:border-muted-foreground/30',
            messages.length === 0 ? 'min-h-[120px]' : '',
            className,
          )}
          rows={messages.length === 0 ? 3 : 2}
          autoFocus
          onKeyDown={handleKeyDown}
        />

        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} />
        </div>

        <CommandKHint />

        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          {isLoading ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
          )}
        </div>
      </div>

      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="">
            <SuggestedActions append={append} chatId={chatId} />
          </div>
      )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={isLoading}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
