import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sources } from "../../db/schema.js";

const router = new Hono();

// GET /sources
// Query params:
//   type     — "rss" | "newsapi" | "youtube"
//   enabled  — "true" | "false"
router.get("/", async (c) => {
  const { type, enabled } = c.req.query();

  const allSources = await db.query.sources.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
    with: { category: { columns: { name: true, slug: true } } },
  });

  const filtered = allSources.filter((s) => {
    if (type && s.type !== type) return false;
    if (enabled === "true" && !s.enabled) return false;
    if (enabled === "false" && s.enabled) return false;
    return true;
  });

  return c.json(filtered);
});

// PATCH /sources/:id  — toggle enabled / update fields
router.patch("/:id", async (c) => {
  const body = await c.req.json<{ enabled?: boolean }>();

  const existing = await db.query.sources.findFirst({
    where: eq(sources.id, c.req.param("id")),
  });
  if (!existing) return c.json({ error: "Not found" }, 404);

  const updated = await db
    .update(sources)
    .set({ enabled: body.enabled ?? existing.enabled })
    .where(eq(sources.id, c.req.param("id")))
    .returning();

  return c.json(updated[0]);
});

export default router;
