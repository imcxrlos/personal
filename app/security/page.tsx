import type { Metadata } from "next";
import Link from "next/link";
import { threatModels, methodology } from "@/lib/content";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Threat models, attack surfaces, and testing methodology across an on-chain escrow protocol and a bank-data integration — implemented controls, kept distinct from exploratory work.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <>
      <section className="wrap pt-20 pb-10 md:pt-28">
        <p className="eyebrow mb-6">Security</p>
        <h1 className="serif text-4xl leading-[1.1] md:text-5xl max-w-3xl">
          The interesting part is everything the system has to reject.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
          Across these projects the security work is concrete: an on-chain program
          that assumes its own frontend is hostile, and a fintech backend that
          treats a public webhook and a bank access token as the two things most
          worth protecting. What follows is the threat model for each, the attack
          surfaces, and how the boundaries are tested.
        </p>
        <p className="mt-5 max-w-2xl rounded-sm border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-muted)]">
          Scope note — everything described here is an <span className="text-[var(--color-ink)]">implemented, tested control</span>, verified against
          source. This page claims no external audit, no discovered
          vulnerabilities, and no security guarantees. Exploratory work is labelled
          as such.
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
              <h3 className="eyebrow mb-2">Posture</h3>
              <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
                {t.posture}
              </p>

              <h3 className="eyebrow mt-9 mb-3">Attack surfaces</h3>
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
                        <span className="text-[var(--color-faint)]">Risk — </span>
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
          <p className="eyebrow">Testing methodology</p>
          <div>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)] max-w-2xl">
              A consistent approach across both the on-chain and the backend work,
              regardless of language or runtime.
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
          <p className="eyebrow">Reproducibility</p>
          <div className="max-w-2xl">
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
              Where a boundary can be demonstrated, it is demonstrated by its test
              suite rather than by a one-off script. Protected Pay&apos;s rejection
              paths are exercised by per-instruction tests under LiteSVM that assert
              on token balances before and after; Find My Savings&apos; webhook
              verification is a self-contained check that fails closed on a bad
              signature, issuer, audience, expiry, or body checksum.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
              Proprietary source and deployment material stay private. If you&apos;re
              evaluating this work in depth, I&apos;m happy to walk through the test
              suites and the reasoning directly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-ghost">
                ← Project detail
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
