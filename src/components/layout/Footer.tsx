import Link from "next/link";
import { Logo } from "./Logo";
import { categoryKeys, categoryShortNames, publishedTools } from "@/lib/published";

const SITE_LINKS = [
  { href: "/tools/", label: "All tools" },
  { href: "/guides/", label: "Guides" },
  { href: "/blog/", label: "Blog" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/editorial-policy/", label: "Editorial standards" },
  { href: "/privacy-policy/", label: "Privacy policy" },
  { href: "/terms/", label: "Terms" },
  { href: "/disclaimer/", label: "Disclaimer" },
];

export function Footer() {
  return (
    <footer className="lt-footer">
      <div className="lt-wrap">
        <div className="lt-footer__grid">
          <div>
            <Logo tone="paper" />
            <p className="lt-footer__lede">
              {publishedTools.length.toLocaleString("en-US")} free tools that run in your browser. Your files and numbers stay on your device.
            </p>
          </div>
          <nav aria-label="Tool categories">
            <h2>Categories</h2>
            <div className="lt-footer__cats">
              {categoryKeys.map((key) => (
                <Link key={key} href={`/tools/${key}/`}>
                  {categoryShortNames[key]}
                </Link>
              ))}
            </div>
          </nav>
          <nav aria-label="Site">
            <h2>Localtools</h2>
            <div className="lt-footer__links">
              {SITE_LINKS.map(({ href, label }) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
        <div className="lt-footer__base">
          <span>Estimates are for planning. Check tax and legal results with a qualified professional.</span>
          <span>© {new Date().getFullYear()} Localtools</span>
        </div>
      </div>
    </footer>
  );
}
