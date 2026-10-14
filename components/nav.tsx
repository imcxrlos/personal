"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/content";

const nav = [
  { href: "/", label: "Index" },
  { href: "/projects", label: "Projects" },
  { href: "/security", label: "Security" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--color-paper)]/90 backdrop-blur-sm">
      <div className="wrap flex h-14 items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2" aria-label="Home">
          <span className="font-mono text-sm tracking-tight">{site.handle}</span>
          <span className="hidden text-xs text-[var(--color-faint)] sm:inline">
            {site.domain}
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`font-mono text-xs px-3 py-1.5 rounded-sm transition-colors ${
                  active
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-faint)] hover:text-[var(--color-ink)]"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="ml-1.5 text-[var(--color-accent)]">·</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
