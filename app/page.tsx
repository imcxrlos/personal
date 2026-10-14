import Link from "next/link";
import { site, projects, interests } from "@/lib/content";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="wrap pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-3xl rise">
          <p className="eyebrow mb-6">{site.role} — independent</p>
          <h1 className="serif text-4xl leading-[1.08] sm:text-5xl md:text-6xl md:leading-[1.05]">
            Software that custodies nothing it doesn&apos;t have to, and proves what it claims.
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
            {site.intro}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/projects" className="btn btn-solid">
              View projects
            </Link>
            <Link href="/security" className="btn btn-ghost">
              Security work
            </Link>
            <a
              href={site.links.github}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="wrap pb-8" id="work">
        <div className="hairline pt-10">
          <div className="rowgrid mb-10">
            <p className="eyebrow">Selected work</p>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              Three systems where the engineering is defined by its constraints —
              an escrow that can only pay two parties, a bank-data boundary, and an
              AI pipeline held to a measured bar.
            </p>
          </div>

          <ol className="flex flex-col">
            {projects.map((p, i) => (
              <li key={p.slug} className="border-t py-8 md:py-10 group">
                <Link
                  href={`/projects#${p.slug}`}
                  className="grid gap-6 md:grid-cols-[3rem_1fr] md:gap-10"
                >
                  <div className="font-mono text-xs text-[var(--color-faint)] pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h2 className="serif text-2xl md:text-3xl transition-colors group-hover:text-[var(--color-accent)]">
                        {p.name}
                      </h2>
                      <span className="eyebrow">
                        {p.kind} · {p.status}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
                      {p.summary}
                    </p>
                    <ul className="mt-5 flex flex-col gap-1.5">
                      {p.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex gap-3 text-sm text-[var(--color-ink)]"
                        >
                          <span className="mt-[0.45rem] h-px w-3 shrink-0 bg-[var(--color-line-strong)]" />
                          <span className="leading-relaxed">{h}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {p.stack.map((s) => (
                        <span key={s} className="chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Technical interests */}
      <section className="wrap py-16">
        <div className="hairline pt-10">
          <div className="rowgrid">
            <p className="eyebrow">How I work</p>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {interests.map((it) => (
                <div key={it.title}>
                  <h3 className="text-sm font-medium tracking-tight">{it.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                    {it.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="wrap pb-4">
        <div className="hairline pt-10">
          <div className="rowgrid">
            <p className="eyebrow">Contact</p>
            <div>
              <p className="serif text-2xl md:text-3xl max-w-xl leading-snug">
                Building something that has to be correct under adversarial
                conditions?
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={site.links.email} className="btn btn-solid">
                  Get in touch
                </a>
                <a
                  href={site.links.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-ghost"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
