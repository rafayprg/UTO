import Link from "next/link";
import { BookOpen, ArrowUpRight } from "lucide-react";
import { getPosts } from "@/lib/mdx";
export const metadata = { title: "Practical guides for files, code, writing, and calculations", description: "Step-by-step browser-tool tutorials with worked examples, troubleshooting, and clear limits. Written in US English for everyday work.", alternates: { canonical: "/blog/" } };
export default function BlogPage() {
  const posts = getPosts();
  return <div className="page-container"><div className="page-intro"><p className="eyebrow">THE LOCALTOOLS FIELD GUIDE</p><h1>Do the task.<br/>Understand the result.</h1><p>Practical tutorials for the files, numbers, and small digital jobs in your day. Clear steps, worked examples, and the details worth checking.</p><Link className="text-link" href="/editorial-policy/">How we prepare our guides <ArrowUpRight size={14}/></Link></div><div className="journal-note"><BookOpen size={21}/><p>Start with the problem you’re solving. Every guide links to a free browser tool, with no account or server upload required.</p><span>{posts.length} practical guides</span></div><div className="tool-grid journal-grid">{posts.map(post => <Link className="tool-card" key={post.slug} href={`/blog/${post.slug}/`}><p className="eyebrow">{post.frontmatter.category}</p><h2>{post.frontmatter.title}</h2><p>{post.frontmatter.description}</p><div className="card-bottom"><span>{post.frontmatter.readingTime}</span><span>Read guide ↗</span></div></Link>)}</div></div>;
}
