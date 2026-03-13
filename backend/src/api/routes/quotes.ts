import { Hono } from "hono";

const router = new Hono();

const SYMBOLS = [
  { symbol: "^DJI", name: "DOW" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^GSPC", name: "S&P 500" },
];

// Simple in-memory cache — refreshes every 5 minutes
let cache: { data: Quote[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export interface Quote {
  name: string;
  symbol: string;
  price: number;
  change: number;      // absolute change
  changePct: number;   // percentage change
}

async function fetchOneQuote(symbol: string, name: string): Promise<Quote> {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

  const data = await res.json() as {
    chart: {
      result: {
        meta: {
          regularMarketPrice: number;
          chartPreviousClose: number;
        };
      }[];
    };
  };

  const meta = data.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose;
  const change = price - prev;
  const changePct = (change / prev) * 100;

  return { name, symbol, price, change, changePct };
}

async function fetchQuotes(): Promise<Quote[]> {
  return Promise.all(SYMBOLS.map((s) => fetchOneQuote(s.symbol, s.name)));
}

// GET /quotes
router.get("/", async (c) => {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return c.json({ quotes: cache.data, fetchedAt: new Date(cache.fetchedAt).toISOString() });
  }

  try {
    const quotes = await fetchQuotes();
    cache = { data: quotes, fetchedAt: now };
    return c.json({ quotes, fetchedAt: new Date(now).toISOString() });
  } catch (err) {
    if (cache) return c.json({ quotes: cache.data, fetchedAt: new Date(cache.fetchedAt).toISOString() });
    return c.json({ error: "Unable to fetch quotes" }, 502);
  }
});

export default router;
