import Link from "next/link";
import { site, mood } from "@/lib/content";
import { CurvedText } from "@/components/curved-text";
import { LiquidPauseAnimation } from "@/components/liquid-pause-animation";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t mt-24">
      <div className="wrap pt-12 pb-6 md:pb-10">
        <div className="rowgrid">
          <div className="eyebrow">{site.handle} · {year}</div>
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <p className="max-w-md text-sm text-[var(--color-muted)] leading-relaxed">
              Independent software engineer. Most of my code is private, but
              I&apos;m happy to walk you through it.
            </p>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
              <Link className="link-underline w-fit" href="/projects">
                Projects
              </Link>
              <Link className="link-underline w-fit" href="/security">
                Security
              </Link>
              <a
                className="link-underline w-fit"
                href={site.links.github}
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub ↗
              </a>
              <a className="link-underline w-fit" href={site.links.email}>
                Email ↗
              </a>
            </nav>
          </div>
        </div>
      </div>

      <CurvedText />

      <div className="wrap flex justify-center pt-2 pb-8">
        <p className="flex items-center gap-3">
          <span className="eyebrow">Current mood</span>
          {/* Fixed box so the SVG can't shift the layout as it mounts. */}
          <span aria-hidden className="-mx-2 -my-2 block h-11 w-11 shrink-0">
            <LiquidPauseAnimation restless={mood === "Dangerous"} />
          </span>
          <span className="text-sm text-[var(--color-ink)]">{mood}</span>
        </p>
      </div>
    </footer>
  );
}
