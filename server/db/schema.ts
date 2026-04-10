import { desc } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  boolean,
  real,
  timestamp,
  unique,
  index,
  varchar,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm/relations'

export const authProvider = pgEnum('auth_provider', ['google', 'apple'])
export const shotLocation = pgEnum('shot_location', ['left', 'center', 'right'])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const userProviders = pgTable(
  'user_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProvider('provider').notNull(),
    providerId: varchar('provider_id', { length: 200 }).notNull(),
    providerEmail: varchar('provider_email', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('uq_provider_providerId').on(t.provider, t.providerId),
    unique('uq_user_provider').on(t.userId, t.provider),
    index('idx_provider_lookup').on(t.provider, t.providerId),
    index('idx_user_lookup').on(t.userId),
  ],
)

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  date: text('date').notNull(),
  location: text('location'),
  name: text('name'),
  description: text('description'),
})

export const shots = pgTable('shots', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => sessions.id)
    .notNull(),
  made: boolean('made').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  shotLocation: shotLocation('shot_location').notNull(),
  takenAt: timestamp('taken_at').defaultNow(),
})

// 1 user has many providers
export const userRelations = relations(users, ({ many }) => ({
  userProviders: many(userProviders),
  sessions: many(sessions),
}))

// 1 provider belongs to 1 user
export const userProvidersRelations = relations(userProviders, ({ one }) => ({
  user: one(users, {
    fields: [userProviders.userId],
    references: [users.id],
  }),
}))

// 1 session belongs to 1 user
export const sessionRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  shots: many(shots),
}))

// 1 session has many shots
export const shotRelations = relations(shots, ({ one }) => ({
  session: one(sessions, {
    fields: [shots.sessionId],
    references: [sessions.id],
  }),
}))
