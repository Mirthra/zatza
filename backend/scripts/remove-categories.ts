import "dotenv/config";
import { db } from "../src/db/index.js";
import { categories, sources } from "../src/db/schema.js";
import { inArray, isNull, eq } from "drizzle-orm";

const REMOVE = ["business", "health", "sports", "arts"];

// Find the categories to remove
const toRemove = await db.query.categories.findMany({
  where: inArray(categories.slug, REMOVE),
});

if (toRemove.length === 0) {
  console.log("No matching categories found.");
  process.exit(0);
}

const ids = toRemove.map((c) => c.id);
console.log(`Removing: ${toRemove.map((c) => c.name).join(", ")}`);

// Null out categoryId on any sources pointing to these categories
for (const id of ids) {
  await db
    .update(sources)
    .set({ categoryId: null })
    .where(eq(sources.categoryId, id));
}

// Delete the categories
await db.delete(categories).where(inArray(categories.id, ids));

console.log("Done.");
process.exit(0);
