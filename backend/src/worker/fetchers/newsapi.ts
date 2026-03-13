import { db } from "../../db/index.js";
import { articles, sources } from "../../db/schema.js";

type Source = typeof sources.$inferSelect;

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  author: string | null;
  publishedAt: string;
}

interface NewsAPIResponse {
  status: string;
  message?: string;
  articles: NewsAPIArticle[];
}

const BASE_URL = "https://newsapi.org/v2";

export async function fetchNewsAPI(source: Source): Promise<number> {
  // source.identifier is a NewsAPI source ID e.g. "bbc-news", "techcrunch"
  const url = `${BASE_URL}/top-headlines?sources=${source.identifier}&pageSize=20&apiKey=${process.env.NEWSAPI_KEY}`;

  const res = await fetch(url);
  const data = (await res.json()) as NewsAPIResponse;

  if (data.status !== "ok") {
    throw new Error(`NewsAPI error: ${data.message}`);
  }

  const items = data.articles
    .filter((a) => !!a.url && a.title !== "[Removed]")
    .map((a) => ({
      sourceId: source.id,
      externalId: a.url,
      type: "article" as const,
      title: a.title,
      description: a.description ?? null,
      url: a.url,
      imageUrl: a.urlToImage ?? null,
      author: a.author ?? null,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
    }));

  if (items.length === 0) return 0;

  await db
    .insert(articles)
    .values(items)
    .onConflictDoNothing({ target: articles.externalId });

  return items.length;
}
