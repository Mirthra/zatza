import cron from "node-cron";
import { and, eq, lt, notInArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { sources, articles, savedArticles } from "../db/schema.js";
import { fetchRSS } from "./fetchers/rss.js";
import { fetchNewsAPI } from "./fetchers/newsapi.js";
import { fetchYouTube } from "./fetchers/youtube.js";

type SourceType = "rss" | "newsapi" | "youtube";

// Run an array of async tasks with at most `concurrency` running at once
async function batchedRun<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
}

async function runFetchers(type?: SourceType) {
  const allSources = await db.query.sources.findMany({
    where: eq(sources.enabled, true),
  });

  const targets = type
    ? allSources.filter((s) => s.type === type)
    : allSources;

  if (targets.length === 0) return;

  const label = type ?? "all";
  console.log(`[worker] Starting ${label} fetch (${targets.length} sources)`);

  // YouTube: process 10 channels concurrently — avoids 699 simultaneous requests
  // RSS/NewsAPI: process 5 concurrently — these are external servers, be polite
  const concurrency = type === "youtube" ? 10 : 5;

  let totalNew = 0;
  let errors = 0;

  await batchedRun(targets, concurrency, async (source) => {
    try {
      let count = 0;
      if (source.type === "rss") count = await fetchRSS(source);
      else if (source.type === "newsapi") count = await fetchNewsAPI(source);
      else if (source.type === "youtube") count = await fetchYouTube(source);

      await db
        .update(sources)
        .set({ lastFetchedAt: new Date() })
        .where(eq(sources.id, source.id));

      if (count > 0) {
        console.log(`  [${source.type}] ${source.name}: +${count}`);
        totalNew += count;
      }
    } catch (err) {
      errors++;
      console.error(`  [${source.type}] ${source.name}: failed —`, (err as Error).message);
    }
  });

  console.log(
    `[worker] ${label} fetch complete — ${totalNew} new items, ${errors} errors`
  );
}

async function purgeOldArticles() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find saved article IDs so we never delete them
  const saved = await db.query.savedArticles.findMany({ columns: { articleId: true } });
  const savedIds = saved.map((s) => s.articleId);

  const whereClause = savedIds.length > 0
    ? and(lt(articles.fetchedAt, cutoff), notInArray(articles.id, savedIds))
    : lt(articles.fetchedAt, cutoff);

  const deleted = await db
    .delete(articles)
    .where(whereClause)
    .returning({ id: articles.id });

  console.log(`[worker] Purged ${deleted.length} articles older than 24h`);
}

export function startWorker() {
  // RSS: every 30 minutes
  cron.schedule("*/30 * * * *", () => runFetchers("rss"));

  // NewsAPI: every hour
  // Free tier = 100 req/day; we have 3 sources so this is well within budget
  cron.schedule("0 * * * *", () => runFetchers("newsapi"));

  // YouTube: every 4 hours
  // 699 channels × 2 units = ~1,400 units per run × 6 runs/day = ~8,400 units/day
  // Stays comfortably under the 10k/day free quota
  cron.schedule("0 */4 * * *", () => runFetchers("youtube"));

  // Purge articles older than 24h (except saved) — runs at 3am daily
  cron.schedule("0 3 * * *", () => purgeOldArticles());

  console.log("Fetch worker started");
  console.log("  RSS:      every 30 minutes");
  console.log("  NewsAPI:  every hour");
  console.log("  YouTube:  every 4 hours");
  console.log("  Purge:    daily at 3am");

  // Run everything immediately on startup
  runFetchers();
}
