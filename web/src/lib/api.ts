const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "X-API-Key": API_KEY },
    next: { revalidate: 60 }, // cache for 60 seconds
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  articleCount: number;
}

export interface Article {
  id: string;
  sourceId: string;
  externalId: string;
  type: "article" | "video";
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  author: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  fetchedAt: string;
  source: { name: string; type: string };
}

export interface ArticlesResponse {
  articles: Article[];
  nextCursor: string | null;
}

export interface SavedArticle {
  articleId: string;
  savedAt: string;
  note: string | null;
  article: Article;
}

// ─── API functions ────────────────────────────────────────────────────────────

export function getCategories(): Promise<Category[]> {
  return apiFetch("/categories");
}

export function getArticles(params: {
  category?: string;
  type?: "article" | "video";
  cursor?: string;
  limit?: number;
}): Promise<ArticlesResponse> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.type) query.set("type", params.type);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  return apiFetch(`/articles?${query}`);
}

export function getSavedArticles(): Promise<SavedArticle[]> {
  return apiFetch("/saved");
}

export async function saveArticle(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/saved/${id}`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
}

export async function unsaveArticle(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/saved/${id}`, {
    method: "DELETE",
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) throw new Error(`Unsave failed: ${res.status}`);
}

export interface Quote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface QuotesResponse {
  quotes: Quote[];
  fetchedAt: string;
}

export function getQuotes(): Promise<QuotesResponse> {
  return apiFetch("/quotes");
}
