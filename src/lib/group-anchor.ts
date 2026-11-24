/** Stable anchor id for a tool group, shared by the topic grid and the tool list. */
export function groupAnchor(group: string): string {
  const slug = group
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `topic-${slug}`;
}
