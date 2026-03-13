"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getArticles, type Article } from "@/lib/api";
import { HeroCard, ArticleCard } from "./article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Props {
  category?: string;
  type?: "article" | "video";
}

export function ArticleFeed({ category, type }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (cur?: string) => {
      return getArticles({ category, type, cursor: cur, limit: 30 });
    },
    [category, type]
  );

  useEffect(() => {
    setLoading(true);
    setArticles([]);
    setCursor(null);
    setHasMore(true);

    fetchPage().then((data) => {
      setArticles(data.articles);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, [fetchPage]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) {
          setLoadingMore(true);
          fetchPage(cursor).then((data) => {
            setArticles((prev) => [...prev, ...data.articles]);
            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
            setLoadingMore(false);
          });
        }
      },
      { rootMargin: "200px" }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [cursor, hasMore, loadingMore, fetchPage]);

  if (loading) return <FeedSkeleton />;

  if (articles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No articles yet — check back soon.
      </div>
    );
  }

  const [hero, ...rest] = articles;
  const showHero = !!hero.imageUrl;

  return (
    <div>
      {articles[0]?.fetchedAt && (
        <p className="text-xs text-muted-foreground mb-3">
          Last updated:{" "}
          {new Date(articles[0].fetchedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      )}
      {/* Hero */}
      {showHero && (
        <>
          <HeroCard article={hero} />
          <Separator className="my-4" />
        </>
      )}

      {/* Article list */}
      <div className="divide-y divide-border/60">
        {(showHero ? rest : articles).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-6 text-center text-xs text-muted-foreground">
        {loadingMore ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="w-28 h-20 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : !hasMore ? (
          "You're all caught up."
        ) : null}
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <Skeleton className="w-full aspect-[16/9] rounded-xl" />
      <Separator className="my-4" />
      {/* List skeletons */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="w-28 h-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
