import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { securityArticles } from "@/lib/security";
import { openGraph } from "@/lib/metadata";

export function generateStaticParams() {
  return securityArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = securityArticles.find((x) => x.slug === slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.blurb,
    alternates: { canonical: `/security/${a.slug}` },
    openGraph: openGraph({
      title: `${a.title} · cxrlos`,
      description: a.blurb,
      path: `/security/${a.slug}`,
      type: "article",
    }),
  };
}

export default async function SecurityArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = securityArticles.find((x) => x.slug === slug);
  if (!a) notFound();

  const idx = securityArticles.findIndex((x) => x.slug === a.slug);
  const next = securityArticles[(idx + 1) % securityArticles.length];

  return (
    <>
      <section className="wrap pt-20 pb-10 md:pt-28">
        <Link
          href="/security"
          className="link-underline font-mono text-xs text-[var(--color-faint)]"
        >
          ← Security
        </Link>
        <p className="eyebrow mt-6 mb-4">{a.kind}</p>
        <h1 className="serif text-4xl leading-[1.1] md:text-5xl max-w-3xl">
          {a.title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]">
          {a.intro}
        </p>
      </section>

      <section className="wrap pb-10">
        <div className="flex flex-col gap-11 border-t pt-10">
          {a.sections.map((s) => (
            <div key={s.heading}>
              <h2 className="serif text-xl md:text-2xl">{s.heading}</h2>
              <div className="mt-4 flex flex-col gap-3 max-w-2xl">
                {s.body.map((para, j) => (
                  <p
                    key={j}
                    className="text-[15px] leading-relaxed text-[var(--color-muted)]"
                  >
                    {para}
                  </p>
                ))}
              </div>
              {s.code ? (
                <figure className="mt-5">
                  <pre className="overflow-x-auto rounded-sm border border-[var(--color-line)] bg-[var(--color-panel)] p-4 text-[12.5px] leading-relaxed">
                    <code className="font-mono text-[var(--color-ink)]">
                      {s.code.code}
                    </code>
                  </pre>
                  {s.code.caption ? (
                    <figcaption className="mt-2 font-mono text-[11px] text-[var(--color-faint)]">
                      {s.code.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl border-t pt-4 font-mono text-xs leading-relaxed text-[var(--color-faint)]">
          {a.limits}
        </p>

        {a.related && a.related.length > 0 ? (
          <div className="mt-10">
            <p className="eyebrow mb-3">Related</p>
            <ul className="flex flex-col gap-1.5">
              {a.related.map((r) =>
                r.external ? (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-underline text-sm text-[var(--color-ink)]"
                    >
                      {r.label} ↗
                    </a>
                  </li>
                ) : (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="link-underline text-sm text-[var(--color-ink)]"
                    >
                      {r.label} →
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
          <Link href="/security" className="btn btn-ghost">
            ← All security work
          </Link>
          <Link
            href={`/security/${next.slug}`}
            className="link-underline text-sm"
          >
            Next: {next.title} →
          </Link>
        </div>
      </section>
    </>
  );
}
