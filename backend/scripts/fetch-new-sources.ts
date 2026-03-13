import "dotenv/config";
import { db } from "../src/db/index.js";
import { sources } from "../src/db/schema.js";
import { inArray } from "drizzle-orm";
import { fetchRSS } from "../src/worker/fetchers/rss.js";

const slugs = ["blender", "3d-modeling", "board-games", "game-dev", "ai", "local-news"];
const cats = await db.query.categories.findMany();
const catIds = cats.filter((c) => slugs.includes(c.slug)).map((c) => c.id);
const newSources = await db.query.sources.findMany({
  where: inArray(sources.categoryId, catIds),
});

console.log(`Fetching ${newSources.length} new sources...`);
let total = 0;

for (const s of newSources) {
  try {
    const n = await fetchRSS(s);
    if (n > 0) console.log(`  ${s.name}: +${n}`);
    total += n;
  } catch (e) {
    console.log(`  SKIP ${s.name}: ${(e as Error).message}`);
  }
}

console.log(`Total new articles: ${total}`);
process.exit(0);
