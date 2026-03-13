import { ArticleFeed } from "@/components/article-feed";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-4">{name}</h1>
      <ArticleFeed category={slug} />
    </div>
  );
}
