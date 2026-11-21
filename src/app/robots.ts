import type { MetadataRoute } from "next";
import { absolute, site } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const allowAllRules = [
    "*",
    "Googlebot",
    "AdsBot-Google",
    "Mediapartners-Google",
    "Bingbot",
    "msnbot",
    "DuckDuckBot",
    "Slurp",
    "Baiduspider",
    "YandexBot",
    // AI Search Bots (Explicitly Allowed)
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "GoogleOther",
    "Applebot",
    "Applebot-Extended",
    "cohere-ai",
    "CCBot",
  ];

  return {
    rules: allowAllRules.map((agent) => ({
      userAgent: agent,
      allow: "/",
    })),
    sitemap: absolute("/sitemap.xml"),
    host: site.url,
  };
}
