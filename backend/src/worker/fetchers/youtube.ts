import { db } from "../../db/index.js";
import { articles, sources } from "../../db/schema.js";
import { createYouTubeClient } from "../../lib/youtube-auth.js";

const youtube = createYouTubeClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Every channel's uploads playlist ID is its channel ID with "UC" → "UU"
function uploadsPlaylistId(channelId: string): string {
  return "UU" + channelId.slice(2);
}

// Parse ISO 8601 duration (PT1H2M3S) to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] ?? "0") * 3600 +
    parseInt(match[2] ?? "0") * 60 +
    parseInt(match[3] ?? "0")
  );
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

type Source = typeof sources.$inferSelect;

export async function fetchYouTube(source: Source): Promise<number> {
  const playlistId = uploadsPlaylistId(source.identifier);

  // Step 1: Get recent video IDs + basic snippet from uploads playlist (1 quota unit)
  const playlistRes = await youtube.playlistItems.list({
    part: ["snippet"],
    playlistId,
    maxResults: 10,
  });

  const playlistItems = playlistRes.data.items ?? [];
  if (playlistItems.length === 0) return 0;

  const videoIds = playlistItems
    .map((i) => i.snippet?.resourceId?.videoId)
    .filter((id): id is string => !!id);

  // Step 2: Get content details (duration) for all videos in one call (1 quota unit)
  const detailsRes = await youtube.videos.list({
    part: ["contentDetails", "snippet"],
    id: videoIds,
  });

  const videoMap = Object.fromEntries(
    (detailsRes.data.items ?? []).map((v) => [v.id!, v])
  );

  const items = videoIds
    .map((videoId) => {
      const video = videoMap[videoId];
      if (!video) return null;

      return {
        sourceId: source.id,
        externalId: videoId,
        type: "video" as const,
        title: video.snippet?.title ?? "Untitled",
        description: video.snippet?.description?.slice(0, 500) ?? null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        imageUrl:
          video.snippet?.thumbnails?.high?.url ??
          video.snippet?.thumbnails?.default?.url ??
          null,
        author: video.snippet?.channelTitle ?? null,
        durationSeconds: parseDuration(
          video.contentDetails?.duration ?? ""
        ),
        publishedAt: video.snippet?.publishedAt
          ? new Date(video.snippet.publishedAt)
          : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) return 0;

  await db
    .insert(articles)
    .values(items)
    .onConflictDoNothing({ target: articles.externalId });

  return items.length;
}
