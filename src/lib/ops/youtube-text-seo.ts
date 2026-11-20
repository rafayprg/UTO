// YouTube titles, descriptions, tags, hashtags, chapters and scheduling. Self-contained.
import type { TextOp } from "./types";

// Limits YouTube documents in its Help Center.
const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 5000;
const TAGS_LIMIT = 500;
const HASHTAG_LIMIT = 60;
const MIN_CHAPTERS = 3;
const MIN_CHAPTER_SECONDS = 10;

const STOP_WORDS = new Set("a an and are as at be but by for from has have how i in is it its of on or our so that the this to was we what when where which who why will with you your my me do does not no yes can just".split(" "));

function chars(text: string): number {
  return [...text].length;
}

/** Rough width in px from average glyph widths of a sans-serif UI font. Only an estimate. */
function approxWidth(text: string, fontPx: number): number {
  let em = 0;
  for (const ch of text) {
    if (/[iljI.,:;'|!]/.test(ch)) em += 0.27;
    else if (ch === " ") em += 0.25;
    else if (/[mwMW]/.test(ch)) em += 0.85;
    else if (/[A-Z]/.test(ch)) em += 0.66;
    else if (/[a-z0-9]/.test(ch)) em += 0.55;
    else if (/[\u0000-ɏ]/.test(ch)) em += 0.5;
    else em += 1;
  }
  return Math.round(em * fontPx);
}

function truncate(text: string, visible: number): string {
  const all = [...text];
  return all.length <= visible ? text : `${all.slice(0, visible).join("").trimEnd()}…`;
}

function splitList(input: string): string[] {
  return input.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
}

function cleanTag(tag: string, lower: boolean): string {
  const clean = tag.replace(/^#+/, "").replace(/[<>"]/g, "").replace(/\s+/g, " ").trim();
  return lower ? clean.toLowerCase() : clean;
}

function uniqueCaseless(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function tagLength(tags: string[]): number {
  return tags.reduce((sum, tag) => sum + chars(tag), 0) + Math.max(0, tags.length - 1);
}

function toHashtag(phrase: string): string {
  const words = phrase.normalize("NFKC").replace(/^#+/, "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.length ? `#${words.map(w => w[0].toUpperCase() + w.slice(1)).join("")}` : "";
}

function parseClockStrict(value: string): number | null {
  if (!/^\d{1,2}(?::\d{2}){1,2}$/.test(value)) return null;
  const parts = value.split(":").map(Number);
  if (parts.slice(1).some(part => part >= 60)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

interface Chapter { seconds: number; title: string; raw: string }

function parseChapters(input: string): { chapters: Chapter[]; skipped: string[] } {
  const chapters: Chapter[] = [];
  const skipped: string[] = [];
  for (const line of input.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    const match = /^[[(]?(\d{1,2}(?::\d{2}){1,2})[\])]?\s*[-–—:|]?\s*(.*)$/.exec(line) ?? /^(.*?)\s*[-–—|]?\s*[[(]?(\d{1,2}(?::\d{2}){1,2})[\])]?$/.exec(line);
    const [time, title] = match ? (/^\d/.test(match[1]) ? [match[1], match[2]] : [match[2], match[1]]) : ["", ""];
    const seconds = time ? parseClockStrict(time) : null;
    if (seconds === null) skipped.push(line);
    else chapters.push({ seconds, title: title.trim(), raw: line });
  }
  return { chapters, skipped };
}

function chapterProblems(chapters: Chapter[], lengthSeconds: number | null): string[] {
  const problems: string[] = [];
  if (chapters.length < MIN_CHAPTERS) problems.push(`YouTube needs at least ${MIN_CHAPTERS} chapters; found ${chapters.length}.`);
  if (chapters.length && chapters[0].seconds !== 0) problems.push(`The first chapter must start at 0:00; it starts at ${clock(chapters[0].seconds)}.`);
  chapters.forEach((chapter, i) => {
    const next = chapters[i + 1];
    const end = next ? next.seconds : lengthSeconds;
    if (!chapter.title) problems.push(`Chapter at ${clock(chapter.seconds)} has no title.`);
    if (next && next.seconds <= chapter.seconds) problems.push(`Chapter at ${clock(next.seconds)} is not after ${clock(chapter.seconds)} (timestamps must be in ascending order).`);
    else if (end !== null && end - chapter.seconds < MIN_CHAPTER_SECONDS) problems.push(`"${chapter.title || clock(chapter.seconds)}" is ${Math.max(0, end - chapter.seconds)} s long; each chapter must be at least ${MIN_CHAPTER_SECONDS} s.`);
  });
  if (lengthSeconds !== null && chapters.some(c => c.seconds >= lengthSeconds)) problems.push("A chapter starts after the end of the video.");
  return problems;
}

function zoneParts(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, Number(p.value)]));
}

function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = zoneParts(date, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(date.getTime() / 1000) * 1000;
}

function assertZone(timeZone: string): void {
  try { new Intl.DateTimeFormat("en-US", { timeZone }); }
  catch { throw new Error(`"${timeZone}" is not a known time zone. Use IANA names such as America/New_York or Europe/London.`); }
}

function wallTimeToUtc(date: string, time: string, timeZone: string): Date {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t || Number(t[1]) > 23 || Number(t[2]) > 59) throw new Error("Enter the date as YYYY-MM-DD and the time as HH:MM (24-hour).");
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  const first = guess - zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone));
}

function wordsOf(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).map(w => w.replace(/['’]s$/, ""));
}

export const seoOps: Record<string, TextOp> = {
  "yt-title-checker": {
    input: { label: "Video title", example: "I Built a Browser-Only Video Editor in 7 Days (No Uploads, No Servers)" },
    options: [
      { id: "visible", label: "Characters shown before truncation (approximate)", type: "number", default: 70, min: 20, max: 100, hint: "Varies by device and layout; adjust to what you see." },
      { id: "font", label: "Font size for width estimate (px)", type: "number", default: 18, min: 10, max: 40 },
    ],
    outputLabel: "Title check",
    note: "The 100-character limit is YouTube's. Truncation points and pixel widths depend on device and font, so those numbers are estimates.",
    run(input, options) {
      const title = input.replace(/\s+/g, " ").trim();
      if (!title) throw new Error("Enter a title.");
      const length = chars(title);
      const visible = Number(options.visible);
      const lines = [
        `Characters: ${length} / ${TITLE_LIMIT}${length > TITLE_LIMIT ? `  (over the limit by ${length - TITLE_LIMIT})` : ""}`,
        `Words: ${title.split(" ").length}`,
        `Approximate width at ${options.font}px: ~${approxWidth(title, Number(options.font))} px (estimate only)`,
        /[<>]/.test(title) ? "Warning: YouTube does not allow < or > in titles." : "",
        "",
        `Preview if cut at ~${visible} characters:`,
        truncate(title, visible),
      ];
      return lines.filter((line, i) => line !== "" || i === 4).join("\n");
    },
  },
  "yt-description-fold": {
    input: { label: "Video description", example: "Build a browser-only video editor step by step. Everything runs locally, so your clips never leave your computer.\n\nChapters\n0:00 Intro\n1:45 Project setup\n6:30 Trimming with FFmpeg\n\nLinks\nSource code: https://example.com/repo\n\n#webdev #javascript", rows: 10 },
    options: [{ id: "fold", label: "Characters before \"…more\" (approximate)", type: "number", default: 157, min: 50, max: 400, hint: "About 157 is a common estimate for desktop; it varies by device and line breaks." }],
    outputLabel: "Above-the-fold preview",
    note: "The 5,000-character limit is YouTube's. The fold point is an estimate; line breaks can show less text.",
    run(input, options) {
      const text = input.replace(/\r\n?/g, "\n").trim();
      if (!text) throw new Error("Paste a description.");
      const fold = Number(options.fold);
      const firstLines = text.split("\n").slice(0, 3).join("\n");
      const preview = truncate(firstLines, fold).replace(/…$/, "");
      const links = text.match(/https?:\/\/\S+/g) ?? [];
      const tags = text.match(/(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu) ?? [];
      return [
        "Preview:",
        `${preview}${chars(firstLines) > fold || text.length > firstLines.length ? " …more" : ""}`,
        "",
        `Characters: ${chars(text)} / ${DESCRIPTION_LIMIT}${chars(text) > DESCRIPTION_LIMIT ? " (over the limit)" : ""}`,
        `Links: ${links.length} · Hashtags: ${tags.length}`,
        links.length && !preview.includes("http") ? "Tip: no link appears above the fold." : "",
      ].filter((line, i) => line !== "" || i === 2).join("\n");
    },
  },
  "yt-tag-cleaner": {
    input: { label: "Tags (comma or line separated)", example: "#browser video editor, Browser Video Editor, ffmpeg wasm,  javascript tutorial , ffmpeg WASM, <web dev>", rows: 5 },
    options: [
      { id: "lower", label: "Lowercase all tags", type: "checkbox", default: false },
      { id: "output", label: "Output", type: "select", choices: [["comma", "Comma separated"], ["lines", "One per line"]], default: "comma" },
    ],
    outputLabel: "Clean tags",
    note: "Removes #, angle brackets, quotes, extra spaces and duplicates (case-insensitive).",
    run(input, options) {
      const tags = uniqueCaseless(splitList(input).map(tag => cleanTag(tag, Boolean(options.lower))));
      if (tags.length === 0) throw new Error("Enter at least one tag.");
      const length = tagLength(tags);
      return `${tags.join(options.output === "lines" ? "\n" : ", ")}\n\n(${tags.length} tags, ${length} of ${TAGS_LIMIT} characters${length > TAGS_LIMIT ? " — over the limit" : ""})`;
    },
  },
  "yt-tag-limit-checker": {
    input: { label: "Tags (comma or line separated)", example: "browser video editor, ffmpeg wasm, javascript tutorial, trim video online, privacy first tools", rows: 5 },
    outputLabel: "Tag length report",
    note: "YouTube allows 500 characters of tags. This counts tag text plus the commas between tags; YouTube's own counter may differ slightly for tags with spaces.",
    run(input) {
      const tags = splitList(input);
      if (tags.length === 0) throw new Error("Enter at least one tag.");
      const length = tagLength(tags);
      const rows = tags.map(tag => `${String(chars(tag)).padStart(4)}  ${tag}`);
      const status = length > TAGS_LIMIT ? `Over the limit by ${length - TAGS_LIMIT} characters.` : `${TAGS_LIMIT - length} characters left.`;
      return [`Total: ${length} / ${TAGS_LIMIT} characters in ${tags.length} tags. ${status}`, "", "Chars  Tag", ...rows].join("\n");
    },
  },
  "yt-hashtag-generator": {
    input: { label: "Keywords or phrases (comma or line separated)", example: "video editing, browser tools, ffmpeg wasm, javascript", rows: 5 },
    options: [{ id: "max", label: "Maximum hashtags", type: "number", default: 15, min: 1, max: HASHTAG_LIMIT }],
    outputLabel: "Hashtags",
    note: "Joins each phrase into one #CamelCase hashtag. YouTube ignores all hashtags on a video that has more than 60.",
    run(input, options) {
      const tags = uniqueCaseless(splitList(input).map(toHashtag)).slice(0, Number(options.max));
      if (tags.length === 0) throw new Error("Enter at least one keyword with letters or numbers.");
      return tags.join(" ");
    },
  },
  "yt-hashtag-checker": {
    input: { label: "Description or text with hashtags", example: "New tutorial is up! #webdev #JavaScript #ffmpeg #webdev #browser-tools", rows: 6 },
    outputLabel: "Hashtag report",
    run(input) {
      const found = input.match(/(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]+/gu) ?? [];
      if (found.length === 0) throw new Error("No hashtags found. Hashtags start with # followed by letters or numbers.");
      const unique = uniqueCaseless(found);
      const broken = input.match(/#[\p{L}\p{N}_]+[-.'][\p{L}\p{N}_.'-]+/gu) ?? [];
      return [
        `Hashtags: ${found.length} (${unique.length} unique)`,
        found.length > HASHTAG_LIMIT ? `Warning: more than ${HASHTAG_LIMIT} hashtags. YouTube ignores all hashtags on such a video.` : `Within YouTube's limit of ${HASHTAG_LIMIT}.`,
        found.length !== unique.length ? `Duplicates: ${found.length - unique.length}` : "No duplicates.",
        broken.length ? `Hashtags with punctuation inside (they may not link as you expect): ${broken.join(", ")}` : "",
        "",
        unique.join(" "),
      ].filter((line, i, all) => line !== "" || i === all.length - 2).join("\n");
    },
  },
  "yt-tag-combiner": {
    input: { label: "Main keywords (one per line or comma separated)", example: "video editor\nvideo trimmer", rows: 4 },
    second: { label: "Modifiers (one per line or comma separated)", example: "free, online, no watermark, for beginners" },
    options: [
      { id: "order", label: "Order", type: "select", choices: [["after", "Keyword + modifier"], ["before", "Modifier + keyword"], ["both", "Both orders"]], default: "after" },
      { id: "keepBase", label: "Include the main keywords on their own", type: "checkbox", default: true },
    ],
    outputLabel: "Combined tags",
    run(input, options, second) {
      const bases = splitList(input);
      const mods = splitList(second ?? "");
      if (bases.length === 0) throw new Error("Enter at least one main keyword.");
      const combos = bases.flatMap(base => [
        ...(options.keepBase ? [base] : []),
        ...mods.flatMap(mod => (options.order === "before" ? [`${mod} ${base}`] : options.order === "both" ? [`${base} ${mod}`, `${mod} ${base}`] : [`${base} ${mod}`])),
      ]);
      const tags = uniqueCaseless(combos.map(tag => cleanTag(tag, false)));
      return `${tags.join(", ")}\n\n(${tags.length} tags, ${tagLength(tags)} characters)`;
    },
  },
  "yt-tag-extractor": {
    input: { label: "Your title, description or script", example: "Trim video in the browser with FFmpeg WASM. This browser video editor trims video locally, so the video never leaves your computer. Learn FFmpeg WASM basics and build a video trimmer.", rows: 8 },
    options: [{ id: "count", label: "Number of suggestions", type: "number", default: 15, min: 1, max: 50 }],
    outputLabel: "Suggested tags (most frequent words and phrases)",
    note: "Suggestions come only from the words in your own text, ranked by how often they appear. Common words are skipped.",
    run(input, options) {
      const segments = input.split(/[.!?,;:()\n]+/).map(wordsOf).filter(seg => seg.length > 0);
      if (segments.length === 0) throw new Error("Paste some text with words.");
      const counts = new Map<string, number>();
      const add = (key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);
      for (const seg of segments) {
        seg.forEach((word, i) => {
          if (!STOP_WORDS.has(word) && word.length > 2) add(word);
          const next = seg[i + 1];
          if (next && !STOP_WORDS.has(word) && !STOP_WORDS.has(next)) add(`${word} ${next}`);
        });
      }
      // Phrases must repeat to count; single words are ranked by frequency.
      const score = (key: string, n: number) => (key.includes(" ") ? (n >= 2 ? n * 1.5 : 0) : n);
      const ranked = [...counts.entries()].map(([key, n]) => [key, score(key, n)] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, Number(options.count));
      if (ranked.length === 0) throw new Error("Only common words were found; add more specific words.");
      return ranked.map(([tag]) => tag).join(", ");
    },
  },
  "yt-chapter-validator": {
    input: { label: "Chapter list (one per line)", example: "0:00 Intro\n0:45 Project setup\n3:10 Trimming with FFmpeg\n3:15 Export settings\n8:40 Wrap-up", rows: 8 },
    options: [{ id: "length", label: "Video length (optional, m:ss or h:mm:ss)", type: "text", default: "10:00" }],
    outputLabel: "Formatted chapters and check",
    note: "Checks YouTube's chapter rules: the first chapter starts at 0:00, at least 3 chapters in ascending order, each at least 10 seconds long.",
    run(input, options) {
      const { chapters, skipped } = parseChapters(input);
      if (chapters.length === 0) throw new Error("No timestamps found. Write each chapter like \"0:00 Intro\".");
      const lengthText = String(options.length).trim();
      const length = lengthText ? parseClockStrict(lengthText.includes(":") ? lengthText : `0:${lengthText}`) : null;
      if (lengthText && length === null) throw new Error("Write the video length as m:ss or h:mm:ss.");
      const problems = chapterProblems(chapters, length);
      const useHours = chapters.some(c => c.seconds >= 3600);
      const fmt = (s: number) => (useHours && s < 3600 ? `0:${clock(s).padStart(5, "0")}` : clock(s));
      return [
        ...chapters.map(c => `${fmt(c.seconds)} ${c.title}`.trimEnd()),
        "",
        problems.length ? `${problems.length} problem${problems.length === 1 ? "" : "s"}:` : "All chapter rules pass.",
        ...problems.map(p => `- ${p}`),
        ...(skipped.length ? ["", `Skipped lines without a timestamp: ${skipped.length}`] : []),
      ].join("\n");
    },
  },
  "yt-title-compare": {
    input: { label: "Title ideas (one per line)", example: "I Built a Video Editor That Runs in Your Browser\nHow to Trim Videos Without Uploading Them\nFFmpeg WASM Tutorial: Build a Browser Video Trimmer in 20 Minutes", rows: 6 },
    options: [{ id: "visible", label: "Characters shown before truncation (approximate)", type: "number", default: 70, min: 20, max: 100 }],
    outputLabel: "Comparison",
    run(input, options) {
      const titles = input.split(/\r?\n/).map(t => t.replace(/\s+/g, " ").trim()).filter(Boolean);
      if (titles.length === 0) throw new Error("Enter at least one title.");
      const visible = Number(options.visible);
      return titles.map((title, i) => {
        const length = chars(title);
        const flags = [length > TITLE_LIMIT ? "over 100" : "", length > visible ? "may be cut" : "fits", /\d/.test(title) ? "has number" : ""].filter(Boolean).join(", ");
        return `${i + 1}. ${length} chars, ${title.split(" ").length} words (${flags})\n   ${truncate(title, visible)}`;
      }).join("\n\n");
    },
  },
  "yt-premiere-time-zones": {
    input: { label: "Viewer time zones (IANA names, one per line)", example: "America/New_York\nEurope/London\nAsia/Kolkata\nAsia/Karachi\nAustralia/Sydney", rows: 6 },
    options: [
      { id: "date", label: "Date (YYYY-MM-DD)", type: "text", default: "2026-12-05" },
      { id: "time", label: "Time (HH:MM, 24-hour)", type: "text", default: "18:00" },
      { id: "zone", label: "Your time zone (IANA)", type: "text", default: "America/Los_Angeles" },
    ],
    outputLabel: "Local times",
    note: "Uses your browser's time zone database, including daylight saving time.",
    run(input, options) {
      const zone = String(options.zone).trim();
      assertZone(zone);
      const instant = wallTimeToUtc(String(options.date), String(options.time), zone);
      const zones = input.split(/\r?\n/).map(z => z.trim()).filter(Boolean);
      if (zones.length === 0) throw new Error("Enter at least one time zone, e.g. Europe/London.");
      const fmt = (tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(instant);
      zones.forEach(assertZone);
      return [`UTC: ${instant.toISOString().replace(".000Z", "Z")}`, ...zones.map(tz => `${tz}: ${fmt(tz)}`)].join("\n");
    },
  },
  "yt-playlist-length": {
    input: { label: "Video durations (one per line; text around the time is ignored)", example: "1. Intro — 4:32\n2. Setup — 12:05\n3. Trimming — 18:47\n4. Export — 1:02:10", rows: 6 },
    outputLabel: "Total watch time",
    run(input) {
      const times = input.split(/\r?\n/).map(line => (line.match(/\d{1,2}(?::\d{2}){1,2}/g) ?? []).pop()).filter((t): t is string => Boolean(t)).map(parseClockStrict);
      if (times.some(t => t === null)) throw new Error("A duration has minutes or seconds of 60 or more.");
      const seconds = times.filter((t): t is number => t !== null);
      if (seconds.length === 0) throw new Error("No durations such as 4:32 or 1:02:10 were found.");
      const total = seconds.reduce((a, b) => a + b, 0);
      const speeds = [1.25, 1.5, 1.75, 2].map(s => `At ${s}×: ${clock(total / s)}`);
      return [`Videos: ${seconds.length}`, `Total: ${clock(total)}`, `Average: ${clock(total / seconds.length)}`, ...speeds].join("\n");
    },
  },
};
