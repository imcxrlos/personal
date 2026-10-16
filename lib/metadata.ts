import type { Metadata } from "next";
import { site } from "@/lib/content";

// Next replaces a parent's openGraph object rather than merging it, so each
// page builds a complete one. The image comes from the nearest
// opengraph-image file; twitter inherits title, description and image.
export function openGraph({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata["openGraph"] {
  return {
    title,
    description,
    url: path,
    siteName: site.handle,
    locale: "en_US",
    type,
  };
}
