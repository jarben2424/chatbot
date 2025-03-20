import 'ai';

// Extend the Message interface from the 'ai' package to include messageType and toolInvocations
declare module 'ai' {
  interface Message {
    messageType?: string;
    toolInvocations?: ToolInvocation[];
  }
  
  interface ToolInvocation {
    toolName: string;
    toolCallId: string;
    state: 'call' | 'partial-call' | 'result';
    args?: any;
    step?: number;
    result?: any;
  }
}
