/**
 * Quick smoke test: fetch one YouTube channel and print results.
 * Run with: npx tsx scripts/test-youtube-fetch.ts
 */
import "dotenv/config";
import { db } from "../src/db/index.js";
import { sources, articles } from "../src/db/schema.js";
import { eq } from "drizzle-orm";
import { fetchYouTube } from "../src/worker/fetchers/youtube.js";

// Fireship — a small, frequently updated channel good for testing
const TEST_CHANNEL_ID = "UCsBjURrPoezykLs9EqgamOA";

const source = await db.query.sources.findFirst({
  where: eq(sources.identifier, TEST_CHANNEL_ID),
});

if (!source) {
  console.error("Test channel not found in sources table");
  process.exit(1);
}

console.log(`Fetching: ${source.name}`);
const count = await fetchYouTube(source);
console.log(`Inserted ${count} items`);

const fetched = await db.query.articles.findMany({
  where: eq(articles.sourceId, source.id),
  limit: 3,
});

for (const a of fetched) {
  console.log(`\n  ${a.title}`);
  console.log(`  ${a.url}`);
  console.log(`  Duration: ${a.durationSeconds}s | Published: ${a.publishedAt}`);
}

process.exit(0);
