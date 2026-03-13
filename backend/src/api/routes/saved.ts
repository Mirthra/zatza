import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { savedArticles, articles } from "../../db/schema.js";

const router = new Hono();

// GET /saved — list all saved articles, newest first
router.get("/", async (c) => {
  const saved = await db.query.savedArticles.findMany({
    orderBy: [desc(savedArticles.savedAt)],
    with: {
      article: {
        with: { source: { columns: { name: true, type: true } } },
      },
    },
  });

  return c.json(saved);
});

// POST /saved/:articleId — bookmark an article
router.post("/:articleId", async (c) => {
  const { articleId } = c.req.param();
  const body = await c.req.json<{ note?: string }>().catch(() => ({ note: undefined }));

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });
  if (!article) return c.json({ error: "Article not found" }, 404);

  const existing = await db.query.savedArticles.findFirst({
    where: eq(savedArticles.articleId, articleId),
  });
  if (existing) return c.json(existing); // already saved — idempotent

  const [saved] = await db
    .insert(savedArticles)
    .values({ articleId, note: body.note ?? null })
    .returning();

  return c.json(saved, 201);
});

// DELETE /saved/:articleId — remove bookmark
router.delete("/:articleId", async (c) => {
  const { articleId } = c.req.param();

  await db
    .delete(savedArticles)
    .where(eq(savedArticles.articleId, articleId));

  return c.json({ success: true });
});

export default router;
