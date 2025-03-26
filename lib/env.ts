// Simple environment helper
export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot',
  // Add other environment variables as needed
};
