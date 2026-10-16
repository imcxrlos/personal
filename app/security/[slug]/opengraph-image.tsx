import { notFound } from "next/navigation";
import { securityArticleImage, ogContentType, ogSize } from "@/lib/og";
import { securityArticles } from "@/lib/security";

export const alt = "A security case study by Carlos, from cxrlos.com/security";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return securityArticles.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = securityArticles.findIndex((a) => a.slug === slug);
  if (index === -1) notFound();
  const a = securityArticles[index];
  return securityArticleImage({
    index,
    total: securityArticles.length,
    kind: a.kind,
    title: a.title,
    blurb: a.blurb,
    slug: a.slug,
  });
}
