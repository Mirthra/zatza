"use client";

import { useEffect, useState } from "react";
import { getSavedArticles, type SavedArticle } from "@/lib/api";
import { ArticleCard } from "@/components/article-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedArticles()
      .then(setSaved)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Saved</h1>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {saved.map((s) => (
            <ArticleCard key={s.articleId} article={s.article} />
          ))}
        </div>
      )}
    </div>
  );
}
