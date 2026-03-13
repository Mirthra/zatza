import { Hono } from "hono";
import { eq, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, sources, articles } from "../../db/schema.js";

const router = new Hono();

// GET /categories
// Returns all categories sorted by sortOrder, each with an article count
router.get("/", async (c) => {
  const allCategories = await db.query.categories.findMany({
    orderBy: (cat, { asc }) => [asc(cat.sortOrder)],
  });

  // Get article counts per category (via source.categoryId)
  const counts = await db
    .select({
      categoryId: sources.categoryId,
      count: count(articles.id),
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .groupBy(sources.categoryId);

  const countMap = Object.fromEntries(
    counts
      .filter((r) => r.categoryId != null)
      .map((r) => [r.categoryId!, Number(r.count)])
  );

  const result = allCategories.map((cat) => ({
    ...cat,
    articleCount: countMap[cat.id] ?? 0,
  }));

  return c.json(result);
});

export default router;
