import { getPosts } from "@/lib/mdx";
import { site, absolute } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = getPosts();
  const buildDate = new Date().toUTCString();

  const itemsXml = posts
    .map((post) => {
      const url = absolute(`/blog/${post.slug}/`);
      const pubDate = new Date(post.frontmatter.publishedAt).toUTCString();
      const description = escapeXml(post.frontmatter.description);
      const title = escapeXml(post.frontmatter.title);
      const author = escapeXml(post.author.name);
      const category = escapeXml(post.frontmatter.category);

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${category}</category>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)} Guides &amp; Technical Reference</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${absolute("/feed.xml")}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
