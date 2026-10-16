import Link from "next/link";
import { site, projects, additionalProjects, areas } from "@/lib/content";
import { HeroShader } from "@/components/hero-shader";

export default function Home() {
  return (
    <>
      {/* Hero — Desktop: the hero is one screen tall; the photograph is
          full width, ~80% of it, and sits at the bottom, with the text centered
          above over the white sky. The crop comes mostly off the empty sky. Mobile: text, then the full image. */}
      <section className="hero relative isolate flex flex-col overflow-hidden md:justify-end">
        {/* Text */}
        <div className="order-1 md:pointer-events-none md:absolute md:inset-x-0 md:top-0 md:z-10">
          <div className="wrap pt-14 pb-8 md:pb-0 md:pt-[8vh] lg:pt-[10vh]">
            <div className="rise relative mx-auto flex max-w-3xl flex-col items-center text-center md:pointer-events-auto">
              {/* Soft glow behind the type only: on short, wide screens the
                  full-bleed photo rises into the text block, and this keeps
                  the copy legible without washing out the rest of the image. */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-24 -inset-y-10 -z-10 hidden md:block"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(255,255,255,0.88) 55%, rgba(255,255,255,0.6) 78%, rgba(255,255,255,0) 100%)",
                }}
              />
              <p className="eyebrow mb-5">Independent software engineer</p>
              <h1 className="serif text-balance text-4xl leading-[1.08] sm:text-5xl md:leading-[1.04]">
                Building systems that earn trust.
              </h1>
              <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-[var(--color-muted)]">
                {site.intro}
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
        </div>

        {/* Soft white veil over the upper band so the type stays legible where
            it meets the water (desktop only; the sky is already white). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] hidden h-[72%] md:block"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.82) 42%, rgba(255,255,255,0.5) 66%, rgba(255,255,255,0.18) 85%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Mobile: the whole image at its natural aspect. Desktop: full width,
            ~80% of the screen, cropped mostly from the sky (see .hero-fit). */}
        <div className="hero-fit relative order-2 aspect-[1600/1138] w-full">
          <HeroShader src="/hero-cove.jpg" />
          {/* Fade the foreground into the page so the hero runs into the next
              section without a hard edge. Pointer events pass through to the
              flow field. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[18%]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 55%, var(--color-paper) 100%)",
            }}
          />
        </div>
      </section>

      {/* Featured projects */}
      <section className="wrap pb-8" id="work">
        <div className="hairline pt-10">
          <div className="rowgrid mb-10">
            <p className="eyebrow">Selected work</p>
            <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">
              The three projects I&apos;ve put the most into. Most of the code is
              private, so each one has a write-up on how it works.
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
              Smaller tools that collect data on a schedule, filter it, and use a
              model only where it helps.
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

      {/* Areas of interest */}
      <section className="wrap py-16">
        <div className="hairline pt-10">
          <div className="rowgrid">
            <p className="eyebrow">Areas of interest</p>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {areas.map((it) => (
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
                Want to talk about a project? Send me an email.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={site.links.email} className="btn btn-solid">
                  Email me
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
