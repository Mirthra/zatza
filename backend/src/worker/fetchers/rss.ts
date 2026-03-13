import Parser from "rss-parser";
import { db } from "../../db/index.js";
import { articles, sources } from "../../db/schema.js";

const parser = new Parser();

type Source = typeof sources.$inferSelect;
type NewArticle = typeof articles.$inferInsert;

export async function fetchRSS(source: Source): Promise<number> {
  const feed = await parser.parseURL(source.identifier);

  const items: NewArticle[] = feed.items
    .filter((item) => !!item.link)
    .map((item) => ({
      sourceId: source.id,
      externalId: item.link!,
      type: "article" as const,
      title: item.title ?? "Untitled",
      description: item.contentSnippet ?? item.summary ?? null,
      url: item.link!,
      imageUrl: item.enclosure?.url ?? null,
      author: item.creator ?? item.author ?? null,
      publishedAt: item.isoDate ? new Date(item.isoDate) : null,
    }));

  if (items.length === 0) return 0;

  await db
    .insert(articles)
    .values(items)
    .onConflictDoNothing({ target: articles.externalId });

  return items.length;
}
