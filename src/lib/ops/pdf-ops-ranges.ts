// Page-range parsing shared by the PDF organiser tools. Pages are 1-based in text and 0-based in results.

function parseBound(token: string, total: number, whole: string): number {
  if (/^(end|last)$/i.test(token)) return total;
  if (!/^\d+$/.test(token)) throw new Error(`"${whole}" is not a page range. Use numbers like 1-3, 5, 8-end.`);
  const page = Number(token);
  if (page < 1) throw new Error("Page numbers start at 1.");
  if (page > total) throw new Error(`Page ${page} does not exist. This PDF has ${total} page${total === 1 ? "" : "s"}.`);
  return page;
}

/** One range token: "5", "2-4", "4-2" (descending), "7-" or "7-end" (to the end), "-3" (from the start). */
function parseToken(token: string, total: number): number[] {
  const match = /^([^-]*)-([^-]*)$/.exec(token);
  if (!match) {
    const page = parseBound(token, total, token);
    return [page - 1];
  }
  const start = match[1] === "" ? 1 : parseBound(match[1], total, token);
  const end = match[2] === "" ? total : parseBound(match[2], total, token);
  const step = start <= end ? 1 : -1;
  const pages: number[] = [];
  for (let page = start; page !== end + step; page += step) pages.push(page - 1);
  return pages;
}

/** Splits text like "1-3, 5; 8-end" into groups (one group per comma or semicolon). */
export function parseRangeGroups(text: string, total: number): number[][] {
  if (total < 1) throw new Error("This PDF has no pages.");
  const tokens = String(text).split(/[,;]/).map(token => token.replace(/\s+/g, "")).filter(Boolean);
  if (!tokens.length) throw new Error("Enter at least one page or range, for example 1-3, 5.");
  return tokens.map(token => parseToken(token, total));
}

/** All pages named by the ranges, in the order written. Duplicates are kept. */
export function parseRanges(text: string, total: number): number[] {
  return parseRangeGroups(text, total).flat();
}

/** Unique pages in ascending order. */
export function parsePageSet(text: string, total: number): number[] {
  return [...new Set(parseRanges(text, total))].sort((a, b) => a - b);
}

/** Groups of `size` consecutive pages. */
export function chunkPages(total: number, size: number): number[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error("Pages per file must be a whole number of at least 1.");
  const groups: number[][] = [];
  for (let start = 0; start < total; start += size) groups.push(Array.from({ length: Math.min(size, total - start) }, (_, i) => start + i));
  return groups;
}

/** Final page order for "reorder": listed pages first, then (optionally) the rest in their original order. */
export function reorderPages(text: string, total: number, keepRest: boolean): number[] {
  const listed = parseRanges(text, total);
  const seen = new Set<number>();
  for (const page of listed) {
    if (seen.has(page)) throw new Error(`Page ${page + 1} is listed twice. Use the Duplicate PDF Pages tool to repeat pages.`);
    seen.add(page);
  }
  const rest = keepRest ? Array.from({ length: total }, (_, i) => i).filter(page => !seen.has(page)) : [];
  return [...listed, ...rest];
}

/** Saddle-stitch booklet order: each pair is [left, right] on one side of a sheet; -1 is a blank page. */
export function bookletPairs(total: number): Array<[number, number]> {
  const padded = Math.ceil(total / 4) * 4;
  const page = (index: number) => (index < total ? index : -1);
  const pairs: Array<[number, number]> = [];
  for (let sheet = 0; sheet < padded / 4; sheet += 1) {
    pairs.push([page(padded - 1 - 2 * sheet), page(2 * sheet)]);
    pairs.push([page(2 * sheet + 1), page(padded - 2 - 2 * sheet)]);
  }
  return pairs;
}

/** A1, B1, A2, B2… with the remainder of the longer file at the end. */
export function interleaveOrder(countA: number, countB: number, reverseB: boolean): Array<[file: 0 | 1, page: number]> {
  const order: Array<[0 | 1, number]> = [];
  for (let i = 0; i < Math.max(countA, countB); i += 1) {
    if (i < countA) order.push([0, i]);
    if (i < countB) order.push([1, reverseB ? countB - 1 - i : i]);
  }
  return order;
}
