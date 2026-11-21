import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogAuthor {
  name: string;
  role: string;
  bio: string;
  url?: string;
  avatar?: string;
}

export interface BlogHeading {
  id: string;
  text: string;
  level: number;
}

export interface BlogCompanionTool {
  name: string;
  url: string;
  description: string;
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  relatedToolSlug?: string;
  readingTime: string;
  author?: BlogAuthor;
  keywords?: string[];
  keyTakeaways?: string[];
  faqs?: BlogFaq[];
  companionTool?: BlogCompanionTool;
}

export interface BlogPostItem {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
  wordCount: number;
  headings: BlogHeading[];
  author: BlogAuthor;
  faqs: BlogFaq[];
  keyTakeaways: string[];
}

export const DEFAULT_AUTHORS: Record<string, BlogAuthor> = {
  alex: {
    name: "Alex Vance",
    role: "Lead Systems & Client-Side Architect",
    bio: "Alex is a software engineer with 12+ years of experience in browser runtimes, WebAssembly, and zero-knowledge client architectures.",
    url: "/about/",
  },
  sarah: {
    name: "Sarah Lin",
    role: "Senior Computational Specialist",
    bio: "Sarah specializes in mathematical modeling, international measurement systems, and financial accuracy algorithms.",
    url: "/about/",
  },
  marcus: {
    name: "Marcus Reed",
    role: "Document & Media Workflow Specialist",
    bio: "Marcus has spent over a decade optimizing PDF specifications, digital typography, and browser-native image codecs.",
    url: "/about/",
  },
};

export function getDefaultAuthor(category: string): BlogAuthor {
  const cat = (category || "").toLowerCase();
  if (cat.includes("pdf") || cat.includes("image") || cat.includes("media") || cat.includes("security")) {
    return DEFAULT_AUTHORS.marcus;
  }
  if (cat.includes("finance") || cat.includes("unit") || cat.includes("calculator") || cat.includes("real-estate")) {
    return DEFAULT_AUTHORS.sarah;
  }
  return DEFAULT_AUTHORS.alex;
}

export function extractHeadings(content: string): BlogHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: BlogHeading[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }
  return headings;
}

export function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

const directory = path.join(process.cwd(), "src/content/blog");

export function getPosts(): BlogPostItem[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter(file => file.endsWith(".mdx"))
    .map(file => {
      const fullPath = path.join(directory, file);
      const rawContent = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(rawContent);

      for (const key of ["title", "description", "publishedAt", "category"]) {
        if (typeof data[key] !== "string" || !data[key].trim()) {
          throw new Error(`${file}: missing ${key}`);
        }
      }
      if (Number.isNaN(Date.parse(data.publishedAt))) {
        throw new Error(`${file}: invalid publishedAt`);
      }

      const wordCount = calculateWordCount(content);
      const readingTime = typeof data.readingTime === "string" && data.readingTime.trim()
        ? data.readingTime
        : `${Math.max(1, Math.round(wordCount / 200))} min read`;

      const relatedToolSlug = typeof data.relatedToolSlug === "string" && data.relatedToolSlug.trim()
        ? data.relatedToolSlug
        : (data.companionTool?.url ? data.companionTool.url.replace(/\/$/, "").split("/").pop() || "" : "");

      const authorKey = typeof data.author === "string" ? data.author.toLowerCase() : "";
      const author = DEFAULT_AUTHORS[authorKey] || (typeof data.author === "object" ? data.author : getDefaultAuthor(data.category));

      const frontmatter: BlogFrontmatter = {
        title: data.title,
        description: data.description,
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        category: data.category,
        relatedToolSlug,
        readingTime,
        author,
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
        faqs: Array.isArray(data.faqs) ? data.faqs : [],
        companionTool: data.companionTool,
      };

      const headings = extractHeadings(content);
      const faqs = frontmatter.faqs || [];
      const keyTakeaways = frontmatter.keyTakeaways || [];

      return {
        slug: file.replace(/\.mdx$/, ""),
        frontmatter,
        content,
        wordCount,
        headings,
        author,
        faqs,
        keyTakeaways,
      };
    })
    .sort((a, b) => {
      const dateA = a.frontmatter.updatedAt || a.frontmatter.publishedAt;
      const dateB = b.frontmatter.updatedAt || b.frontmatter.publishedAt;
      return dateB.localeCompare(dateA);
    });
}

export function getPost(slug: string): BlogPostItem | null {
  const posts = getPosts();
  return posts.find((p) => p.slug === slug) || null;
}
