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
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  title: text('title'),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: text('id').primaryKey(),
  chatId: text('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  content: text('content').notNull(),
  role: text('role').notNull(),
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

// Dashboard Tables
export const dashboards = pgTable('dashboards', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
});

export const visualizations = pgTable('visualizations', {
  id: text('id').primaryKey(),
  dashboardId: text('dashboard_id')
    .references(() => dashboards.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // bar, line, pie, etc.
  data: json('data'),
  settings: json('settings'),
  position: json('position'), // x, y, width, height for dashboard layout
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
});

// Define relations
// export const chatsRelations = relations(chat, ({ one, many }) => ({
//   user: one(user, {
//     fields: [chat.userId],
//     references: [user.id]
//   }),
//   messages: many(message)
// }));

// export const messagesRelations = relations(message, ({ one }) => ({
//   chat: one(chat, {
//     fields: [message.chatId],
//     references: [chat.id]
//   }),
//   user: one(user, {
//     fields: [message.userId],
//     references: [user.id]
//   })
// }));

export const documentsRelations = relations(document, ({ one }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id]
  })
}));

export const dashboardsRelations = relations(dashboards, ({ one, many }) => ({
  user: one(user, {
    fields: [dashboards.userId],
    references: [user.id]
  }),
  visualizations: many(visualizations)
}));

export const visualizationsRelations = relations(visualizations, ({ one }) => ({
  dashboard: one(dashboards, {
    fields: [visualizations.dashboardId],
    references: [dashboards.id]
  }),
  user: one(user, {
    fields: [visualizations.userId],
    references: [user.id]
  })
}));

export type Chat = typeof chat.$inferSelect;
export type Message = typeof message.$inferSelect;
export type Document = typeof document.$inferSelect;
export type Dashboard = typeof dashboards.$inferSelect;
export type Visualization = typeof visualizations.$inferSelect;
