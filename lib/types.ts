export interface ChatMessage extends Message {
  id?: string;
  chatId?: string;
  createdAt?: Date;
  data?: any;
  visualization?: 'table' | 'line' | 'bar' | 'pie';
} 