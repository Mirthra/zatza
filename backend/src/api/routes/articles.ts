import { Hono } from "hono";
import { eq, desc, lt, and, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { articles, sources, categories, articleCategories } from "../../db/schema.js";

const router = new Hono();

// GET /articles
// Query params:
//   category  — category slug (e.g. "technology")
//   type      — "article" | "video"
//   cursor    — ISO timestamp for pagination (publishedAt of last item)
//   limit     — number of results (default 20, max 50)
router.get("/", async (c) => {
  const { category, type, cursor, limit: limitParam } = c.req.query();
  const limit = Math.min(parseInt(limitParam ?? "20"), 50);

  // Resolve category slug → source IDs
  let sourceIds: string[] | undefined;
  if (category) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, category),
    });
    if (!cat) return c.json({ articles: [], nextCursor: null });

    const categorySources = await db.query.sources.findMany({
      where: eq(sources.categoryId, cat.id),
      columns: { id: true },
    });
    sourceIds = categorySources.map((s) => s.id);
    if (sourceIds.length === 0) return c.json({ articles: [], nextCursor: null });
  }

  // Build where conditions
  const conditions = [
    sourceIds ? inArray(articles.sourceId, sourceIds) : undefined,
    type === "article" || type === "video"
      ? eq(articles.type, type)
      : undefined,
    cursor ? lt(articles.publishedAt, new Date(cursor)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const rows = await db.query.articles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(articles.publishedAt)],
    limit: limit + 1, // fetch one extra to know if there's a next page
    with: {
      source: { columns: { name: true, type: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore
    ? page[page.length - 1].publishedAt?.toISOString() ?? null
    : null;

  return c.json({ articles: page, nextCursor });
});

// GET /articles/:id
router.get("/:id", async (c) => {
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, c.req.param("id")),
    with: {
      source: { columns: { name: true, type: true } },
    },
  });

  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json(article);
});

export default router;
