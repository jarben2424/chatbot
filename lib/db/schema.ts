import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  messageType: text('messageType').default('default'),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const dashboardQuery = pgTable('DashboardQuery', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  question: text('question').notNull(),
  sqlQuery: text('sqlQuery').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  isActive: boolean('isActive').notNull().default(true),
});

export type DashboardQuery = InferSelectModel<typeof dashboardQuery>;

export const report = pgTable('Report', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  description: text('description'),
  type: varchar('type', { enum: ['dashboard_update', 'anomaly_detection', 'recommendation'] }).notNull(),
  content: json('content').notNull(),
  schedule: varchar('schedule', { enum: ['daily', 'weekly', 'monthly', 'custom'] }).notNull(),
  customSchedule: text('customSchedule'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  lastSentAt: timestamp('lastSentAt'),
});

export type Report = InferSelectModel<typeof report>;

export const reportRecipient = pgTable('ReportRecipient', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  reportId: uuid('reportId')
    .notNull()
    .references(() => report.id),
  email: varchar('email', { length: 64 }).notNull(),
  name: varchar('name', { length: 64 }),
  createdAt: timestamp('createdAt').notNull(),
});

export type ReportRecipient = InferSelectModel<typeof reportRecipient>;

export const reportHistory = pgTable('ReportHistory', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  reportId: uuid('reportId')
    .notNull()
    .references(() => report.id),
  status: varchar('status', { enum: ['success', 'failure'] }).notNull(),
  sentAt: timestamp('sentAt').notNull(),
  recipientCount: integer('recipientCount').notNull(),
  content: json('content').notNull(),
});

export type ReportHistory = InferSelectModel<typeof reportHistory>;
