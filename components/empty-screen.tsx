import { UseChatHelpers } from 'ai/react'
import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Create a document for me',
    message: 'Create a document about artificial intelligence trends in 2023'
  },
  {
    heading: 'Explain a complex topic',
    message: 'Explain quantum computing in simple terms'
  },
  {
    heading: 'Draft an email',
    message: 'Write a professional email to request a meeting with a client'
  }
]

export function EmptyScreen({
  setInput,
  append,
  setMessages
}: Pick<UseChatHelpers, 'setInput' | 'append' | 'setMessages'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to AI Chat Assistant
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is an open source AI chat app built with the Vercel AI SDK and OpenAI.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((example, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(example.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {example.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
} 