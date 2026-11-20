import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPost, getPosts } from "@/lib/mdx";
import { ToolEmbed } from "@/components/ToolEmbed";
import { absolute } from "@/lib/site";
export const dynamicParams = false;
export function generateStaticParams() { return getPosts().map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const post = getPost((await params).slug); if (!post) notFound(); return { title: post.frontmatter.title, description: post.frontmatter.description, alternates: { canonical: `/blog/${post.slug}/` }, openGraph: { type: "article", locale:"en_US", title: post.frontmatter.title, description: post.frontmatter.description, publishedTime: post.frontmatter.publishedAt, url:absolute(`/blog/${post.slug}/`) } }; }
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug); if (!post) notFound();
  const related=getPosts().filter(item=>item.slug!==post.slug).filter(item=>item.frontmatter.category===post.frontmatter.category||item.frontmatter.relatedToolSlug===post.frontmatter.relatedToolSlug).slice(0,2);
  const date=new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(post.frontmatter.publishedAt));
  const schema={"@context":"https://schema.org","@type":"Article",headline:post.frontmatter.title,description:post.frontmatter.description,inLanguage:"en-US",datePublished:post.frontmatter.publishedAt,author:{"@type":"Organization",name:"Localtools",url:absolute("/editorial-policy/")},mainEntityOfPage:absolute(`/blog/${post.slug}/`)};
  return <article className="page-container prose"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><Link className="back-link" href="/blog/">← All guides</Link><p className="eyebrow article-category">{post.frontmatter.category}</p><h1>{post.frontmatter.title}</h1><p className="article-deck">{post.frontmatter.description}</p><div className="article-byline"><Link href="/editorial-policy/">Localtools guides</Link><time dateTime={post.frontmatter.publishedAt}>{date}</time><span>{post.frontmatter.readingTime}</span></div><MDXRemote source={post.content} components={{ ToolEmbed }}/><ToolEmbed slug={post.frontmatter.relatedToolSlug}/>{related.length>0&&<section className="related-reading"><h2>Keep exploring</h2>{related.map(item=><p key={item.slug}><Link href={`/blog/${item.slug}/`}>{item.frontmatter.title} →</Link></p>)}</section>}<p className="article-editorial-note">Prepared with AI-assisted drafting and checked against this tool’s workflow and limitations. <Link href="/editorial-policy/">Read our editorial standards.</Link></p></article>;
}
