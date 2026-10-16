import type { Metadata } from "next";
import Link from "next/link";
import {
  projects,
  projectDetails,
  additionalProjects,
  additionalProjectDetails,
  type Project,
  type ProjectDetail,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "What Protected Pay, StudiSpace, Find My Savings, Reddit Lead Radar and Ticket Arbitrage Intelligence do, and how they're built.",
  alternates: { canonical: "/projects" },
};

function ProjectBreakdown({ p, d }: { p: Project; d: ProjectDetail }) {
  return (
    <section
      id={p.slug}
      className="wrap scroll-mt-20 py-14 md:py-20 border-t"
    >
      <div className="rowgrid">
        {/* Left rail: identity + spec */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="serif text-3xl md:text-4xl">{p.name}</h2>
            <p className="eyebrow mt-2">
              {p.kind} · {p.year}
            </p>
          </div>
          <dl className="flex flex-col gap-0 border-t">
            {d.facts.map((f) => (
              <div
                key={f.label}
                className="flex justify-between gap-4 border-b py-2"
              >
                <dt className="eyebrow pt-0.5">{f.label}</dt>
                <dd className="text-right font-mono text-xs text-[var(--color-ink)]">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Right: narrative */}
        <div>
          <p className="text-[15px] leading-relaxed text-[var(--color-ink)]">
            {d.overview}
          </p>

          <div className="mt-10 flex flex-col gap-9">
            {d.sections.map((s) => (
              <div key={s.heading}>
                <h3 className="text-sm font-medium tracking-tight">
                  <span className="text-[var(--color-accent)] font-mono mr-2">
                    §
                  </span>
                  {s.heading}
                </h3>
                <div className="mt-3 flex flex-col gap-3 border-l pl-5">
                  {s.body.map((para, j) => (
                    <p
                      key={j}
                      className="text-[15px] leading-relaxed text-[var(--color-muted)]"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {d.note ? (
            <p className="mt-10 border-t pt-4 font-mono text-xs leading-relaxed text-[var(--color-faint)]">
              {d.note}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  const all = [...projects, ...additionalProjects];

  return (
    <>
      <section className="wrap pt-20 pb-10 md:pt-28">
        <p className="eyebrow mb-6">Projects</p>
        <h1 className="serif text-4xl leading-[1.1] md:text-5xl max-w-3xl">
          What I&apos;ve built and how it works.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-muted)]">
          The code for these is private, so instead of repo links, here&apos;s
          what each project does and the parts of the engineering worth
          explaining.
        </p>

        {/* Jump list */}
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Projects">
          {all.map((p, i) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className="chip hover:border-[var(--color-ink)]"
            >
              {String(i + 1).padStart(2, "0")} · {p.name}
            </a>
          ))}
        </nav>
      </section>

      {/* Featured */}
      {projects.map((p) => (
        <ProjectBreakdown key={p.slug} p={p} d={projectDetails[p.slug]} />
      ))}

      {/* Additional */}
      <section className="wrap scroll-mt-20 pt-14 border-t" id="additional">
        <p className="eyebrow">Additional projects</p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
          Two smaller tools built around a data pipeline. Both are private, and
          I&apos;ve left out the data vendors, internal endpoints and
          credentials.
        </p>
      </section>
      {additionalProjects.map((p) => (
        <ProjectBreakdown key={p.slug} p={p} d={additionalProjectDetails[p.slug]} />
      ))}

      <section className="wrap py-16 border-t">
        <div className="rowgrid">
          <p className="eyebrow">Next</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/security" className="btn btn-solid">
              Security work →
            </Link>
            <Link href="/" className="link-underline text-sm">
              Back to index
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
