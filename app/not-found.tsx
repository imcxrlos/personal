import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow mb-4">404</p>
      <h1 className="serif text-4xl md:text-5xl">This page doesn&apos;t exist.</h1>
      <p className="mt-4 max-w-md text-[var(--color-muted)]">
        The link may be stale, or the page was never here.
      </p>
      <Link href="/" className="btn btn-solid mt-8">
        Back to index
      </Link>
    </section>
  );
}
