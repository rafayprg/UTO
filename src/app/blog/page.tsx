import Link from "next/link";
import { BookOpen, Sparkles, ShieldCheck, Layers, Clock, FileText, ArrowRight } from "lucide-react";
import { getPosts } from "@/lib/mdx";
import { GuideDirectory } from "@/components/GuideDirectory";
import { tools } from "@/lib/tools-registry";
import { absolute, site } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practical Browser Tool Guides & Calculation Formulas — Localtools Hub",
  description: "Comprehensive step-by-step technical guides, mathematical formulas, and data privacy explainers for in-browser tools. 100% client-side with zero data uploads.",
  keywords: [
    "browser tool guides",
    "pdf merge guide",
    "image conversion tutorial",
    "unit conversion formulas",
    "margin markup calculator guide",
    "json formatting safety",
    "qr code generator guide",
    "localtools guides"
  ],
  alternates: { canonical: "/blog/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: site.name,
    title: "Practical Browser Tool Guides & Knowledge Hub — Localtools",
    description: "In-depth tutorials, privacy architectures, and calculation formulas for browser-native developer, document, and media tools.",
    url: absolute("/blog/"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Tool Guides & Knowledge Hub — Localtools",
    description: "Browse step-by-step guides, formulas, and privacy walkthroughs for browser-native tools.",
  },
};

export default function BlogPage() {
  const editorialPosts = getPosts();
  const hubUrl = absolute("/blog/");

  const collectionSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${hubUrl}#collection`,
        "url": hubUrl,
        "name": "Localtools Technical Guides & Knowledge Hub",
        "description": "Comprehensive practical guides, mathematical calculation formulas, and client-side privacy tutorials.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": `${absolute("/")}#website`,
          "name": site.name,
          "url": absolute("/"),
        },
        "about": {
          "@type": "Thing",
          "name": "Browser Tools, Document Processing, and Local Privacy Computing",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${hubUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": absolute("/"),
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Guides & Knowledge Hub",
            "item": hubUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${hubUrl}#postlist`,
        "name": "Featured In-Depth Technical Guides",
        "itemListElement": editorialPosts.map((post, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "url": absolute(`/blog/${post.slug}/`),
          "name": post.frontmatter.title,
          "description": post.frontmatter.description,
        })),
      },
    ],
  };

  return (
    <div className="page-container blog-hub-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c"),
        }}
      />

      <header className="page-intro">
        <span className="tool-icon large">
          <BookOpen size={28} />
        </span>
        <p className="eyebrow">
          <Sparkles size={13} /> COMPLETE KNOWLEDGE BASE · {editorialPosts.length} TECHNICAL ESSAYS &amp; {tools.length} TOOL GUIDES
        </p>
        <h1>Tool Guides &amp; Knowledge Hub</h1>
        <p>
          Practical, example-led guides and mathematical formula walkthroughs for every single one of
          our {tools.length} browser-native tools. Organized category-wise so you can master the tools,
          understand the calculation logic, and get accurate results privately without uploading any data.
        </p>
      </header>

      {/* Trust Stats Bar */}
      <div className="journal-note">
        <BookOpen size={22} />
        <p>
          Every tool has its own dedicated guide with formulas, worked scenarios, and common pitfalls.
          All operations execute 100% in your browser with zero data leaving your device.
        </p>
        <span>{tools.length} Dedicated Guides</span>
      </div>

      {/* Featured Editorial Deep-Dives */}
      <section className="editorial-posts-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><ShieldCheck size={12} /> VERIFIED TECHNICAL ESSAYS</p>
            <h2>Featured Deep-Dive Guides ({editorialPosts.length})</h2>
            <p className="section-caption">In-depth technical explainers on browser privacy, WebAssembly, file conversion, and calculation formulas.</p>
          </div>
        </div>

        <div className="tool-grid journal-grid">
          {editorialPosts.map((post) => (
            <Link className="tool-card blog-post-card" key={post.slug} href={`/blog/${post.slug}/`}>
              <div className="card-top">
                <p className="eyebrow">{post.frontmatter.category}</p>
                <span className="byline-tiny">By {post.author.name}</span>
              </div>
              <h2>{post.frontmatter.title}</h2>
              <p>{post.frontmatter.description}</p>
              <div className="card-bottom">
                <span className="reading-time-tag">
                  <Clock size={12} /> {post.frontmatter.readingTime}
                </span>
                <span className="word-count-tag">
                  <FileText size={12} /> {post.wordCount} words
                </span>
                <span className="live-tag">Read Guide &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Master 1,034 Guides Directory (Category-wise) */}
      <section className="master-guides-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><Layers size={12} /> COMPREHENSIVE DIRECTORY</p>
            <h2>All {tools.length} Tool Guides by Category</h2>
            <p className="section-caption">Search or filter by category to find step-by-step guides and formulas for any tool.</p>
          </div>
        </div>

        <GuideDirectory />
      </section>
    </div>
  );
}
