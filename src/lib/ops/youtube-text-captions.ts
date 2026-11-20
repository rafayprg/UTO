// Transcript and caption tools for creators. Self-contained apart from the shared subtitle helper.
import type { TextOp } from "./types";
import { cuesToPlainText, detectFormat, formatClock, parseAny, parseClock, parseSbv, parseTimedCues, stripTags, toSbv, toSrt, toVtt, type Cue } from "./media-text-subtitles.ts";

const SRT = `1
00:00:00,500 --> 00:00:03,200
[Music]

2
00:00:03,400 --> 00:00:06,900
HOST: Hey everyone, welcome back
to the channel.

3
00:00:07,100 --> 00:00:11,000
Today I'm going to show you how to
trim a video right in your browser.

4
00:00:11,300 --> 00:00:14,800
No uploads, no accounts. (laughs) Let's go.
`;

const VTT = `WEBVTT

00:00.500 --> 00:03.200
Hey everyone, welcome back to the channel.

00:03.400 --> 00:06.900 align:start
Today I'm going to show you how to <b>trim a video</b>.

00:07.100 --> 00:11.000
No uploads, no accounts.
`;

const SBV = `0:00:00.500,0:00:03.200
Hey everyone, welcome back to the channel.

0:00:03.400,0:00:06.900
Today I'm going to show you how to trim a video.
`;

const SRT_B = `1
00:00:00,000 --> 00:00:02,500
Part two starts here.

2
00:00:02,800 --> 00:00:05,000
Thanks for watching!
`;

const TRANSCRIPT = `0:00
hey everyone welcome back to the channel
0:03
today I'm going to show you how to trim a video right in your browser
0:11
no uploads no accounts let's go
0:15
first open the tool and drop your clip in`;

const SCRIPT = "Most people upload their videos to a website just to trim five seconds off the end. You don't have to. In the next three minutes I'll show you a tool that does it right in your browser, so your file never leaves your computer.";

function sameFormat(input: string, cues: Cue[]): string {
  const format = detectFormat(input);
  return format === "vtt" ? toVtt(cues) : format === "sbv" ? toSbv(cues) : toSrt(cues);
}

function wrapWords(text: string, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && [...`${line} ${word}`].length > width) {
      out.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...out, line] : out;
}

function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
}

function duration(seconds: number): string {
  const s = Math.round(seconds);
  return s < 60 ? `${s} seconds` : `${formatClock(s)} (${(s / 60).toFixed(1)} minutes)`;
}

function wpmOption(def: number): NonNullable<TextOp["options"]>[number] {
  return { id: "wpm", label: "Speaking pace (words per minute)", type: "number", default: def, min: 60, max: 300, hint: "Time yourself reading a paragraph to find your own pace." };
}

function wpm(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 60 || n > 300) throw new Error("Speaking pace must be between 60 and 300 words per minute.");
  return n;
}

function cleanCaption(text: string, options: Record<string, string | number | boolean>): string {
  let out = stripTags(text);
  if (options.brackets) out = out.replace(/\[[^\]]*\]|\([^)]*\)/g, "");
  if (options.music) out = out.replace(/[♪♫]+/g, "");
  if (options.speakers) out = out.replace(/^\s*(?:-\s*)?[A-Z][A-Z0-9 .'-]{0,30}:\s*/gm, "").replace(/^\s*>>\s*/gm, "");
  return out.split("\n").map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

function parseTranscript(input: string): Array<{ start: number; text: string }> {
  const entries: Array<{ start: number; text: string }> = [];
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = /^[[(]?(\d{1,2}(?::\d{2}){1,2})[\])]?\s*[-–:]?\s*(.*)$/.exec(line);
    const seconds = match ? parseClock(match[1]) : null;
    if (match && seconds !== null) entries.push({ start: seconds, text: match[2] });
    else if (entries.length) entries[entries.length - 1] = { ...entries[entries.length - 1], text: `${entries[entries.length - 1].text} ${line}`.trim() };
  }
  return entries.filter(entry => entry.text);
}

export const captionOps: Record<string, TextOp> = {
  "srt-to-text": {
    input: { label: "SRT subtitles", example: SRT, rows: 12, accept: ".srt" },
    options: [{ id: "join", label: "Join into one paragraph", type: "checkbox", default: false }],
    outputLabel: "Plain text",
    note: "Removes numbers, timings and formatting tags.",
    run(input, options) {
      return cuesToPlainText(parseAny(input), Boolean(options.join));
    },
  },
  "vtt-to-text": {
    input: { label: "WebVTT captions", example: VTT, rows: 12, accept: ".vtt,text/vtt" },
    options: [{ id: "join", label: "Join into one paragraph", type: "checkbox", default: false }],
    outputLabel: "Plain text",
    run(input, options) {
      return cuesToPlainText(parseAny(input), Boolean(options.join));
    },
  },
  "vtt-to-srt": {
    input: { label: "WebVTT captions", example: VTT, rows: 12, accept: ".vtt,text/vtt" },
    outputLabel: "SRT subtitles",
    outputExt: "srt",
    note: "Cue settings (position, alignment), NOTE and STYLE blocks have no SRT equivalent and are dropped. Simple tags like <b> and <i> are kept.",
    run(input) {
      return toSrt(parseAny(input).map(cue => ({ start: cue.start, end: cue.end, text: cue.text.replace(/<(?!\/?[biu]>)[^>]+>/g, "") })));
    },
  },
  "srt-to-vtt": {
    input: { label: "SRT subtitles", example: SRT, rows: 12, accept: ".srt" },
    outputLabel: "WebVTT captions",
    outputExt: "vtt",
    run(input) {
      return toVtt(parseAny(input));
    },
  },
  "sbv-to-srt": {
    input: { label: "YouTube SBV captions", example: SBV, rows: 10, accept: ".sbv" },
    outputLabel: "SRT subtitles",
    outputExt: "srt",
    run(input) {
      const cues = parseSbv(input);
      if (cues.length === 0) throw new Error("No SBV cues found. Each cue starts with a line like 0:00:01.000,0:00:04.000.");
      return toSrt(cues);
    },
  },
  "srt-to-sbv": {
    input: { label: "SRT or WebVTT subtitles", example: SRT, rows: 12, accept: ".srt,.vtt" },
    outputLabel: "YouTube SBV captions",
    outputExt: "sbv",
    run(input) {
      const cues = parseTimedCues(input);
      if (cues.length === 0) throw new Error("No SRT or WebVTT cues found.");
      return toSbv(cues.map(cue => ({ ...cue, text: stripTags(cue.text) })));
    },
  },
  "subtitle-to-csv": {
    input: { label: "SRT, WebVTT or SBV subtitles", example: SRT, rows: 12, accept: ".srt,.vtt,.sbv" },
    outputLabel: "CSV (start, end, duration, text)",
    outputExt: "csv",
    run(input) {
      const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const rows = parseAny(input).map((cue, i) => [String(i + 1), (cue.start / 1000).toFixed(3), (cue.end / 1000).toFixed(3), ((cue.end - cue.start) / 1000).toFixed(3), quote(stripTags(cue.text).replace(/\n/g, " "))].join(","));
      return ["index,start_seconds,end_seconds,duration_seconds,text", ...rows].join("\n");
    },
  },
  "subtitle-merge": {
    input: { label: "First subtitle file (SRT or WebVTT)", example: SRT, rows: 10, accept: ".srt,.vtt" },
    second: { label: "Second subtitle file", example: SRT_B },
    options: [
      { id: "mode", label: "How to merge", type: "select", choices: [["append", "Play the second after the first"], ["interleave", "Keep both timings and sort by time"]], default: "append" },
      { id: "gap", label: "Gap before the second file (ms, append mode)", type: "number", default: 500, min: 0 },
    ],
    outputLabel: "Merged SRT",
    outputExt: "srt",
    run(input, options, second) {
      const a = parseAny(input);
      const b = parseAny(second ?? "");
      if (options.mode === "interleave") return toSrt([...a, ...b].sort((x, y) => x.start - y.start || x.end - y.end));
      const offset = Math.max(...a.map(cue => cue.end)) + Math.max(0, Number(options.gap) || 0);
      return toSrt([...a, ...b.map(cue => ({ ...cue, start: cue.start + offset, end: cue.end + offset }))]);
    },
  },
  "subtitle-split": {
    input: { label: "SRT or WebVTT subtitles", example: SRT, rows: 12, accept: ".srt,.vtt" },
    options: [
      { id: "at", label: "Split at (m:ss or h:mm:ss)", type: "text", default: "0:07" },
      { id: "part", label: "Part to output", type: "select", choices: [["1", "Part 1 (before the split)"], ["2", "Part 2 (after the split)"]], default: "2" },
      { id: "rebase", label: "Start part 2 at 00:00:00", type: "checkbox", default: true },
    ],
    outputLabel: "Subtitle part (SRT)",
    outputExt: "srt",
    note: "A cue that crosses the split point is cut at the split, so it appears in both parts.",
    run(input, options) {
      const at = parseClock(String(options.at));
      if (at === null) throw new Error("Write the split time as m:ss or h:mm:ss.");
      const split = at * 1000;
      const cues = parseAny(input);
      const part = options.part === "1"
        ? cues.filter(c => c.start < split).map(c => ({ ...c, end: Math.min(c.end, split) }))
        : cues.filter(c => c.end > split).map(c => ({ ...c, start: Math.max(c.start, split) })).map(c => (options.rebase ? { ...c, start: c.start - split, end: c.end - split } : c));
      if (part.length === 0) throw new Error("That part has no cues. Pick a split time inside the subtitles.");
      return toSrt(part);
    },
  },
  "subtitle-text-cleaner": {
    input: { label: "SRT, WebVTT or SBV subtitles", example: SRT, rows: 12, accept: ".srt,.vtt,.sbv" },
    options: [
      { id: "brackets", label: "Remove [sound tags] and (descriptions)", type: "checkbox", default: true },
      { id: "speakers", label: "Remove speaker labels (HOST:, >>)", type: "checkbox", default: true },
      { id: "music", label: "Remove ♪ music symbols", type: "checkbox", default: true },
    ],
    outputLabel: "Cleaned subtitles (same format)",
    note: "Formatting tags are removed too. Cues left empty are dropped.",
    run(input, options) {
      const cues = parseAny(input).map(cue => ({ ...cue, text: cleanCaption(cue.text, options) })).filter(cue => cue.text);
      if (cues.length === 0) throw new Error("Every cue was empty after cleaning.");
      return sameFormat(input, cues);
    },
  },
  "subtitle-rewrap": {
    input: { label: "SRT, WebVTT or SBV subtitles", example: SRT, rows: 12, accept: ".srt,.vtt,.sbv" },
    options: [{ id: "width", label: "Maximum characters per line", type: "number", default: 42, min: 10, max: 100 }],
    outputLabel: "Re-wrapped subtitles (same format)",
    note: "Re-breaks each cue's text at word boundaries. Tags are removed so they do not count toward line length.",
    run(input, options) {
      const width = Number(options.width);
      if (!Number.isFinite(width) || width < 10) throw new Error("Use at least 10 characters per line.");
      return sameFormat(input, parseAny(input).map(cue => ({ ...cue, text: wrapWords(stripTags(cue.text).replace(/\n/g, " "), width).join("\n") })));
    },
  },
  "caption-reading-speed": {
    input: { label: "SRT, WebVTT or SBV subtitles", example: SRT, rows: 12, accept: ".srt,.vtt,.sbv" },
    options: [
      { id: "cps", label: "Maximum characters per second", type: "number", default: 20, min: 5, max: 40, hint: "Use the limit from your own style guide." },
      { id: "cpl", label: "Maximum characters per line", type: "number", default: 42, min: 10, max: 100 },
      { id: "lines", label: "Maximum lines per cue", type: "number", default: 2, min: 1, max: 4 },
    ],
    outputLabel: "Reading-speed report",
    run(input, options) {
      const cues = parseAny(input);
      const issues = cues.flatMap((cue, i) => {
        const lines = stripTags(cue.text).split("\n");
        const total = lines.join("").replace(/\s/g, "").length;
        const secs = (cue.end - cue.start) / 1000;
        const cps = secs > 0 ? total / secs : Infinity;
        const out: string[] = [];
        if (cps > Number(options.cps)) out.push(`Cue ${i + 1}: ${Number.isFinite(cps) ? cps.toFixed(1) : "∞"} characters/second (limit ${options.cps}).`);
        lines.forEach((line, j) => { if ([...line].length > Number(options.cpl)) out.push(`Cue ${i + 1}, line ${j + 1}: ${[...line].length} characters (limit ${options.cpl}).`); });
        if (lines.length > Number(options.lines)) out.push(`Cue ${i + 1}: ${lines.length} lines (limit ${options.lines}).`);
        return out;
      });
      return issues.length ? [`${issues.length} issue${issues.length === 1 ? "" : "s"} in ${cues.length} cues:`, ...issues].join("\n") : `All ${cues.length} cues are within the limits.`;
    },
  },
  "transcript-to-srt": {
    input: { label: "Timestamped transcript (e.g. copied from YouTube)", example: TRANSCRIPT, rows: 10 },
    options: [{ id: "last", label: "Length of the last cue (seconds)", type: "number", default: 4, min: 1, max: 30 }],
    outputLabel: "SRT subtitles",
    outputExt: "srt",
    note: "Accepts a timestamp at the start of a line or on its own line above the text. Each cue ends when the next one starts.",
    run(input, options) {
      const entries = parseTranscript(input);
      if (entries.length === 0) throw new Error("No timestamps such as 0:03 were found at the start of lines.");
      const cues = entries.map((entry, i) => ({ start: entry.start * 1000, end: (entries[i + 1]?.start ?? entry.start + Number(options.last)) * 1000, text: entry.text }));
      return toSrt(cues);
    },
  },
  "transcript-timestamp-remover": {
    input: { label: "Transcript with timestamps", example: TRANSCRIPT, rows: 10 },
    options: [{ id: "join", label: "Join into one paragraph", type: "checkbox", default: true }],
    outputLabel: "Clean transcript",
    run(input, options) {
      const lines = input.split(/\r?\n/).map(line => line.replace(/^\s*[[(]?\d{1,2}(?::\d{2}){1,2}(?:[.,]\d+)?[\])]?\s*[-–:]?\s*/, "").trim()).filter(Boolean);
      if (lines.length === 0) throw new Error("Only timestamps were found; there is no text to keep.");
      return options.join ? lines.join(" ").replace(/\s+/g, " ") : lines.join("\n");
    },
  },
  "transcript-paragraphs": {
    input: { label: "Transcript text", example: "hey everyone welcome back to the channel. today i'm going to show you how to trim a video right in your browser. no uploads, no accounts. first open the tool and drop your clip in. then drag the handles to pick the part you want. when you're happy press export and the file is saved straight to your computer.", rows: 8 },
    options: [
      { id: "sentences", label: "Sentences per paragraph", type: "number", default: 3, min: 1, max: 20 },
      { id: "capitalize", label: "Capitalize sentence starts and \"i\"", type: "checkbox", default: true },
    ],
    outputLabel: "Formatted transcript",
    note: "Splits on . ! and ? only; transcripts without punctuation stay as one paragraph.",
    run(input, options) {
      const text = input.replace(/\s+/g, " ").trim();
      if (!text) throw new Error("Paste a transcript.");
      const fix = (s: string) => (options.capitalize ? s.replace(/^\p{Ll}/u, c => c.toUpperCase()).replace(/\bi\b(?=[\s'’]|$)/g, "I") : s);
      const sentences = (text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [text]).map(s => fix(s.trim())).filter(Boolean);
      const size = Math.max(1, Math.floor(Number(options.sentences)));
      const paragraphs = Array.from({ length: Math.ceil(sentences.length / size) }, (_, i) => sentences.slice(i * size, i * size + size).join(" "));
      return paragraphs.join("\n\n");
    },
  },
  "hook-word-count": {
    input: { label: "Your opening hook", example: SCRIPT, rows: 6 },
    options: [wpmOption(150), { id: "seconds", label: "Target hook length (seconds)", type: "number", default: 15, min: 3, max: 120 }],
    outputLabel: "Hook check",
    run(input, options) {
      const count = words(input).length;
      if (count === 0) throw new Error("Paste the words of your hook.");
      const pace = wpm(options.wpm);
      const spoken = (count / pace) * 60;
      const allowed = Math.floor((Number(options.seconds) * pace) / 60);
      const verdict = count <= allowed ? `Fits: ${allowed - count} words to spare.` : `Too long by ${count - allowed} words for ${options.seconds} seconds.`;
      return [`Words: ${count}`, `Spoken length at ${pace} wpm: ${duration(spoken)}`, `Words that fit in ${options.seconds} s: ${allowed}`, verdict].join("\n");
    },
  },
  "script-reading-time": {
    input: { label: "Video script or voiceover text", example: `${SCRIPT}\n\nFirst, open the trimmer and drop in your clip. Then drag the handles to the part you want to keep. When you're happy, press export.`, rows: 10 },
    options: [wpmOption(150), { id: "pause", label: "Pause between paragraphs (seconds)", type: "number", default: 1, min: 0, max: 10, step: 0.5 }],
    outputLabel: "Estimated voiceover length",
    run(input, options) {
      const count = words(input).length;
      if (count === 0) throw new Error("Paste your script.");
      const pace = wpm(options.wpm);
      const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim()).length;
      const total = (count / pace) * 60 + Math.max(0, paragraphs - 1) * Number(options.pause);
      const paces = [130, 150, 170].map(p => `At ${p} wpm: ${duration((count / p) * 60)}`);
      return [`Words: ${count} · Paragraphs: ${paragraphs}`, `Estimated length: ${duration(total)}`, "", "Speaking only, at other paces:", ...paces].join("\n");
    },
  },
};
