import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const sourceTypeEnum = pgEnum("source_type", [
  "rss",
  "newsapi",
  "youtube",
]);

export const contentTypeEnum = pgEnum("content_type", ["article", "video"]);

// ─── Sources ──────────────────────────────────────────────────────────────────
// A source is a feed we pull content from: an RSS feed, a NewsAPI query, or a
// YouTube channel.

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: sourceTypeEnum("type").notNull(),
  // For RSS: the feed URL. For NewsAPI: the source ID. For YouTube: the channel ID.
  identifier: text("identifier").notNull().unique(),
  categoryId: uuid("category_id").references(() => categories.id),
  enabled: boolean("enabled").notNull().default(true),
  // When we last successfully fetched from this source
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
// Top-level topics: Technology, Politics, Sports, Science, etc.

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  // Display order in the UI
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Articles ─────────────────────────────────────────────────────────────────
// A normalized content item — either a news article or a YouTube video.

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  // The original URL or YouTube video ID — used for deduplication
  externalId: text("external_id").notNull().unique(),
  type: contentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  author: text("author"),
  // For YouTube videos: duration in seconds
  durationSeconds: integer("duration_seconds"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Article Categories ───────────────────────────────────────────────────────
// Many-to-many: an article can belong to multiple categories.

export const articleCategories = pgTable(
  "article_categories",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.categoryId] })]
);

// ─── Saved Articles ───────────────────────────────────────────────────────────
// Bookmarks — single user, no user ID needed.

export const savedArticles = pgTable("saved_articles", {
  articleId: uuid("article_id")
    .primaryKey()
    .references(() => articles.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  note: text("note"),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ many }) => ({
  sources: many(sources),
  articleCategories: many(articleCategories),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  category: one(categories, {
    fields: [sources.categoryId],
    references: [categories.id],
  }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
  articleCategories: many(articleCategories),
  savedArticle: one(savedArticles, {
    fields: [articles.id],
    references: [savedArticles.articleId],
  }),
}));

export const articleCategoriesRelations = relations(
  articleCategories,
  ({ one }) => ({
    article: one(articles, {
      fields: [articleCategories.articleId],
      references: [articles.id],
    }),
    category: one(categories, {
      fields: [articleCategories.categoryId],
      references: [categories.id],
    }),
  })
);

export const savedArticlesRelations = relations(savedArticles, ({ one }) => ({
  article: one(articles, {
    fields: [savedArticles.articleId],
    references: [articles.id],
  }),
}));
