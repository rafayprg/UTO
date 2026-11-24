import Link from "next/link";
import { CategoryIcon } from "@/components/ToolIcon";
import type { ToolCategory } from "@/lib/tools-registry";

type Props = {
  category: ToolCategory;
  title: string;
  shortName: string;
  lede: string;
  toolCount: number;
  topicCount: number;
  art: string | null;
};

/** Category page header: breadcrumbs, title, quick facts and the category artwork (or an icon panel until it exists). */
export function CategoryHero({ category, title, shortName, lede, toolCount, topicCount, art }: Props) {
  return (
    <header className="lt-cathero">
      <div className="lt-cathero__text">
        <nav className="lt-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tools/">All tools</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{shortName}</span>
        </nav>
        <h1>{title}</h1>
        <p className="lt-cathero__lede">{lede}</p>
        <ul className="lt-cathero__facts" aria-label="About this category">
          <li>
            <strong className="lt-num">{toolCount.toLocaleString("en-US")}</strong> free tools
          </li>
          <li>
            <strong className="lt-num">{topicCount}</strong> topics
          </li>
          <li>
            <strong>0</strong> uploads, no sign-up
          </li>
        </ul>
      </div>
      <div className="lt-cathero__art" data-has-art={art ? "true" : "false"}>
        {art ? (
          /* Plain <img>: static export with unoptimized images. */
          <img src={art} alt="" width={1600} height={1000} fetchPriority="high" decoding="async" />
        ) : (
          <span className="lt-cathero__glyph" aria-hidden="true">
            <CategoryIcon category={category} size={72} />
          </span>
        )}
      </div>
    </header>
  );
}
