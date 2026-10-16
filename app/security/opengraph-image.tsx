import { securityImage, ogContentType, ogSize } from "@/lib/og";
import { securityArticles } from "@/lib/security";

export const alt = "Security work by Carlos: write-ups on what my software should refuse to do.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return securityImage(securityArticles.map((a) => a.kind));
}
