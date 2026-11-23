import type { ToolCategory } from "./categories";

/** Short, plain-language names for navigation. Safe to import in client components. */
export const categoryShortNames: Record<ToolCategory, string> = {
  finance: "Tax & salary",
  "real-estate": "Real estate",
  insurance: "Insurance & loans",
  business: "Business & fees",
  marketing: "Marketing",
  legal: "Legal documents",
  pdf: "PDF",
  image: "Image & design",
  media: "Video & audio",
  dev: "Developer",
  crypto: "Encoding & hashes",
  youtube: "YouTube",
  text: "Text & SEO",
  calculator: "Math & units",
  data: "CSV & data",
};
