import { homeImage, ogContentType, ogSize } from "@/lib/og";
import { site } from "@/lib/content";

export const alt = `${site.name}, independent software engineer. I build AI products, payment infrastructure, and the security around them.`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return homeImage();
}
