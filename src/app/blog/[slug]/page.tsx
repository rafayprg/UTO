import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldCheck, 
  User, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  BookOpen,
  Share2
} from "lucide-react";
import { getPost, getPosts, type BlogPostItem } from "@/lib/mdx";
import { ToolEmbed } from "@/components/ToolEmbed";
import { absolute, site } from "@/lib/site";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const canonicalUrl = absolute(`/blog/${post.slug}/`);
  const publishedDate = new Date(post.frontmatter.publishedAt).toISOString();
  const modifiedDate = new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt).toISOString();
  const primaryKeywords = post.frontmatter.keywords || [
    post.frontmatter.title,
    post.frontmatter.category,
    "browser tool",
    "private calculator",
    "local tools",
  ];

  return {
    title: `${post.frontmatter.title} — Comprehensive Guide`,
    description: post.frontmatter.description,
    keywords: primaryKeywords,
    authors: [{ name: post.author.name, url: absolute(post.author.url || "/about/") }],
    creator: post.author.name,
    publisher: site.name,
    alternates: { 
      canonical: `/blog/${post.slug}/`,
    },
    openGraph: {
      type: "article",
      locale: "en_US",
      siteName: site.name,
      title: `${post.frontmatter.title} — Complete Guide`,
      description: post.frontmatter.description,
      url: canonicalUrl,
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
      authors: [post.author.name],
      section: post.frontmatter.category,
      tags: primaryKeywords,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.frontmatter.title} — Complete Guide`,
      description: post.frontmatter.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function BlogPost({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const allPosts = getPosts();
  const related = allPosts
    .filter(item => item.slug !== post.slug)
    .filter(item => 
      item.frontmatter.category === post.frontmatter.category || 
      item.frontmatter.relatedToolSlug === post.frontmatter.relatedToolSlug
    )
    .slice(0, 3);

  // If we need more related posts, fill from latest
  const extraRelated = related.length < 3 
    ? allPosts.filter(item => item.slug !== post.slug && !related.some(r => r.slug === item.slug)).slice(0, 3 - related.length)
    : [];
  const finalRelated = [...related, ...extraRelated];

  const publishDateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.frontmatter.publishedAt));

  const updatedDateStr = post.frontmatter.updatedAt 
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(post.frontmatter.updatedAt))
    : publishDateStr;

  const pageUrl = absolute(`/blog/${post.slug}/`);
  const publishedIso = new Date(post.frontmatter.publishedAt).toISOString();
  const modifiedIso = new Date(post.frontmatter.updatedAt || post.frontmatter.publishedAt).toISOString();

  // Multi-entity Schema.org graph for optimal Google Search rich results & AdSense compliance
  const jsonLdGraph: Record<string, unknown>[] = [
    {
      "@type": ["BlogPosting", "TechArticle"],
      "@id": `${pageUrl}#article`,
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${absolute("/")}#website`,
        "name": site.name,
        "url": absolute("/"),
      },
      "headline": post.frontmatter.title,
      "description": post.frontmatter.description,
      "inLanguage": "en-US",
      "mainEntityOfPage": pageUrl,
      "datePublished": publishedIso,
      "dateModified": modifiedIso,
      "author": {
        "@type": "Person",
        "name": post.author.name,
        "jobTitle": post.author.role,
        "url": absolute(post.author.url || "/about/"),
        "description": post.author.bio,
      },
      "publisher": {
        "@type": "Organization",
        "name": site.name,
        "url": absolute("/"),
        "logo": {
          "@type": "ImageObject",
          "url": absolute("/preview.jpg"),
        },
      },
      "articleSection": post.frontmatter.category,
      "wordCount": post.wordCount,
      "keywords": (post.frontmatter.keywords || [post.frontmatter.title, post.frontmatter.category]).join(", "),
      "isAccessibleForFree": "True",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
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
          "item": absolute("/blog/"),
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": post.frontmatter.category,
          "item": absolute("/blog/"),
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": post.frontmatter.title,
          "item": pageUrl,
        },
      ],
    },
  ];

  // If the article has structured FAQs, inject FAQPage schema
  if (post.faqs && post.faqs.length > 0) {
    jsonLdGraph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      "mainEntity": post.faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    });
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": jsonLdGraph,
  };

  return (
    <article className="page-container blog-article-layout">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* Breadcrumb Navigation (AdSense Crawlability Requirement) */}
      <nav aria-label="Breadcrumb" className="article-breadcrumbs">
        <Link href="/" className="crumb-link">Home</Link>
        <ChevronRight size={13} className="crumb-separator" />
        <Link href="/blog/" className="crumb-link">Guides & Blog</Link>
        <ChevronRight size={13} className="crumb-separator" />
        <span className="crumb-current">{post.frontmatter.category}</span>
      </nav>

      <header className="article-header">
        <div className="article-header-badges">
          <span className="category-pill">{post.frontmatter.category}</span>
          <span className="privacy-pill">
            <ShieldCheck size={13} /> 100% In-Browser & Private
          </span>
        </div>

        <h1 className="article-title">{post.frontmatter.title}</h1>
        <p className="article-deck">{post.frontmatter.description}</p>

        {/* E-E-A-T Author & Editorial Byline */}
        <div className="article-byline-bar">
          <div className="byline-author-group">
            <div className="author-avatar-badge">
              <User size={16} />
            </div>
            <div>
              <div className="author-name-row">
                <span>By</span>
                <Link href="/about/" className="author-name-link">
                  {post.author.name}
                </Link>
                <span className="author-role-tag">{post.author.role}</span>
              </div>
              <div className="byline-meta-row">
                <span className="meta-item">
                  <Calendar size={13} /> Published: {publishDateStr}
                </span>
                {post.frontmatter.updatedAt && (
                  <span className="meta-item updated-date">
                    <Sparkles size={13} /> Updated: {updatedDateStr}
                  </span>
                )}
                <span className="meta-item">
                  <Clock size={13} /> {post.frontmatter.readingTime}
                </span>
                <span className="meta-item">
                  <FileText size={13} /> {post.wordCount.toLocaleString()} words
                </span>
              </div>
            </div>
          </div>
          <div className="byline-trust-tag">
            <ShieldCheck size={15} />
            <span>Fact-checked & locally verified</span>
          </div>
        </div>
      </header>

      {/* Executive Summary / Key Takeaways Box (SGE & Quick Answer Box) */}
      {post.keyTakeaways && post.keyTakeaways.length > 0 && (
        <section className="key-takeaways-box" aria-label="Key Takeaways">
          <div className="takeaways-header">
            <CheckCircle2 size={18} className="takeaway-icon" />
            <h3>Key Takeaways & Summary at a Glance</h3>
          </div>
          <ul className="takeaways-list">
            {post.keyTakeaways.map((item, idx) => (
              <li key={idx}>
                <span className="takeaway-bullet">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Interactive Table of Contents */}
      {post.headings && post.headings.length > 1 && (
        <nav className="article-toc" aria-label="Table of Contents">
          <div className="toc-header">
            <BookOpen size={16} />
            <span>Table of Contents</span>
          </div>
          <ul className="toc-list">
            {post.headings.map((heading) => (
              <li 
                key={heading.id} 
                className={`toc-item level-${heading.level}`}
              >
                <a href={`#${heading.id}`}>
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* AdSense Placement Area - Top of Content (AdSense Policy Compliant) */}
      <div className="ad-placement-slot ad-slot-top" aria-hidden="true">
        <span className="ad-label">Advertisement</span>
        <div className="ad-slot-placeholder">
          <span>Ad Slot — Localtools Guides</span>
        </div>
      </div>

      {/* Main MDX Content */}
      <div className="prose article-body">
        <MDXRemote 
          source={post.content} 
          components={{ 
            ToolEmbed,
            h2: ({ children, ...props }) => {
              const text = typeof children === "string" 
                ? children 
                : Array.isArray(children) 
                  ? children.join("") 
                  : "";
              const id = text ? text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") : undefined;
              return <h2 id={id} {...props}>{children}</h2>;
            },
            h3: ({ children, ...props }) => {
              const text = typeof children === "string" 
                ? children 
                : Array.isArray(children) 
                  ? children.join("") 
                  : "";
              const id = text ? text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") : undefined;
              return <h3 id={id} {...props}>{children}</h3>;
            },
            table: ({ children, ...props }) => (
              <div className="table-responsive-wrapper">
                <table {...props}>{children}</table>
              </div>
            ),
          }} 
        />
      </div>

      {/* Primary Companion Tool Callout Card */}
      <div className="article-tool-cta">
        <ToolEmbed slug={post.frontmatter.relatedToolSlug} />
      </div>

      {/* Structured FAQ Section (Essential for Google FAQ Rich Snippets & AdSense E-E-A-T) */}
      {post.faqs && post.faqs.length > 0 && (
        <section className="article-faq-section" id="frequently-asked-questions">
          <div className="section-title-wrap">
            <HelpCircle size={22} className="faq-title-icon" />
            <div>
              <h2>Frequently Asked Questions</h2>
              <p>Common questions, technical edge cases, and practical tips regarding this workflow.</p>
            </div>
          </div>
          <div className="faq-cards-list">
            {post.faqs.map((faq, index) => (
              <div key={index} className="faq-card">
                <h3 className="faq-question">
                  <span className="faq-q-badge">Q</span>
                  {faq.question}
                </h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AdSense Placement Area - Pre-Footer / Post-Content */}
      <div className="ad-placement-slot ad-slot-bottom" aria-hidden="true">
        <span className="ad-label">Advertisement</span>
        <div className="ad-slot-placeholder">
          <span>Ad Slot — Localtools Guides</span>
        </div>
      </div>

      {/* Author Profile Box (E-E-A-T Core Standard) */}
      <section className="author-profile-card">
        <div className="author-profile-avatar">
          <User size={32} />
        </div>
        <div className="author-profile-info">
          <p className="eyebrow">ABOUT THE AUTHOR</p>
          <h3 className="author-profile-name">{post.author.name}</h3>
          <p className="author-profile-role">{post.author.role}</p>
          <p className="author-profile-bio">{post.author.bio}</p>
          <div className="author-profile-links">
            <Link href="/about/" className="text-link">Learn about Localtools</Link>
            <span className="sep">•</span>
            <Link href="/editorial-policy/" className="text-link">Editorial Standards & Testing Policy</Link>
          </div>
        </div>
      </section>

      {/* Editorial Fact-Checking Guarantee */}
      <div className="article-editorial-note">
        <ShieldCheck size={20} className="editorial-icon" />
        <p>
          <strong>Editorial Integrity & Privacy Guarantee:</strong> Every instruction and code snippet in this guide was rigorously verified against modern web specifications and browser engine implementations. Calculations and file transformations execute strictly on your device with zero server transmission.{" "}
          <Link href="/editorial-policy/">Read our full editorial & verification policy.</Link>
        </p>
      </div>

      {/* Contextual Related Reading / Internal Topic Cluster Links */}
      {finalRelated.length > 0 && (
        <section className="related-reading-section">
          <div className="related-header">
            <h2>Related Practical Guides</h2>
            <p>Continue exploring in-depth tutorials and private browser workflows.</p>
          </div>
          <div className="related-grid">
            {finalRelated.map(item => (
              <Link key={item.slug} href={`/blog/${item.slug}/`} className="related-card">
                <span className="related-category">{item.frontmatter.category}</span>
                <h3 className="related-title">{item.frontmatter.title}</h3>
                <p className="related-desc">{item.frontmatter.description}</p>
                <div className="related-footer">
                  <span>{item.frontmatter.readingTime}</span>
                  <span className="related-cta">Read Guide →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Navigation */}
      <div className="article-bottom-nav">
        <Link href="/blog/" className="button secondary">
          <ArrowLeft size={14} /> Back to all {allPosts.length} guides
        </Link>
      </div>
    </article>
  );
}
