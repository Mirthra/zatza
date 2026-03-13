"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { type Article, saveArticle, unsaveArticle } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/time";

interface CardProps {
  article: Article;
  isSaved: boolean;
  onToggleSaved: (id: string) => void;
}

// ─── Save Button ──────────────────────────────────────────────────────────────

function SaveButton({
  articleId,
  saved,
  onToggle,
  variant = "default",
}: {
  articleId: string;
  saved: boolean;
  onToggle: (id: string) => void;
  variant?: "default" | "overlay";
}) {
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    onToggle(articleId); // optimistic
    try {
      if (saved) await unsaveArticle(articleId);
      else await saveArticle(articleId);
    } catch {
      onToggle(articleId); // revert on error
    } finally {
      setPending(false);
    }
  }

  const base =
    "flex items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const styles =
    variant === "overlay"
      ? `${base} w-8 h-8 bg-black/50 hover:bg-black/70 text-white`
      : `${base} w-7 h-7 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0`;

  return (
    <button
      aria-label={saved ? "Unsave article" : "Save article"}
      onClick={handleClick}
      disabled={pending}
      className={styles}
    >
      {saved ? (
        // Filled bookmark
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary">
          <path d="M6.75 3A2.25 2.25 0 0 0 4.5 5.25v15.75l7.5-4.5 7.5 4.5V5.25A2.25 2.25 0 0 0 17.25 3H6.75Z" />
        </svg>
      ) : (
        // Outline bookmark
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
        </svg>
      )}
    </button>
  );
}

// ─── Hero Card — used for the first article in a feed ─────────────────────────

export function HeroCard({ article, isSaved, onToggleSaved }: CardProps) {
  const domain = getDomain(article.url);

  return (
    <div className="relative group">
      <Link href={article.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-muted">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Video badge + duration */}
          {article.type === "video" && article.durationSeconds && (
            <span className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
              {formatDuration(article.durationSeconds)}
            </span>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Source row */}
            <div className="flex items-center gap-1.5 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?sz=16&domain=${domain}`}
                alt=""
                className="w-4 h-4 rounded-sm opacity-90"
              />
              <span className="text-white/70 text-xs font-medium">{article.source.name}</span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/50 text-xs">
                {article.publishedAt ? formatDistanceToNow(article.publishedAt) : ""}
              </span>
            </div>
            {/* Title */}
            <h2 className="text-white text-lg font-semibold leading-snug line-clamp-3 group-hover:text-white/90">
              {article.title}
            </h2>
            {/* Description */}
            {article.description && (
              <p className="mt-1.5 text-white/60 text-sm line-clamp-2 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Save button — overlay top-left */}
      <div className="absolute top-3 left-3">
        <SaveButton articleId={article.id} saved={isSaved} onToggle={onToggleSaved} variant="overlay" />
      </div>
    </div>
  );
}

// ─── Standard Card — article with image on the right ──────────────────────────

export function ArticleCard({ article, isSaved, onToggleSaved }: CardProps) {
  const isVideo = article.type === "video";
  if (isVideo) return <VideoCard article={article} isSaved={isSaved} onToggleSaved={onToggleSaved} />;

  const domain = getDomain(article.url);

  return (
    <div className="flex items-start gap-1 py-3">
      <Link href={article.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 group flex gap-3">
        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
          {/* Source row */}
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?sz=16&domain=${domain}`}
              alt=""
              className="w-3.5 h-3.5 rounded-sm opacity-70"
            />
            <span className="text-xs text-muted-foreground font-medium truncate">
              {article.source.name}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm font-medium leading-snug line-clamp-3 text-foreground/90 group-hover:text-foreground transition-colors">
            {article.title}
          </p>

          {/* Description */}
          {article.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Time */}
          {article.publishedAt && (
            <span className="text-xs text-muted-foreground/70">
              {formatDistanceToNow(article.publishedAt)}
            </span>
          )}
        </div>

        {/* Thumbnail — right side */}
        {article.imageUrl && (
          <div className="relative shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-muted">
            <Image
              src={article.imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="112px"
              unoptimized
            />
          </div>
        )}
      </Link>

      <SaveButton articleId={article.id} saved={isSaved} onToggle={onToggleSaved} />
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────

export function VideoCard({ article, isSaved, onToggleSaved }: CardProps) {
  return (
    <div className="py-3">
      <Link href={article.url} target="_blank" rel="noopener noreferrer" className="group block">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted mb-2.5">
          {article.imageUrl ? (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
              <span className="text-muted-foreground text-2xl">▶</span>
            </div>
          )}
          {/* Duration */}
          {article.durationSeconds != null && article.durationSeconds > 0 && (
            <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {formatDuration(article.durationSeconds)}
            </span>
          )}
        </div>

        {/* Meta */}
        <p className="text-sm font-medium line-clamp-2 leading-snug text-foreground/90 group-hover:text-foreground transition-colors">
          {article.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {article.source.name}
          {article.publishedAt && (
            <> · {formatDistanceToNow(article.publishedAt)}</>
          )}
        </p>
      </Link>

      {/* Save + badge row */}
      <div className="flex items-center justify-between mt-1.5">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">video</Badge>
        <SaveButton articleId={article.id} saved={isSaved} onToggle={onToggleSaved} />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
