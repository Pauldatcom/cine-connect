import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_username_idx').on(table.username),
  ]
);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});

export const films = pgTable(
  'films',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    imdbId: varchar('imdb_id', { length: 20 }).notNull().unique(),
    title: varchar('title', { length: 500 }).notNull(),
    year: varchar('year', { length: 10 }),
    poster: text('poster'),
    plot: text('plot'),
    director: varchar('director', { length: 500 }),
    actors: text('actors'),
    genre: varchar('genre', { length: 500 }),
    runtime: varchar('runtime', { length: 50 }),
    imdbRating: varchar('imdb_rating', { length: 10 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('films_imdb_id_idx').on(table.imdbId), index('films_title_idx').on(table.title)]
);

export const filmCategories = pgTable('film_categories', {
  filmId: uuid('film_id')
    .notNull()
    .references(() => films.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
});

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filmId: uuid('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5 stars
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('reviews_user_id_idx').on(table.userId),
    index('reviews_film_id_idx').on(table.filmId),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('messages_sender_id_idx').on(table.senderId),
    index('messages_receiver_id_idx').on(table.receiverId),
    index('messages_created_at_idx').on(table.createdAt),
  ]
);

export const friends = pgTable(
  'friends',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, rejected
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('friends_sender_id_idx').on(table.senderId),
    index('friends_receiver_id_idx').on(table.receiverId),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
  sentFriendRequests: many(friends, { relationName: 'sender' }),
  receivedFriendRequests: many(friends, { relationName: 'receiver' }),
}));

export const filmsRelations = relations(films, ({ many }) => ({
  reviews: many(reviews),
  categories: many(filmCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  films: many(filmCategories),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  film: one(films, {
    fields: [reviews.filmId],
    references: [films.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  sender: one(users, {
    fields: [friends.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [friends.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));
