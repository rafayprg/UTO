"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tools/", label: "All tools" },
  { href: "/guides/", label: "Guides" },
  { href: "/about/", label: "About" },
];

export function NavLinks() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="lt-nav" aria-label="Main">
      {LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
