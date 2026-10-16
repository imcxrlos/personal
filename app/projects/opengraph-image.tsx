import { projectsImage, ogContentType, ogSize } from "@/lib/og";
import { projects, additionalProjects } from "@/lib/content";

export const alt = "Projects by Carlos: what I've built and how it works.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return projectsImage(projects.length + additionalProjects.length);
}
