import type { MetadataRoute } from "next";
import { tools, categories, toolPath } from "@/lib/tools-registry";
import { getPosts } from "@/lib/mdx";
import { absolute } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();

  const corePages: MetadataRoute.Sitemap = [
    {
      url: absolute("/"),
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: absolute("/tools/"),
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absolute("/blog/"),
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const infoPages: MetadataRoute.Sitemap = [
    "/about/",
    "/contact/",
    "/privacy-policy/",
    "/terms/",
    "/disclaimer/",
    "/editorial-policy/",
  ].map((path) => ({
    url: absolute(path),
    lastModified: buildDate,
    changeFrequency: "monthly",
    priority: 0.3,
  }));

  const maxWave = Number(process.env.NEXT_PUBLIC_MAX_WAVE || 2);
  const eligibleTools = tools.filter(
    (tool) => tool.indexable && (tool.publishWave ?? 1) <= maxWave
  );

  const categoryHubs: MetadataRoute.Sitemap = Object.keys(categories)
    .filter((category) => eligibleTools.some((tool) => tool.category === category))
    .map((category) => ({
      url: absolute(`/tools/${category}/`),
      lastModified: buildDate,
      changeFrequency: "daily",
      priority: 0.9,
    }));

  const toolPages: MetadataRoute.Sitemap = eligibleTools
    .map((tool) => ({
      url: absolute(toolPath(tool)),
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const toolGuidePages: MetadataRoute.Sitemap = eligibleTools
    .map((tool) => ({
      url: absolute(`${toolPath(tool)}guide/`),
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const blogPages: MetadataRoute.Sitemap = getPosts().map((post) => ({
    url: absolute(`/blog/${post.slug}/`),
    lastModified: post.frontmatter.publishedAt ? new Date(post.frontmatter.publishedAt) : buildDate,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...corePages,
    ...categoryHubs,
    ...toolPages,
    ...toolGuidePages,
    ...blogPages,
    ...infoPages,
  ];
}
