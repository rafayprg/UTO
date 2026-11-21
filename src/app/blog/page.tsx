import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, ShieldCheck, Layers } from "lucide-react";
import { getPosts } from "@/lib/mdx";
import { GuideDirectory } from "@/components/GuideDirectory";
import { tools } from "@/lib/tools-registry";

export const metadata = {
  title: "1,034+ Free Tool Guides & Formulas (Category-Wise) — Localtools",
  description: "Browse 1,034+ practical guides, mathematical calculation formulas, and step-by-step tutorials for browser tools across all categories. 100% free with zero server uploads.",
  alternates: { canonical: "/blog/" },
};

export default function BlogPage() {
  const editorialPosts = getPosts();

  return (
    <div className="page-container blog-hub-page">
      <header className="page-intro">
        <span className="tool-icon large">
          <BookOpen size={28} />
        </span>
        <p className="eyebrow">
          <Sparkles size={13} /> COMPLETE KNOWLEDGE BASE · {tools.length} DEDICATED GUIDES
        </p>
        <h1>Tool Guides & Knowledge Hub</h1>
        <p>
          Practical, example-led guides and mathematical formula walkthroughs for every single one of
          our {tools.length} browser-native tools. Organized category-wise so you can master the tools,
          understand the calculation logic, and get accurate results privately.
        </p>
      </header>

      {/* Trust Stats Bar */}
      <div className="journal-note">
        <BookOpen size={22} />
        <p>
          Every tool has its own dedicated guide with formulas, worked scenarios, and common pitfalls.
          All tools execute 100% in your browser with zero data leaving your device.
        </p>
        <span>{tools.length} Dedicated Guides</span>
      </div>

      {/* Featured Editorial Deep-Dives */}
      <section className="editorial-posts-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><ShieldCheck size={12} /> FOUNDATIONAL ARCHITECTURE</p>
            <h2>Featured Deep-Dive Guides</h2>
            <p className="section-caption">In-depth technical explainers on browser privacy, WebAssembly, and file conversion.</p>
          </div>
        </div>

        <div className="tool-grid journal-grid">
          {editorialPosts.slice(0, 4).map((post) => (
            <Link className="tool-card" key={post.slug} href={`/blog/${post.slug}/`}>
              <p className="eyebrow">{post.frontmatter.category}</p>
              <h2>{post.frontmatter.title}</h2>
              <p>{post.frontmatter.description}</p>
              <div className="card-bottom">
                <span>{post.frontmatter.readingTime}</span>
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
            <p className="eyebrow"><Layers size={12} /> CATEGORY DIRECTORY</p>
            <h2>All {tools.length} Tool Guides by Category</h2>
            <p className="section-caption">Search or filter by category to find step-by-step guides and formulas for any tool.</p>
          </div>
        </div>

        <GuideDirectory />
      </section>
    </div>
  );
}
