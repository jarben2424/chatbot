import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Query and visualize data from our warehouse',
    message: 'Show me monthly sales data for the last year with a bar chart'
  },
  {
    heading: 'Create insightful reports on our business metrics',
    message: 'Generate a summary of our key performance indicators'
  },
  {
    heading: 'Help with analysis and recommendations',
    message: 'Analyze our customer retention rates and suggest improvements'
  },
  {
    heading: 'Assist with creating documentation',
    message: 'Create a document explaining our data schema'
  }
]

export function Welcome() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to the Hang AI Assistant
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is a custom AI assistant powered by the latest models.
          It can help with querying data, creating visualizations, and generating insights.
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <button
              key={index}
              className="flex w-full items-center rounded-md px-4 py-2 text-left text-sm transition-colors hover:bg-accent"
              onClick={() => {
                // Handle selecting a predefined message
              }}
            >
              <IconArrowRight className="mr-2 h-4 w-4" />
              <div className="flex-1">
                <p className="font-medium">{message.heading}</p>
                <p className="text-xs text-muted-foreground">
                  {message.message}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 