import "dotenv/config";
import { db } from "./index.js";
import { categories, sources } from "./schema.js";

// ─── Categories ───────────────────────────────────────────────────────────────

const defaultCategories = [
  { name: "World",       slug: "world",       sortOrder: 1 },
  { name: "Technology",  slug: "technology",  sortOrder: 2 },
  { name: "Science",     slug: "science",     sortOrder: 3 },
  { name: "Business",    slug: "business",    sortOrder: 4 },
  { name: "Health",      slug: "health",      sortOrder: 5 },
  { name: "Sports",      slug: "sports",      sortOrder: 6 },
  { name: "Arts",        slug: "arts",        sortOrder: 7 },
  { name: "Videos",      slug: "videos",      sortOrder: 8 },
];

// ─── Sources ──────────────────────────────────────────────────────────────────

const defaultSources = [
  // RSS — General News
  {
    name: "BBC News",
    type: "rss" as const,
    identifier: "https://feeds.bbci.co.uk/news/rss.xml",
    categorySlug: "world",
  },
  {
    name: "Reuters",
    type: "rss" as const,
    identifier: "https://feeds.reuters.com/reuters/topNews",
    categorySlug: "world",
  },
  {
    name: "NPR News",
    type: "rss" as const,
    identifier: "https://feeds.npr.org/1001/rss.xml",
    categorySlug: "world",
  },
  // RSS — Technology
  {
    name: "Ars Technica",
    type: "rss" as const,
    identifier: "https://feeds.arstechnica.com/arstechnica/index",
    categorySlug: "technology",
  },
  {
    name: "The Verge",
    type: "rss" as const,
    identifier: "https://www.theverge.com/rss/index.xml",
    categorySlug: "technology",
  },
  {
    name: "Hacker News (Top)",
    type: "rss" as const,
    identifier: "https://news.ycombinator.com/rss",
    categorySlug: "technology",
  },
  // RSS — Science
  {
    name: "NASA News",
    type: "rss" as const,
    identifier: "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    categorySlug: "science",
  },
  // NewsAPI — pulls headlines from these sources
  {
    name: "TechCrunch (API)",
    type: "newsapi" as const,
    identifier: "techcrunch",
    categorySlug: "technology",
  },
  {
    name: "BBC News (API)",
    type: "newsapi" as const,
    identifier: "bbc-news",
    categorySlug: "world",
  },
  {
    name: "Associated Press (API)",
    type: "newsapi" as const,
    identifier: "associated-press",
    categorySlug: "world",
  },
  // YouTube — placeholders; will be replaced with your subscriptions
  {
    name: "Veritasium",
    type: "youtube" as const,
    identifier: "UCHnyfMqiRRG1u-2MsSQLbXA",
    categorySlug: "videos",
  },
  {
    name: "Kurzgesagt",
    type: "youtube" as const,
    identifier: "UCsXVk37bltHxD1rDPwtNM8Q",
    categorySlug: "videos",
  },
  {
    name: "Fireship",
    type: "youtube" as const,
    identifier: "UCsBjURrPoezykLs9EqgamOA",
    categorySlug: "videos",
  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log("Seeding categories...");
const insertedCategories = await db
  .insert(categories)
  .values(defaultCategories)
  .onConflictDoNothing({ target: categories.slug })
  .returning();

const allCategories = await db.query.categories.findMany();
const categoryMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));

console.log(`  ${allCategories.length} categories ready`);

console.log("Seeding sources...");
const sourceValues = defaultSources.map(({ categorySlug, ...rest }) => ({
  ...rest,
  categoryId: categoryMap[categorySlug] ?? null,
}));

await db
  .insert(sources)
  .values(sourceValues)
  .onConflictDoNothing({ target: sources.identifier });

const allSources = await db.query.sources.findMany();
console.log(`  ${allSources.length} sources ready`);

console.log("Seed complete.");
process.exit(0);
