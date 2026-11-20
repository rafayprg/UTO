import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
export interface BlogFrontmatter { title: string; description: string; publishedAt: string; category: string; relatedToolSlug: string; readingTime: string }
const directory = path.join(process.cwd(), "src/content/blog");
export function getPosts() {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(file => file.endsWith(".mdx")).map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(directory, file), "utf8"));
    for (const key of ["title", "description", "publishedAt", "category", "relatedToolSlug", "readingTime"]) {
      if (typeof data[key] !== "string" || !data[key].trim()) throw new Error(`${file}: missing ${key}`);
    }
    if (Number.isNaN(Date.parse(data.publishedAt))) throw new Error(`${file}: invalid publishedAt`);
    return { slug: file.replace(/\.mdx$/, ""), frontmatter: data as BlogFrontmatter, content };
  }).sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt));
}
export const getPost = (slug: string) => getPosts().find(post => post.slug === slug);
