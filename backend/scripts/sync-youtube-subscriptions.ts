/**
 * Syncs your YouTube subscriptions into the sources table.
 * Safe to run multiple times — uses onConflictDoNothing.
 *
 * Run with: npx tsx scripts/sync-youtube-subscriptions.ts
 */
import "dotenv/config";
import { db } from "../src/db/index.js";
import { categories, sources } from "../src/db/schema.js";
import { createYouTubeClient } from "../src/lib/youtube-auth.js";

const youtube = createYouTubeClient();

// ─── Fetch all subscriptions (handles pagination) ─────────────────────────────

async function fetchAllSubscriptions() {
  const subs: { channelId: string; title: string }[] = [];
  let pageToken: string | undefined;

  do {
    const res = await youtube.subscriptions.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50,
      pageToken,
    });

    for (const item of res.data.items ?? []) {
      const channelId = item.snippet?.resourceId?.channelId;
      const title = item.snippet?.title;
      if (channelId && title) {
        subs.push({ channelId, title });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return subs;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log("Fetching your YouTube subscriptions...");
const subs = await fetchAllSubscriptions();
console.log(`  Found ${subs.length} subscriptions`);

// Ensure the Videos category exists
await db
  .insert(categories)
  .values({ name: "Videos", slug: "videos", sortOrder: 8 })
  .onConflictDoNothing({ target: categories.slug });

const videosCategory = await db.query.categories.findFirst({
  where: (c, { eq }) => eq(c.slug, "videos"),
});

// Insert each subscription as a source
const sourceValues = subs.map((sub) => ({
  name: sub.title,
  type: "youtube" as const,
  identifier: sub.channelId,
  categoryId: videosCategory?.id ?? null,
  enabled: true,
}));

await db
  .insert(sources)
  .values(sourceValues)
  .onConflictDoNothing({ target: sources.identifier });

const allYoutubeSources = await db.query.sources.findMany({
  where: (s, { eq }) => eq(s.type, "youtube"),
});

console.log(`  ${allYoutubeSources.length} YouTube sources now in DB`);
console.log("Done.");
process.exit(0);
