"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Home, Library, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/anime", label: "Anime", icon: Library },
  { href: "/manga", label: "Manga", icon: BookOpen },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-black text-white shadow-glow transition group-hover:scale-105">
            M
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">MAL</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Dashboard</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-3xl border border-slate-200 bg-white/70 p-1.5 shadow-sm dark:border-white/10 dark:bg-slate-900/60 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "focus-ring inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                )}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <ThemeToggle />
      </nav>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
