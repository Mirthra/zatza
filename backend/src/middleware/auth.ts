import { createMiddleware } from "hono/factory";

export const apiKeyAuth = createMiddleware(async (c, next) => {
  // Health check is public so Railway can probe it
  if (c.req.path === "/health") {
    return next();
  }

  const apiKey = c.req.header("X-API-Key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
});
