// Shared subtitle parsing and formatting (SRT, WebVTT, SBV, ASS) used by media-text and youtube-text.
// Self-contained: no runtime imports.

export interface Cue {
  start: number; // milliseconds
  end: number; // milliseconds
  text: string;
  settings?: string; // WebVTT cue settings, e.g. "align:start"
}

export interface CueIssue { cue: number; message: string }

export type SubtitleFormat = "srt" | "vtt" | "sbv";

const TIME = String.raw`(?:(\d{1,3}):)?(\d{1,2}):(\d{2})[,.](\d{1,3})`;
const TIME_LINE = new RegExp(String.raw`^\s*${TIME}\s*-->\s*${TIME}(.*)$`);
const SBV_LINE = /^\s*(\d+):(\d{1,2}):(\d{2})\.(\d{1,3}),(\d+):(\d{1,2}):(\d{2})\.(\d{1,3})\s*$/;

function toMs(h: string | undefined, m: string, s: string, frac: string): number {
  const ms = Number(frac.padEnd(3, "0").slice(0, 3));
  return ((Number(h ?? 0) * 60 + Number(m)) * 60 + Number(s)) * 1000 + ms;
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

function split(ms: number): { h: number; m: number; s: number; ms: number } {
  const safe = Math.max(0, Math.round(ms));
  return { h: Math.floor(safe / 3600000), m: Math.floor(safe / 60000) % 60, s: Math.floor(safe / 1000) % 60, ms: safe % 1000 };
}

/** 01:02:03,456 (SRT) or 01:02:03.456 (VTT). */
export function formatTimestamp(ms: number, separator: "," | "." = ","): string {
  const t = split(ms);
  return `${pad(t.h, 2)}:${pad(t.m, 2)}:${pad(t.s, 2)}${separator}${pad(t.ms, 3)}`;
}

/** 0:01:02.345 (YouTube SBV). */
export function formatSbvTime(ms: number): string {
  const t = split(ms);
  return `${t.h}:${pad(t.m, 2)}:${pad(t.s, 2)}.${pad(t.ms, 3)}`;
}

/** 0:01:02.34 (ASS/SSA, centiseconds). */
export function formatAssTime(ms: number): string {
  const cs = Math.round(Math.max(0, ms) / 10);
  const h = Math.floor(cs / 360000);
  const m = Math.floor(cs / 6000) % 60;
  const s = Math.floor(cs / 100) % 60;
  return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(cs % 100, 2)}`;
}

/** Human clock time: 1:02 or 1:02:03. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor(safe / 60) % 60;
  const s = safe % 60;
  return h > 0 ? `${h}:${pad(m, 2)}:${pad(s, 2)}` : `${m}:${pad(s, 2)}`;
}

/** Parses 1:02, 01:02:03, 75 (seconds) or 1:02.5 into seconds. Returns null when invalid. */
export function parseClock(value: string): number | null {
  const clean = value.trim();
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(clean)) return null;
  const parts = clean.split(":").map(Number);
  if (parts.slice(1).some(part => part >= 60)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function normalize(text: string): string {
  return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

export function detectFormat(text: string): SubtitleFormat {
  const clean = normalize(text).trimStart();
  if (/^WEBVTT/.test(clean)) return "vtt";
  if (clean.includes("-->")) return "srt";
  if (clean.split("\n").some(line => SBV_LINE.test(line))) return "sbv";
  throw new Error("No subtitle timings found. Paste SRT, WebVTT or SBV text with lines like 00:00:01,000 --> 00:00:04,000.");
}

/** Parses SRT or WebVTT cue blocks. Index lines and VTT identifiers are ignored. */
export function parseTimedCues(text: string, issues: CueIssue[] = []): Cue[] {
  const blocks = normalize(text).split(/\n[ \t]*\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((line, i) => i > 0 || line.trim() !== "");
    const timeIndex = lines.findIndex(line => line.includes("-->"));
    if (timeIndex === -1) continue;
    const match = TIME_LINE.exec(lines[timeIndex]);
    if (!match) {
      issues.push({ cue: cues.length + 1, message: `Unreadable timing line "${lines[timeIndex].trim()}".` });
      continue;
    }
    const start = toMs(match[1], match[2], match[3], match[4]);
    const end = toMs(match[5], match[6], match[7], match[8]);
    const settings = match[9].trim();
    const body = lines.slice(timeIndex + 1).join("\n").trimEnd();
    cues.push({ start, end, text: body, ...(settings ? { settings } : {}) });
  }
  return cues;
}

export function parseSbv(text: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of normalize(text).split(/\n[ \t]*\n/)) {
    const lines = block.split("\n").filter(line => line.trim() !== "");
    const match = lines.length ? SBV_LINE.exec(lines[0]) : null;
    if (!match) continue;
    cues.push({ start: toMs(match[1], match[2], match[3], match[4]), end: toMs(match[5], match[6], match[7], match[8]), text: lines.slice(1).join("\n") });
  }
  return cues;
}

/** Parses any supported format and throws a friendly error when nothing is found. */
export function parseAny(text: string): Cue[] {
  const format = detectFormat(text);
  const cues = format === "sbv" ? parseSbv(text) : parseTimedCues(text);
  if (cues.length === 0) throw new Error("No subtitle cues found. Check that each cue has a timing line and text.");
  return cues;
}

export function toSrt(cues: Cue[]): string {
  return cues.map((cue, i) => `${i + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(cue.end)}\n${cue.text}`).join("\n\n") + "\n";
}

export function toVtt(cues: Cue[]): string {
  const body = cues.map(cue => `${formatTimestamp(cue.start, ".")} --> ${formatTimestamp(cue.end, ".")}${cue.settings ? ` ${cue.settings}` : ""}\n${cue.text}`);
  return `WEBVTT\n\n${body.join("\n\n")}\n`;
}

export function toSbv(cues: Cue[]): string {
  return cues.map(cue => `${formatSbvTime(cue.start)},${formatSbvTime(cue.end)}\n${cue.text}`).join("\n\n") + "\n";
}

function assText(text: string): string {
  return stripTags(text).replace(/\{/g, "(").replace(/\}/g, ")").replace(/\n/g, "\\N");
}

export function toAss(cues: Cue[], options: { font: string; size: number; width: number; height: number }): string {
  const header = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${options.width}`, `PlayResY: ${options.height}`, "WrapStyle: 0", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,${options.font},${options.size},&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,1,2,20,20,30,1`, "",
    "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const events = cues.map(cue => `Dialogue: 0,${formatAssTime(cue.start)},${formatAssTime(cue.end)},Default,,0,0,0,,${assText(cue.text)}`);
  return [...header, ...events].join("\n") + "\n";
}

/** Removes HTML-like and ASS override tags from cue text. */
export function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\{\\[^}]*\}/g, "");
}

/** Plain text of cues: one line per cue, tags removed. */
export function cuesToPlainText(cues: Cue[], joinLines: boolean): string {
  const lines = cues.map(cue => stripTags(cue.text).split("\n").map(line => line.trim()).filter(Boolean).join(" ")).filter(Boolean);
  return joinLines ? lines.join(" ").replace(/\s+/g, " ").trim() : lines.join("\n");
}

/**
 * Rewrites every timing in SRT/VTT text in place with `map`, keeping numbering, notes, styles and
 * the original separator (comma or dot) and hour style.
 */
export function mapTimings(text: string, map: (ms: number) => number): { text: string; count: number } {
  let count = 0;
  const pattern = new RegExp(String.raw`${TIME}(\s*-->\s*)${TIME}`, "g");
  const out = normalize(text).replace(pattern, (...m: string[]) => {
    count += 1;
    const sep = m[0].includes(",") ? "," : ".";
    const start = Math.max(0, Math.round(map(toMs(m[1], m[2], m[3], m[4]))));
    const end = Math.max(0, Math.round(map(toMs(m[6], m[7], m[8], m[9]))));
    // VTT may omit hours (00:01.000); keep that style unless a time passes one hour.
    const withHours = m[1] !== undefined || sep === "," || Math.max(start, end) >= 3600000;
    const format = (ms: number) => (withHours ? formatTimestamp(ms, sep) : formatTimestamp(ms, sep).slice(3));
    return `${format(start)}${m[5]}${format(end)}`;
  });
  return { text: out, count };
}

/** Structural checks for SRT text: numbering, timing order, overlaps, empty cues. */
export function validateSrt(text: string): { cues: Cue[]; issues: CueIssue[] } {
  const issues: CueIssue[] = [];
  const blocks = normalize(text).split(/\n[ \t]*\n/).map(b => b.split("\n").filter(line => line.trim() !== "")).filter(b => b.length > 0);
  blocks.forEach((lines, i) => {
    const n = i + 1;
    if (!/^\d+$/.test(lines[0].trim())) issues.push({ cue: n, message: `Cue ${n}: first line should be its number, found "${lines[0].trim().slice(0, 40)}".` });
    else if (Number(lines[0]) !== n) issues.push({ cue: n, message: `Cue ${n}: numbered ${lines[0].trim()}, expected ${n}.` });
    const timing = lines.find(line => line.includes("-->"));
    if (!timing) issues.push({ cue: n, message: `Cue ${n}: missing a "start --> end" timing line.` });
    else if (!TIME_LINE.test(timing)) issues.push({ cue: n, message: `Cue ${n}: unreadable timing line "${timing.trim()}".` });
    else if (timing.includes(".")) issues.push({ cue: n, message: `Cue ${n}: SRT uses a comma before milliseconds (00:00:01,000), not a dot.` });
  });
  const cues = parseTimedCues(text);
  cues.forEach((cue, i) => {
    const n = i + 1;
    if (cue.end <= cue.start) issues.push({ cue: n, message: `Cue ${n}: ends at or before it starts.` });
    if (!cue.text.trim()) issues.push({ cue: n, message: `Cue ${n}: has no text.` });
    const next = cues[i + 1];
    if (next && next.start < cue.end) issues.push({ cue: n, message: `Cue ${n}: overlaps cue ${n + 1} by ${cue.end - next.start} ms.` });
    if (next && next.start < cue.start) issues.push({ cue: n + 1, message: `Cue ${n + 1}: starts earlier than cue ${n} (out of order).` });
  });
  return { cues, issues };
}
