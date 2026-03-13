import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiKeyAuth } from "./middleware/auth.js";
import { startWorker } from "./worker/index.js";
import articlesRouter from "./api/routes/articles.js";
import categoriesRouter from "./api/routes/categories.js";
import sourcesRouter from "./api/routes/sources.js";
import savedRouter from "./api/routes/saved.js";

const app = new Hono();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [],
    allowHeaders: ["X-API-Key", "Content-Type"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE"],
  })
);

app.use("*", apiKeyAuth);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/articles", articlesRouter);
app.route("/categories", categoriesRouter);
app.route("/sources", sourcesRouter);
app.route("/saved", savedRouter);

const port = Number(process.env.PORT) || 3001;
console.log(`Zatza backend running on port ${port}`);

serve({ fetch: app.fetch, port });

startWorker();
