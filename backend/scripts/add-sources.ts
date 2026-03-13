/**
 * Adds new categories and RSS sources for user interests.
 * Safe to run multiple times — uses onConflictDoNothing.
 *
 * Run with: npx tsx scripts/add-sources.ts
 */
import "dotenv/config";
import { db } from "../src/db/index.js";
import { categories, sources } from "../src/db/schema.js";

// ─── New categories ───────────────────────────────────────────────────────────

const newCategories = [
  { name: "Blender",       slug: "blender",       sortOrder: 9  },
  { name: "3D Modeling",   slug: "3d-modeling",   sortOrder: 10 },
  { name: "Board Games",   slug: "board-games",   sortOrder: 11 },
  { name: "Game Dev",      slug: "game-dev",      sortOrder: 12 },
  { name: "AI",            slug: "ai",            sortOrder: 13 },
  { name: "Local News",    slug: "local-news",    sortOrder: 14 },
];

// ─── New sources ──────────────────────────────────────────────────────────────

const newSources = [
  // Blender
  { name: "Blender.org",            identifier: "https://www.blender.org/feed/",                          categorySlug: "blender"     },
  { name: "BlenderNation",          identifier: "https://feeds.feedburner.com/Blendernation",             categorySlug: "blender"     },
  { name: "Blender Developers Blog",identifier: "https://code.blender.org/feed/",                        categorySlug: "blender"     },

  // 3D Modeling
  { name: "80.lv",                  identifier: "https://80.lv/feed/",                                   categorySlug: "3d-modeling" },
  { name: "GameFromScratch",        identifier: "https://gamefromscratch.com/feed/",                      categorySlug: "3d-modeling" },

  // Board/Tabletop Games
  { name: "BoardGameGeek",          identifier: "https://boardgamegeek.com/rss/blog/1",                  categorySlug: "board-games" },
  { name: "Shut Up & Sit Down",     identifier: "https://www.shutupandsitdown.com/feed/",                categorySlug: "board-games" },
  { name: "The Dice Tower",         identifier: "https://www.dicetower.com/rss.xml",                     categorySlug: "board-games" },

  // Game Development
  { name: "Game Developer",         identifier: "https://www.gamedeveloper.com/rss.xml",                 categorySlug: "game-dev"    },
  { name: "Godot Engine Blog",      identifier: "https://godotengine.org/rss.xml",                       categorySlug: "game-dev"    },

  // AI
  { name: "MIT Technology Review",  identifier: "https://www.technologyreview.com/feed/",                categorySlug: "ai"          },
  { name: "Ars Technica AI",        identifier: "https://arstechnica.com/ai/feed/",                      categorySlug: "ai"          },
  { name: "The Verge AI",           identifier: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", categorySlug: "ai" },

  // Local News
  { name: "Kitsap Daily News",      identifier: "https://www.kitsapdailynews.com/feed/",                 categorySlug: "local-news"  },
  { name: "Peninsula Daily News",   identifier: "https://peninsuladailynews.com/feed/",                  categorySlug: "local-news"  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log("Adding categories...");
await db.insert(categories).values(newCategories).onConflictDoNothing({ target: categories.slug });

const allCategories = await db.query.categories.findMany();
const categoryMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));
console.log(`  ${allCategories.length} total categories`);

console.log("Adding sources...");
const sourceValues = newSources.map(({ categorySlug, ...rest }) => ({
  ...rest,
  type: "rss" as const,
  categoryId: categoryMap[categorySlug] ?? null,
}));

await db.insert(sources).values(sourceValues).onConflictDoNothing({ target: sources.identifier });

const allSources = await db.query.sources.findMany();
console.log(`  ${allSources.length} total sources`);

console.log("Done.");
process.exit(0);
