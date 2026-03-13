"use client";

import { useEffect, useState } from "react";
import { getQuotes, type Quote } from "@/lib/api";

interface QuoteState {
  quotes: Quote[];
  fetchedAt: string;
}

export function MarketBar() {
  const [state, setState] = useState<QuoteState | null>(null);

  useEffect(() => {
    getQuotes()
      .then((data) => setState({ quotes: data.quotes ?? [], fetchedAt: data.fetchedAt }))
      .catch(() => {});

    const interval = setInterval(() => {
      getQuotes()
        .then((data) => setState({ quotes: data.quotes ?? [], fetchedAt: data.fetchedAt }))
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-6 px-4 py-1.5 border-b border-border/50 bg-card/50 text-xs shrink-0 overflow-x-auto">
      {/* Date */}
      <span className="text-muted-foreground shrink-0">{today}</span>

      <span className="text-border">|</span>

      {/* Quotes */}
      {state && state.quotes.length > 0 ? (
        state.quotes.map((q) => {
          const up = q.changePct >= 0;
          return (
            <div key={q.symbol} className="flex items-center gap-1.5 shrink-0">
              <span className="text-muted-foreground font-medium">{q.name}</span>
              <span className="text-foreground font-mono tabular-nums">
                {q.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </span>
              <span className={up ? "text-emerald-400" : "text-red-400"}>
                {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
              </span>
            </div>
          );
        })
      ) : (
        <span className="text-muted-foreground">Loading markets…</span>
      )}
    </div>
  );
}
