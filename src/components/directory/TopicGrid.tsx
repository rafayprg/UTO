import Link from "next/link";
import { groupAnchor } from "@/lib/group-anchor";
import type { ToolSummary } from "@/lib/published";

type Props = { items: ToolSummary[]; categoryName: string };

const SAMPLES_PER_TOPIC = 4;

type Topic = { name: string; rows: ToolSummary[] };

function topicsOf(items: ToolSummary[]): Topic[] {
  const byGroup = new Map<string, ToolSummary[]>();
  for (const item of items) byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]);
  return [...byGroup.entries()]
    .map(([name, rows]) => ({ name, rows }))
    .sort((a, b) => b.rows.length - a.rows.length);
}

/** "Browse by topic": one card per tool group, with a few direct links and a jump to the full list. */
export function TopicGrid({ items, categoryName }: Props) {
  const topics = topicsOf(items);
  if (topics.length < 2) return null;

  return (
    <section className="lt-topics" aria-labelledby="topics-heading">
      <h2 id="topics-heading">Browse {categoryName.toLowerCase()} by topic</h2>
      <div className="lt-topics__grid">
        {topics.map((topic) => (
          <article className="lt-topic" key={topic.name}>
            <h3>
              <a href={`#${groupAnchor(topic.name)}`}>{topic.name}</a>
              <span className="lt-num">{topic.rows.length}</span>
            </h3>
            <ul>
              {topic.rows.slice(0, SAMPLES_PER_TOPIC).map((row) => (
                <li key={row.href}>
                  <Link href={row.href}>{row.title}</Link>
                </li>
              ))}
            </ul>
            {topic.rows.length > SAMPLES_PER_TOPIC && (
              <a className="lt-topic__more" href={`#${groupAnchor(topic.name)}`}>
                See all {topic.rows.length} →
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
