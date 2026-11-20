import type { MetadataRoute } from "next";
import { tools, categories, toolPath } from "@/lib/tools-registry";
import { getPosts } from "@/lib/mdx";
import { absolute } from "@/lib/site";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "/",
    "/blog/",
    "/about/",
    "/contact/",
    "/privacy-policy/",
    "/terms/",
    "/disclaimer/",
    "/editorial-policy/",
  ].map((path) => ({ url: absolute(path) }));

  const categoryHubs = Object.keys(categories)
    .filter((category) => tools.some((tool) => tool.category === category && tool.indexable))
    .map((category) => ({ url: absolute(`/tools/${category}/`) }));

  const toolPages = tools
    .filter((tool) => tool.indexable)
    .map((tool) => ({ url: absolute(toolPath(tool)) }));

  const toolGuidePages = tools
    .filter((tool) => tool.indexable)
    .map((tool) => ({ url: absolute(`${toolPath(tool)}guide/`) }));

  const blogPages = getPosts().map((post) => ({
    url: absolute(`/blog/${post.slug}/`),
    lastModified: post.frontmatter.publishedAt,
  }));

  return [...staticPages, ...categoryHubs, ...toolPages, ...toolGuidePages, ...blogPages];
}
