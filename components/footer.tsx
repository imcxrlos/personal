import Link from "next/link";
import { site } from "@/lib/content";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t mt-24">
      <div className="wrap py-12">
        <div className="rowgrid">
          <div className="eyebrow">{site.handle} — {year}</div>
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
            <p className="max-w-md text-sm text-[var(--color-muted)] leading-relaxed">
              {site.role}. Building AI systems, financial infrastructure, and
              security-conscious applications. Most work is private — reach out for a
              technical walkthrough.
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
    </footer>
  );
}
