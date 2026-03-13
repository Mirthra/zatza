"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCategories, type Category } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Newspaper, Bookmark, Tv } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          zatza
        </Link>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Fixed nav items */}
        <NavItem href="/" icon={<Newspaper size={15} />} active={pathname === "/"}>
          Top Stories
        </NavItem>
        <NavItem href="/videos" icon={<Tv size={15} />} active={pathname === "/videos"}>
          Videos
        </NavItem>
        <NavItem href="/saved" icon={<Bookmark size={15} />} active={pathname === "/saved"}>
          Saved
        </NavItem>

        <Separator className="my-2" />

        {/* Dynamic categories */}
        {categories
          .filter((c) => c.slug !== "videos")
          .map((cat) => (
            <NavItem
              key={cat.id}
              href={`/category/${cat.slug}`}
              active={pathname === `/category/${cat.slug}`}
            >
              {cat.name}
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {cat.articleCount > 999 ? "999+" : cat.articleCount}
              </span>
            </NavItem>
          ))}
      </nav>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
