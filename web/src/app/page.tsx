import { ArticleFeed } from "@/components/article-feed";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">Top Stories</h1>
      <ArticleFeed />
    </div>
  );
}
