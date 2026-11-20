// Counters, readability formulas and writing analysis. Self-contained.
import type { OptionValues, TextOp } from "./types";

const PROSE = "The new tool was released last week. It was designed by a small team that really cared about privacy. Every file is processed locally, so nothing is uploaded to a server. Users can trim, convert and compress videos quickly. The interface was praised by early testers, although some features are still being improved.";

const STOP_WORDS = new Set("a an and are as at be been but by for from had has have he her his i if in into is it its me my not of on or our she so than that the their them then there these they this to too us was we were what when which who will with you your".split(" "));

const ABBREVIATIONS = /\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|Inc|Ltd|Co|No|Fig|U\.S)\.$/i;

export function wordList(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
}

/** Sentences split on . ! ? followed by space or end, skipping common abbreviations. */
export function sentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?…]["'”’)\]]?)\s+(?=["'“‘(\[]?[\p{Lu}\p{N}])/u);
  const merged: string[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && ABBREVIATIONS.test(prev)) merged[merged.length - 1] = `${prev} ${part}`;
    else merged.push(part);
  }
  return merged.filter(s => wordList(s).length > 0);
}

/** English syllable estimate: vowel groups, minus silent final e and silent -ed / -es endings. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let count = w.replace(/^y/, "").match(/[aeiouy]+/g)?.length ?? 0;
  if (/[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) count -= 1;
  else if (/[^aeiouytd]ed$/.test(w)) count -= 1;
  else if (/[^aeiouy]es$/.test(w) && !/(?:[sxz]|ch|sh|[cg])es$/.test(w)) count -= 1;
  return Math.max(1, count);
}

interface Stats { words: string[]; sentences: string[]; syllables: number; letters: number; poly: number }

function stats(text: string): Stats {
  const words = wordList(text);
  const sents = sentences(text);
  if (words.length === 0 || sents.length === 0) throw new Error("Paste at least one full sentence of English text.");
  const counts = words.map(syllables);
  return {
    words,
    sentences: sents,
    syllables: counts.reduce((a, b) => a + b, 0),
    letters: words.join("").replace(/[^\p{L}\p{N}]/gu, "").length,
    poly: counts.filter(n => n >= 3).length,
  };
}

const r1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

function gradeLabel(grade: number): string {
  if (grade < 1) return "Kindergarten level";
  if (grade >= 16) return "College graduate level";
  if (grade >= 13) return "College level";
  return `About US grade ${Math.round(grade)}`;
}

function easeLabel(score: number): string {
  if (score >= 90) return "Very easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly easy";
  if (score >= 60) return "Plain English";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

function basics(s: Stats): string {
  return `Words: ${s.words.length} · Sentences: ${s.sentences.length} · Syllables: ${s.syllables}`;
}

const readabilityInput = { label: "English text (a few paragraphs gives a steadier score)", example: PROSE, rows: 10 };

function readabilityOp(note: string, compute: (s: Stats) => string[]): TextOp {
  return { input: readabilityInput, outputLabel: "Readability", note, run: input => { const s = stats(input); return [...compute(s), "", basics(s)].join("\n"); } };
}

function topN(counts: Map<string, number>, n: number): Array<[string, number]> {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

function ngrams(words: string[], size: number, skipStop: boolean): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i + size <= words.length; i += 1) {
    const gram = words.slice(i, i + size);
    if (skipStop && (STOP_WORDS.has(gram[0]) || STOP_WORDS.has(gram[size - 1]))) continue;
    const key = gram.join(" ");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function table(rows: Array<[string, number]>, total: number, density: boolean): string {
  const width = Math.max(4, ...rows.map(([k]) => [...k].length));
  return rows.map(([key, n]) => `${key.padEnd(width)}  ${String(n).padStart(5)}${density ? `  ${((n / total) * 100).toFixed(2)}%` : ""}`).join("\n");
}

const IRREGULAR = "awoken been begun bent bitten blown born borne bought bound broken brought built burnt caught chosen come cut dealt done drawn driven drunk eaten fallen fed felt fought found flown forbidden forgotten forgiven frozen given gone grown hung heard held hidden hit hurt kept known laid led left lent let lost made meant met paid put quit read ridden rung risen run said seen sent set shaken shown shut sold sought spent spoken spun stolen struck stuck sung sunk sworn swept taken taught thrown thought told torn understood won worn woven written".split(" ");
const PASSIVE = new RegExp(String.raw`\b(am|is|are|was|were|be|been|being|get|gets|got|gotten)\s+(?:\w+ly\s+)?(\w+ed|${IRREGULAR.join("|")})\b`, "gi");
const NOT_ADVERBS = new Set("only family early daily weekly monthly yearly likely reply apply supply holy ugly jelly belly bully rally fly july italy friendly lovely lonely silly costly elderly curly orderly unlikely ally assembly anomaly melancholy".split(" "));
const FILLERS = ["very", "really", "just", "actually", "basically", "literally", "quite", "rather", "simply", "totally", "definitely", "honestly", "seriously", "extremely", "somewhat", "kind of", "sort of", "a bit", "a lot", "in order to", "pretty much", "needless to say"];

function flagged(text: string, find: (sentence: string) => string[], label: string): string {
  const hits = sentences(text).map(s => ({ s, found: find(s) })).filter(x => x.found.length > 0);
  const total = sentences(text).length;
  if (total === 0) throw new Error("Paste at least one sentence.");
  if (hits.length === 0) return `No ${label} found in ${total} sentences.`;
  return [`${hits.length} of ${total} sentences flagged:`, "", ...hits.map((x, i) => `${i + 1}. ${x.s}\n   → ${x.found.join(", ")}`)].join("\n");
}

const INVISIBLE: Record<number, string> = {
  0x00ad: "SOFT HYPHEN", 0x034f: "COMBINING GRAPHEME JOINER", 0x061c: "ARABIC LETTER MARK", 0x115f: "HANGUL CHOSEONG FILLER", 0x1160: "HANGUL JUNGSEONG FILLER",
  0x17b4: "KHMER VOWEL INHERENT AQ", 0x17b5: "KHMER VOWEL INHERENT AA", 0x180e: "MONGOLIAN VOWEL SEPARATOR",
  0x200b: "ZERO WIDTH SPACE", 0x200c: "ZERO WIDTH NON-JOINER", 0x200d: "ZERO WIDTH JOINER", 0x200e: "LEFT-TO-RIGHT MARK", 0x200f: "RIGHT-TO-LEFT MARK",
  0x202a: "LEFT-TO-RIGHT EMBEDDING", 0x202b: "RIGHT-TO-LEFT EMBEDDING", 0x202c: "POP DIRECTIONAL FORMATTING", 0x202d: "LEFT-TO-RIGHT OVERRIDE", 0x202e: "RIGHT-TO-LEFT OVERRIDE",
  0x2060: "WORD JOINER", 0x2061: "FUNCTION APPLICATION", 0x2062: "INVISIBLE TIMES", 0x2063: "INVISIBLE SEPARATOR", 0x2064: "INVISIBLE PLUS",
  0x2066: "LEFT-TO-RIGHT ISOLATE", 0x2067: "RIGHT-TO-LEFT ISOLATE", 0x2068: "FIRST STRONG ISOLATE", 0x2069: "POP DIRECTIONAL ISOLATE",
  0x3164: "HANGUL FILLER", 0xfeff: "ZERO WIDTH NO-BREAK SPACE (BOM)", 0xffa0: "HALFWIDTH HANGUL FILLER",
};
const ODD_SPACES: Record<number, string> = {
  0x00a0: "NO-BREAK SPACE", 0x2000: "EN QUAD", 0x2001: "EM QUAD", 0x2002: "EN SPACE", 0x2003: "EM SPACE", 0x2004: "THREE-PER-EM SPACE", 0x2005: "FOUR-PER-EM SPACE",
  0x2006: "SIX-PER-EM SPACE", 0x2007: "FIGURE SPACE", 0x2008: "PUNCTUATION SPACE", 0x2009: "THIN SPACE", 0x200a: "HAIR SPACE", 0x202f: "NARROW NO-BREAK SPACE", 0x205f: "MEDIUM MATHEMATICAL SPACE", 0x3000: "IDEOGRAPHIC SPACE",
};

function invisibleName(cp: number): string | null {
  if (INVISIBLE[cp]) return INVISIBLE[cp];
  if (ODD_SPACES[cp]) return ODD_SPACES[cp];
  if (cp >= 0xfe00 && cp <= 0xfe0f) return `VARIATION SELECTOR-${cp - 0xfe00 + 1}`;
  if (cp >= 0xe0000 && cp <= 0xe007f) return "TAG CHARACTER";
  if ((cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) || (cp >= 0x7f && cp < 0xa0)) return "CONTROL CHARACTER";
  return null;
}

const hex = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;

function graphemeCount(text: string): number {
  if (typeof Intl.Segmenter === "function") return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].length;
  return [...text].length;
}

function wordsFor(text: string, o: OptionValues): string[] {
  const all = wordList(o.caseSensitive ? text : text.toLowerCase());
  const min = Number(o.min ?? 1);
  return all.filter(w => w.length >= min && !(o.stop && STOP_WORDS.has(w.toLowerCase())));
}

export const countOps: Record<string, TextOp> = {
  "character-counter": {
    input: { label: "Text", example: "Hello, world! 👋🏽 Café au lait costs $4.\nSecond line.", rows: 8 },
    outputLabel: "Character counts",
    note: "Characters counts what you see (an emoji with a skin tone is one). Code points and UTF-16 units are what many systems store and limit.",
    run(input) {
      const cps = [...input];
      const rows: Array<[string, number]> = [
        ["Characters", graphemeCount(input)],
        ["Characters without spaces", graphemeCount(input.replace(/\s/g, ""))],
        ["Letters", cps.filter(c => /\p{L}/u.test(c)).length],
        ["Digits", cps.filter(c => /\p{N}/u.test(c)).length],
        ["Spaces and tabs", cps.filter(c => /[^\S\r\n]/u.test(c)).length],
        ["Punctuation and symbols", cps.filter(c => /[\p{P}\p{S}]/u.test(c)).length],
        ["Lines", input ? input.split(/\r?\n/).length : 0],
        ["Unicode code points", cps.length],
        ["UTF-16 code units (JavaScript length)", input.length],
        ["UTF-8 bytes", new TextEncoder().encode(input).length],
      ];
      return rows.map(([label, n]) => `${label}: ${n.toLocaleString("en-US")}`).join("\n");
    },
  },
  "sentence-counter": {
    input: { label: "Text", example: PROSE, rows: 8 },
    options: [{ id: "list", label: "List the sentences", type: "checkbox", default: false }],
    outputLabel: "Sentence count",
    note: "Sentences end with . ! ? or …; common abbreviations such as Dr. and e.g. are not treated as sentence ends.",
    run(input, o) {
      const s = sentences(input);
      if (s.length === 0) throw new Error("No sentences found.");
      const lengths = s.map(x => wordList(x).length);
      const summary = [`Sentences: ${s.length}`, `Average words per sentence: ${r1(lengths.reduce((a, b) => a + b, 0) / s.length)}`, `Longest sentence: ${Math.max(...lengths)} words`];
      return o.list ? [...summary, "", ...s.map((x, i) => `${i + 1}. ${x}`)].join("\n") : summary.join("\n");
    },
  },
  "syllable-counter": {
    input: { label: "English words or text", example: "beautiful readability syllable table cake created", rows: 5 },
    options: [{ id: "each", label: "Show each word", type: "checkbox", default: true }],
    outputLabel: "Syllables",
    note: "An English rule-based estimate (vowel groups, silent e, -ed and -es endings). It is right for most words but not all; it does not use a dictionary.",
    run(input, o) {
      const words = wordList(input);
      if (words.length === 0) throw new Error("Enter at least one word.");
      const counts = words.map(w => [w, syllables(w)] as const);
      const total = counts.reduce((a, [, n]) => a + n, 0);
      const head = `Total syllables: ${total} in ${words.length} words (average ${r1(total / words.length)})`;
      return o.each ? [head, "", ...counts.map(([w, n]) => `${w}: ${n}`)].join("\n") : head;
    },
  },
  "word-frequency": {
    input: { label: "Text", example: PROSE, rows: 10 },
    options: [
      { id: "stop", label: "Skip common words (the, and, of…)", type: "checkbox", default: true },
      { id: "min", label: "Minimum word length", type: "number", default: 2, min: 1, max: 20 },
      { id: "top", label: "Show top", type: "number", default: 30, min: 1, max: 1000 },
      { id: "caseSensitive", label: "Case-sensitive", type: "checkbox", default: false },
    ],
    outputLabel: "Word  Count  Share",
    run(input, o) {
      const words = wordsFor(input, o);
      if (words.length === 0) throw new Error("No words left to count with these settings.");
      const counts = new Map<string, number>();
      words.forEach(w => counts.set(w, (counts.get(w) ?? 0) + 1));
      return `${counts.size} different words, ${words.length} counted\n\n${table(topN(counts, Number(o.top)), words.length, true)}`;
    },
  },
  "invisible-character-detector": {
    input: { label: "Text to inspect", example: "Copy​pasted text with hidden‍ characters﻿ and a soft­hyphen.", rows: 6 },
    outputLabel: "Hidden characters found",
    note: "Finds zero-width characters, direction marks, byte-order marks, unusual spaces, variation selectors and control characters. Emoji use zero-width joiners and variation selectors on purpose.",
    run(input) {
      const found: string[] = [];
      let line = 1;
      let col = 0;
      for (const ch of input) {
        const cp = ch.codePointAt(0) ?? 0;
        if (ch === "\n") { line += 1; col = 0; continue; }
        col += 1;
        const name = invisibleName(cp);
        if (name) found.push(`Line ${line}, column ${col}: ${hex(cp)} ${name}`);
      }
      if (found.length === 0) return "No invisible or unusual characters found.";
      return [`${found.length} hidden or unusual character${found.length === 1 ? "" : "s"}:`, ...found].join("\n");
    },
  },
  "zero-width-remover": {
    input: { label: "Text to clean", example: "Copy​pasted text with hidden‍ characters﻿ and a soft­hyphen.", rows: 6 },
    options: [
      { id: "spaces", label: "Turn unusual spaces (no-break, thin, em…) into normal spaces", type: "checkbox", default: true },
      { id: "emoji", label: "Keep characters emoji need (joiners and variation selectors inside emoji)", type: "checkbox", default: true },
    ],
    outputLabel: "Clean text",
    run(input, o) {
      const chars = [...input];
      return chars.map((ch, i) => {
        const cp = ch.codePointAt(0) ?? 0;
        if (ODD_SPACES[cp]) return o.spaces ? " " : ch;
        const name = invisibleName(cp);
        if (!name) return ch;
        const nearEmoji = /\p{Extended_Pictographic}/u.test(chars[i - 1] ?? "") || /\p{Extended_Pictographic}/u.test(chars[i + 1] ?? "");
        if (o.emoji && nearEmoji && (cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0000 && cp <= 0xe007f))) return ch;
        return "";
      }).join("");
    },
  },
};

export const readabilityOps: Record<string, TextOp> = {
  "flesch-kincaid": readabilityOp("Flesch-Kincaid grade = 0.39 × (words ÷ sentences) + 11.8 × (syllables ÷ words) − 15.59. Reading ease = 206.835 − 1.015 × (words ÷ sentences) − 84.6 × (syllables ÷ words). Syllables are estimated.", s => {
    const wps = s.words.length / s.sentences.length;
    const spw = s.syllables / s.words.length;
    const grade = 0.39 * wps + 11.8 * spw - 15.59;
    const ease = 206.835 - 1.015 * wps - 84.6 * spw;
    return [`Flesch-Kincaid grade level: ${r1(grade)} (${gradeLabel(grade)})`, `Flesch reading ease: ${r1(ease)} (${easeLabel(ease)})`, `Words per sentence: ${r1(wps)} · Syllables per word: ${spw.toFixed(2)}`];
  }),
  "gunning-fog": readabilityOp("Gunning fog = 0.4 × (words ÷ sentences + 100 × complex words ÷ words). Complex words are counted as words of three or more estimated syllables.", s => {
    const fog = 0.4 * (s.words.length / s.sentences.length + (100 * s.poly) / s.words.length);
    return [`Gunning fog index: ${r1(fog)} (${gradeLabel(fog)})`, `Complex words: ${s.poly} (${((s.poly / s.words.length) * 100).toFixed(1)}%)`];
  }),
  "smog-index": readabilityOp("SMOG grade = 1.0430 × √(polysyllables × 30 ÷ sentences) + 3.1291. The formula was designed for samples of 30 sentences or more.", s => {
    const smog = 1.043 * Math.sqrt((s.poly * 30) / s.sentences.length) + 3.1291;
    return [`SMOG grade: ${r1(smog)} (${gradeLabel(smog)})`, `Words with 3+ syllables: ${s.poly}`, ...(s.sentences.length < 30 ? [`Note: only ${s.sentences.length} sentences; the score is less reliable under 30.`] : [])];
  }),
  "coleman-liau": readabilityOp("Coleman-Liau = 0.0588 × L − 0.296 × S − 15.8, where L is letters per 100 words and S is sentences per 100 words. It uses letters, not syllables.", s => {
    const L = (s.letters / s.words.length) * 100;
    const S = (s.sentences.length / s.words.length) * 100;
    const cli = 0.0588 * L - 0.296 * S - 15.8;
    return [`Coleman-Liau index: ${r1(cli)} (${gradeLabel(cli)})`, `Letters per 100 words: ${r1(L)} · Sentences per 100 words: ${r1(S)}`];
  }),
  "automated-readability-index": readabilityOp("ARI = 4.71 × (characters ÷ words) + 0.5 × (words ÷ sentences) − 21.43, counting letters and digits as characters.", s => {
    const ari = 4.71 * (s.letters / s.words.length) + 0.5 * (s.words.length / s.sentences.length) - 21.43;
    return [`Automated Readability Index: ${r1(ari)} (${gradeLabel(ari)})`];
  }),
  "keyword-density": {
    input: { label: "Page text", example: PROSE, rows: 10 },
    options: [
      { id: "keyword", label: "Focus keyword or phrase (optional)", type: "text", default: "locally" },
      { id: "top", label: "Show top phrases", type: "number", default: 10, min: 1, max: 100 },
    ],
    outputLabel: "Keyword density",
    note: "Density = times the word or phrase appears ÷ total words × 100. Common words are skipped in the top lists.",
    run(input, o) {
      const words = wordList(input.toLowerCase());
      if (words.length === 0) throw new Error("Paste some text.");
      const top = Number(o.top);
      const keyword = wordList(String(o.keyword).toLowerCase());
      const out = [`Total words: ${words.length}`];
      if (keyword.length) {
        const n = ngrams(words, keyword.length, false).get(keyword.join(" ")) ?? 0;
        out.push(`"${keyword.join(" ")}": ${n} time${n === 1 ? "" : "s"}, ${((n / words.length) * 100).toFixed(2)}%`);
      }
      for (const size of [1, 2, 3]) {
        const rows = topN(ngrams(size === 1 ? words.filter(w => !STOP_WORDS.has(w)) : words, size, true), top).filter(([, n]) => size === 1 || n > 1);
        if (rows.length) out.push("", `Top ${size === 1 ? "words" : `${size}-word phrases`}:`, table(rows, words.length, true));
      }
      return out.join("\n");
    },
  },
  "phrase-frequency": {
    input: { label: "Text", example: `${PROSE} Every file is processed locally. Users can trim videos quickly.`, rows: 10 },
    options: [
      { id: "size", label: "Words per phrase", type: "select", choices: [["2", "2 words"], ["3", "3 words"], ["4", "4 words"]], default: "2" },
      { id: "min", label: "Show phrases used at least", type: "number", default: 2, min: 1, max: 100 },
    ],
    outputLabel: "Phrase  Count",
    run(input, o) {
      const words = wordList(input.toLowerCase());
      const rows = topN(ngrams(words, Number(o.size), true), 200).filter(([, n]) => n >= Number(o.min));
      if (rows.length === 0) return `No ${o.size}-word phrase appears ${o.min} or more times.`;
      return table(rows, words.length, false);
    },
  },
  "passive-voice-checker": {
    input: { label: "Text", example: PROSE, rows: 10 },
    outputLabel: "Sentences that may be passive",
    note: "Heuristic: a form of \"be\" or \"get\" followed by a word ending in -ed or a common irregular past participle (taken, written…). Expect some false positives such as \"is tired\".",
    run: input => flagged(input, s => [...s.matchAll(PASSIVE)].map(m => m[0]), "passive constructions"),
  },
  "adverb-finder": {
    input: { label: "Text", example: PROSE, rows: 10 },
    outputLabel: "Sentences with -ly adverbs",
    note: "Heuristic: words ending in -ly, except a list of common non-adverbs (only, family, early, friendly…).",
    run: input => flagged(input, s => wordList(s).filter(w => /ly$/i.test(w) && w.length > 3 && !NOT_ADVERBS.has(w.toLowerCase())), "-ly adverbs"),
  },
  "long-sentence-finder": {
    input: { label: "Text", example: PROSE, rows: 10 },
    options: [{ id: "max", label: "Flag sentences longer than (words)", type: "number", default: 15, min: 5, max: 100 }],
    outputLabel: "Long sentences",
    run: (input, o) => flagged(input, s => { const n = wordList(s).length; return n > Number(o.max) ? [`${n} words`] : []; }, "long sentences"),
  },
  "filler-word-finder": {
    input: { label: "Text", example: "I just really think this is actually a very good idea. Basically, we need to move in order to grow.", rows: 8 },
    outputLabel: "Filler words by sentence",
    note: `Looks for: ${FILLERS.join(", ")}.`,
    run: input => flagged(input, s => FILLERS.filter(f => new RegExp(`\\b${f}\\b`, "i").test(s)), "filler words"),
  },
  "reading-time": {
    input: { label: "Article or text", example: PROSE, rows: 10 },
    options: [
      { id: "read", label: "Reading speed (words per minute)", type: "number", default: 200, min: 50, max: 1000, hint: "Set the pace that suits your readers." },
      { id: "speak", label: "Speaking speed (words per minute)", type: "number", default: 150, min: 50, max: 400 },
    ],
    outputLabel: "Reading time",
    run(input, o) {
      const words = wordList(input).length;
      if (words === 0) throw new Error("Paste some text.");
      if (!(Number(o.read) > 0) || !(Number(o.speak) > 0)) throw new Error("Speeds must be greater than zero.");
      const fmt = (min: number) => { const s = Math.round(min * 60); return s < 60 ? `${s} seconds` : `${Math.floor(s / 60)} min ${s % 60} s`; };
      return [`Words: ${words}`, `Reading time at ${o.read} wpm: ${fmt(words / Number(o.read))}`, `Speaking time at ${o.speak} wpm: ${fmt(words / Number(o.speak))}`].join("\n");
    },
  },
};
