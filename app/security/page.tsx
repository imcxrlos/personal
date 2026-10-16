import type { Metadata } from "next";
import Link from "next/link";
import { securityIntro, securityArticles } from "@/lib/security";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Security engineering write-ups: adversarial testing of a Solana escrow, payment-app security boundaries, web endpoint testing, and reverse engineering.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <>
      <section className="wrap pt-20 pb-10 md:pt-28">
        <p className="eyebrow mb-6">Security</p>
        <h1 className="serif text-4xl leading-[1.1] md:text-5xl max-w-3xl">
          {securityIntro.heading}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
          {securityIntro.lead}
        </p>
        <p className="mt-5 max-w-2xl rounded-sm border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          {securityIntro.note}
        </p>
      </section>

      {/* Article index */}
      <section className="wrap pb-16">
        <ol className="flex flex-col border-t">
          {securityArticles.map((a, i) => (
            <li key={a.slug} className="border-b group">
              <Link
                href={`/security/${a.slug}`}
                className="grid gap-4 py-8 md:grid-cols-[3rem_1fr_auto] md:gap-10 md:py-10"
              >
                <div className="font-mono text-xs text-[var(--color-faint)] md:pt-1">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="eyebrow mb-2">{a.kind}</p>
                  <h2 className="serif text-2xl md:text-3xl transition-colors group-hover:text-[var(--color-accent)]">
                    {a.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
                    {a.blurb}
                  </p>
                </div>
                <span className="hidden self-center font-mono text-xs text-[var(--color-faint)] transition-colors group-hover:text-[var(--color-ink)] md:inline">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link href="/projects" className="btn btn-ghost">
            ← Projects
          </Link>
          <Link href="/" className="link-underline text-sm self-center">
            Back to index
          </Link>
        </div>
      </section>
    </>
  );
}
