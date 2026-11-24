import Link from "next/link";
import type { ToolSummary } from "@/lib/published";

type Props = { items: ToolSummary[] };

/** "Start here": the most-used tools in a category as large cards. */
export function PopularTools({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="lt-starthere" aria-labelledby="starthere-heading">
      <h2 id="starthere-heading">Start here</h2>
      <div className="lt-starthere__grid">
        {items.map((item) => (
          <Link className="lt-startcard" key={item.href} href={item.href}>
            <span className="lt-startcard__group">{item.group}</span>
            <strong>{item.title}</strong>
            <span className="lt-startcard__desc">{item.desc}</span>
            <span className="lt-startcard__go" aria-hidden="true">
              Open tool →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
