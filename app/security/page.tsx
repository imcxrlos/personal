import type { Metadata } from "next";
import Link from "next/link";
import { threatModels, methodology } from "@/lib/content";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How I secure an on-chain escrow and a bank-data integration: what can go wrong, what stops it, and how it's tested.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <>
      <section className="wrap pt-20 pb-10 md:pt-28">
        <p className="eyebrow mb-6">Security</p>
        <h1 className="serif text-4xl leading-[1.1] md:text-5xl max-w-3xl">
          Security notes from two projects that handle money.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
          Protected Pay holds people&apos;s money in escrow, and Find My Savings
          holds a live connection to their bank. For each one: what I trust,
          what could go wrong, what stops it, and how I test that.
        </p>
        <p className="mt-5 max-w-2xl rounded-sm border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Everything here is <span className="text-[var(--color-ink)]">built and tested</span>, and checked against the source. None of it has
          had an external audit, and none of it is a security guarantee.
        </p>
      </section>

      {/* Threat models */}
      {threatModels.map((t) => (
        <section key={t.slug} className="wrap scroll-mt-20 py-14 border-t" id={t.slug}>
          <div className="rowgrid">
            <div>
              <h2 className="serif text-2xl md:text-3xl">{t.project}</h2>
              <Link
                href={`/projects#${t.slug}`}
                className="link-underline mt-2 inline-block font-mono text-xs text-[var(--color-faint)]"
              >
                project detail ↗
              </Link>
            </div>
            <div>
              <h3 className="eyebrow mb-2">What&apos;s trusted</h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
                {t.posture}
              </p>

              <h3 className="eyebrow mt-9 mb-3">What could go wrong</h3>
              <div className="flex flex-col">
                {t.surfaces.map((s) => (
                  <div
                    key={s.surface}
                    className="grid gap-x-6 gap-y-2 border-t py-5 md:grid-cols-[10rem_1fr]"
                  >
                    <div className="font-mono text-xs text-[var(--color-ink)] pt-0.5">
                      {s.surface}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                        <span className="text-[var(--color-faint)]">Risk: </span>
                        {s.risk}
                      </p>
                      <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-accent)]">
                          Control&nbsp;
                        </span>
                        {s.control}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Methodology */}
      <section className="wrap py-14 border-t">
        <div className="rowgrid">
          <p className="eyebrow">How I test</p>
          <div>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)] max-w-2xl">
              The same approach for the on-chain program and the backend.
            </p>
            <ol className="mt-8 flex flex-col gap-6">
              {methodology.map((m, i) => (
                <li key={i} className="grid gap-4 md:grid-cols-[2.5rem_1fr]">
                  <span className="font-mono text-xs text-[var(--color-faint)] pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">
                    {m}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Reproducibility note */}
      <section className="wrap py-14 border-t">
        <div className="rowgrid">
          <p className="eyebrow">Seeing it work</p>
          <div className="max-w-2xl">
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
              The tests are the proof. Protected Pay&apos;s rejections are covered by
              per-instruction LiteSVM tests that check token balances before and
              after. Find My Savings&apos; webhook check refuses anything with a bad
              signature, issuer, audience, expiry or body hash.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
              The source and deployment details stay private. If you want to go
              deeper, I&apos;m happy to walk you through the tests myself.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-ghost">
                ← Projects
              </Link>
              <Link href="/" className="link-underline text-sm self-center">
                Back to index
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
