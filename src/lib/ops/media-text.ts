import type { TextOp } from "./types";
import { mapTimings, parseAny, toAss, toSrt, toVtt, stripTags, validateSrt } from "./media-text-subtitles.ts";
import { advancedMediaOps } from "./image-media-advanced.ts";

const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,200
Welcome back to the channel.

2
00:00:04,500 --> 00:00:07,800
Today we are building a <i>browser-only</i> video tool.

3
00:00:08,000 --> 00:00:11,000
Let's get started.
`;

const SAMPLE_BROKEN = `1
00:00:01,000 --> 00:00:04,200
Welcome back to the channel.

3
00:00:04,000 --> 00:00:07,800
Today we are building a video tool.

4
00:00:09,000 --> 00:00:08,500
Let's get started.
`;

const FPS_CHOICES: Array<[string, string]> = [
  ["23.976", "23.976 (24000/1001)"], ["24", "24"], ["25", "25 (PAL)"], ["29.97", "29.97 (30000/1001)"],
  ["30", "30"], ["50", "50"], ["59.94", "59.94 (60000/1001)"], ["60", "60"],
];

const EXACT_FPS: Record<string, number> = { "23.976": 24000 / 1001, "29.97": 30000 / 1001, "59.94": 60000 / 1001 };
const fps = (value: string | number | boolean) => EXACT_FPS[String(value)] ?? Number(value);

function requireTimings(count: number): void {
  if (count === 0) throw new Error("No subtitle timings found. Paste SRT or WebVTT text with lines like 00:00:01,000 --> 00:00:04,000.");
}

export const ops: Record<string, TextOp> = {
  "subtitle-shift": {
    input: { label: "SRT or WebVTT subtitles", example: SAMPLE_SRT, rows: 12, accept: ".srt,.vtt,text/vtt" },
    options: [{ id: "offset", label: "Offset (milliseconds)", type: "number", default: 1500, step: 100, hint: "Positive delays the subtitles, negative makes them appear earlier." }],
    outputLabel: "Shifted subtitles",
    outputExt: "srt",
    note: "Times that would go below 00:00:00 are clamped to zero. Numbering, notes and styling are kept as they are.",
    run(input, options) {
      const offset = Number(options.offset);
      if (!Number.isFinite(offset)) throw new Error("Enter the offset as a number of milliseconds, e.g. 1500 or -750.");
      const result = mapTimings(input, ms => ms + offset);
      requireTimings(result.count);
      return result.text;
    },
  },
  "subtitle-fps-convert": {
    input: { label: "SRT or WebVTT subtitles", example: SAMPLE_SRT, rows: 12, accept: ".srt,.vtt,text/vtt" },
    options: [
      { id: "from", label: "Subtitles were timed for", type: "select", choices: FPS_CHOICES, default: "23.976" },
      { id: "to", label: "Target video frame rate", type: "select", choices: FPS_CHOICES, default: "25" },
    ],
    outputLabel: "Converted subtitles",
    outputExt: "srt",
    note: "Use this when a video was sped up or slowed down to a new frame rate (e.g. a 23.976 film released at 25 fps). Each time is multiplied by source fps ÷ target fps.",
    run(input, options) {
      const ratio = fps(options.from) / fps(options.to);
      const result = mapTimings(input, ms => ms * ratio);
      requireTimings(result.count);
      return result.text;
    },
  },
  "srt-validate": {
    input: { label: "SRT subtitles", example: SAMPLE_BROKEN, rows: 12, accept: ".srt" },
    options: [{ id: "mode", label: "Output", type: "select", choices: [["report", "Problem report"], ["fix", "Fixed file (sorted and renumbered)"]], default: "report" }],
    outputLabel: "Result",
    note: "The fixed file sorts cues by start time and renumbers them. It does not change overlapping or reversed times; fix those by hand using the report.",
    run(input, options) {
      const { cues, issues } = validateSrt(input);
      if (cues.length === 0) throw new Error("No SRT cues found. Each cue needs a number, a timing line like 00:00:01,000 --> 00:00:04,000 and text.");
      if (options.mode === "fix") return toSrt([...cues].sort((a, b) => a.start - b.start));
      if (issues.length === 0) return `No problems found in ${cues.length} cues.`;
      return [`${issues.length} problem${issues.length === 1 ? "" : "s"} found in ${cues.length} cues:`, ...issues.map(issue => `- ${issue.message}`)].join("\n");
    },
  },
  "srt-to-ass": {
    input: { label: "SRT, WebVTT or SBV subtitles", example: SAMPLE_SRT, rows: 12, accept: ".srt,.vtt,.sbv" },
    options: [
      { id: "font", label: "Font name", type: "text", default: "Arial" },
      { id: "size", label: "Font size", type: "number", default: 48, min: 8, max: 200 },
      { id: "res", label: "Video resolution", type: "select", choices: [["1920x1080", "1920 × 1080"], ["1280x720", "1280 × 720"], ["1080x1920", "1080 × 1920 (vertical)"], ["3840x2160", "3840 × 2160"]], default: "1920x1080" },
    ],
    outputLabel: "ASS subtitles",
    outputExt: "ass",
    note: "Creates one Default style (white text, black outline, bottom centre). HTML tags such as <i> are removed; ASS times use centiseconds.",
    run(input, options) {
      const [width, height] = String(options.res).split("x").map(Number);
      const size = Number(options.size);
      if (!Number.isFinite(size) || size < 8 || size > 200) throw new Error("Font size must be between 8 and 200.");
      const font = String(options.font).replace(/,/g, " ").trim() || "Arial";
      return toAss(parseAny(input), { font, size, width, height });
    },
  },

  "srt-to-vtt-converter": {
    input: { label: "SRT subtitles", example: SAMPLE_SRT, rows: 12, accept: ".srt" },
    outputLabel: "WebVTT output",
    outputExt: "vtt",
    run(input) {
      const cues = parseAny(input);
      requireTimings(cues.length);
      return toVtt(cues);
    }
  },

  "vtt-to-srt-converter": {
    input: { label: "WebVTT subtitles", example: "WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.200\nWelcome back to the channel.\n\n2\n00:00:04.500 --> 00:00:07.800\nToday we build browser tools.", rows: 12, accept: ".vtt" },
    outputLabel: "SRT output",
    outputExt: "srt",
    run(input) {
      const cues = parseAny(input);
      requireTimings(cues.length);
      return toSrt(cues);
    }
  },

  "subtitle-strip-formatting": {
    input: { label: "Subtitles with styling tags", example: SAMPLE_SRT, rows: 12 },
    outputLabel: "Plain Text Subtitles (No Tags)",
    outputExt: "srt",
    run(input) {
      const cues = parseAny(input);
      requireTimings(cues.length);
      const cleaned = cues.map(c => ({ ...c, text: stripTags(c.text) }));
      return toSrt(cleaned);
    }
  },

  "subtitle-clean-sound-effects": {
    input: { label: "Subtitles with sound cues", example: "1\n00:00:01,000 --> 00:00:04,200\n[Music Playing] Welcome!\n\n2\n00:00:04,500 --> 00:00:07,800\n(Audience Applause) Thank you very much.", rows: 12 },
    outputLabel: "Cleaned Subtitles",
    outputExt: "srt",
    run(input) {
      const cues = parseAny(input);
      requireTimings(cues.length);
      const cleaned = cues.map(c => ({
        ...c,
        text: c.text
          .replace(/\[[^\]]*\]/g, "")
          .replace(/\([^)]*\)/g, "")
          .replace(/♪[^♪]*♪/g, "")
          .trim()
      })).filter(c => c.text.length > 0);
      return toSrt(cleaned);
    }
  },

  "subtitle-stats-analyzer": {
    input: { label: "SRT or WebVTT subtitles", example: SAMPLE_SRT, rows: 12 },
    outputLabel: "Subtitle Statistics & Metrics",
    outputExt: "txt",
    run(input) {
      const cues = parseAny(input);
      requireTimings(cues.length);
      const totalDurationMs = cues.reduce((sum, c) => sum + Math.max(0, c.end - c.start), 0);
      const totalWords = cues.reduce((sum, c) => sum + c.text.trim().split(/\s+/).length, 0);
      const totalChars = cues.reduce((sum, c) => sum + c.text.length, 0);
      const avgDurationSec = (totalDurationMs / cues.length / 1000).toFixed(2);
      const wpm = totalDurationMs > 0 ? Math.round((totalWords / (totalDurationMs / 60000))) : 0;
      const cps = totalDurationMs > 0 ? (totalChars / (totalDurationMs / 1000)).toFixed(1) : "0";

      return [
        "=== Subtitle Metrics ===",
        `Total Cues: ${cues.length}`,
        `Total Speech Duration: ${(totalDurationMs / 1000).toFixed(1)} seconds`,
        `Average Cue Duration: ${avgDurationSec} seconds`,
        `Total Word Count: ${totalWords}`,
        `Total Character Count: ${totalChars}`,
        `Reading Speed: ${wpm} words per minute (WPM)`,
        `Character Pace: ${cps} characters per second (CPS)`
      ].join("\n") + "\n";
    }
  },

  ...advancedMediaOps,
};
