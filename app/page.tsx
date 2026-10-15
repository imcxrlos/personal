import Link from "next/link";
import { site, projects, additionalProjects, interests } from "@/lib/content";
import { HeroShader } from "@/components/hero-shader";

export default function Home() {
  return (
    <>
      {/* Hero — centered type over the full-bleed particle cove, which reads
          as a full-width band beneath the text. */}
      <section className="relative isolate flex min-h-[92svh] items-start overflow-hidden border-b pt-24 md:min-h-[90vh] md:pt-32">
        {/* Full-bleed background: interactive particle photograph */}
        <HeroShader src="/hero-cove-sm.jpg" />

        {/* White veil — a soft halo behind the centered type keeps it legible,
            while the cove reads clearly around and below it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(115% 82% at 50% 40%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.96) 36%, rgba(255,255,255,0.74) 55%, rgba(255,255,255,0.32) 72%, rgba(255,255,255,0) 90%)",
          }}
        />

        {/* Text — centered */}
        <div className="wrap relative z-10 w-full">
          <div className="rise mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="eyebrow mb-6">{site.role} — independent</p>
            <h1 className="serif text-4xl leading-[1.08] sm:text-5xl md:text-6xl md:leading-[1.03]">
              Software that custodies nothing it doesn&apos;t have to, and proves what it claims.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
              {site.intro}
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
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

      {/* Additional projects */}
      <section className="wrap pb-8" id="more">
        <div className="hairline pt-10">
          <div className="rowgrid mb-8">
            <p className="eyebrow">Additional projects</p>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              Production systems built around a data pipeline and a scoring or
              verification model — shipped, and kept honest about what the model
              is allowed to assert.
            </p>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-sm border bg-[var(--color-line)] sm:grid-cols-2">
            {additionalProjects.map((p) => (
              <li key={p.slug} className="bg-[var(--color-paper)]">
                <Link
                  href={`/projects#${p.slug}`}
                  className="group flex h-full flex-col p-6 transition-colors hover:bg-[var(--color-panel)] md:p-7"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="serif text-xl md:text-2xl transition-colors group-hover:text-[var(--color-accent)]">
                      {p.name}
                    </h3>
                    <span className="eyebrow shrink-0">{p.status}</span>
                  </div>
                  <p className="eyebrow mt-1">{p.kind}</p>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                    {p.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.stack.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-[var(--color-faint)] transition-colors group-hover:text-[var(--color-ink)]">
                    Read the breakdown →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
