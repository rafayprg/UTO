// YouTube URL, ID, embed and thumbnail tools. Self-contained.
import type { TextOp } from "./types";

const ID = /^[A-Za-z0-9_-]{11}$/;
const SAMPLE_URLS = `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=43s
https://youtu.be/9bZkp7q19f0?si=AbCdEf123
https://www.youtube.com/shorts/aqz-KE-bpKQ
https://www.youtube.com/embed/jNQXAC9IVRw`;

function tryUrl(value: string): URL | null {
  const clean = value.trim();
  if (!clean) return null;
  try { return new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`); }
  catch { return null; }
}

function isYouTubeHost(host: string): boolean {
  return /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i.test(host);
}

/** Returns the 11-character video ID from a URL or bare ID, or null. */
export function videoId(value: string): string | null {
  const clean = value.trim();
  if (ID.test(clean)) return clean;
  const url = tryUrl(clean);
  if (!url || !isYouTubeHost(url.hostname)) return null;
  const v = url.searchParams.get("v");
  if (v && ID.test(v)) return v;
  if (/youtu\.be$/i.test(url.hostname)) {
    const first = url.pathname.split("/")[1] ?? "";
    return ID.test(first) ? first : null;
  }
  const match = /^\/(?:embed|shorts|live|v|e)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/.exec(url.pathname);
  return match ? match[1] : null;
}

function requireId(value: string): string {
  const id = videoId(value);
  if (!id) throw new Error("No YouTube video ID found. Paste a link like https://www.youtube.com/watch?v=dQw4w9WgXcQ or the 11-character ID.");
  return id;
}

function playlistId(value: string): string | null {
  const clean = value.trim();
  if (/^(PL|UU|LL|FL|OL|RD)[A-Za-z0-9_-]{10,}$/.test(clean)) return clean;
  const url = tryUrl(clean);
  if (!url || !isYouTubeHost(url.hostname)) return null;
  const list = url.searchParams.get("list");
  return list && /^[A-Za-z0-9_-]{10,}$/.test(list) ? list : null;
}

/** "1:23", "1:02:03", "83", "1h2m3s" → seconds. */
export function parseTime(value: string): number {
  const clean = value.trim().toLowerCase();
  const hms = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(clean);
  if (hms && clean !== "") return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
  if (!/^\d+(?::\d{1,2}){0,2}$/.test(clean)) throw new Error(`"${value}" is not a time. Use m:ss, h:mm:ss, seconds, or 1h2m3s.`);
  const parts = clean.split(":").map(Number);
  if (parts.slice(1).some(part => part >= 60)) throw new Error(`Minutes and seconds in "${value}" must be under 60.`);
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function lines(input: string): string[] {
  return input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function eachLine(input: string, map: (line: string) => string): string {
  const all = lines(input);
  if (all.length === 0) throw new Error("Paste at least one YouTube link.");
  return all.map(map).join("\n");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const THUMBS: Array<[file: string, label: string]> = [
  ["maxresdefault", "Max resolution 1280×720 (only if the video was uploaded in HD)"],
  ["sddefault", "Standard 640×480"],
  ["hqdefault", "High quality 480×360"],
  ["mqdefault", "Medium quality 320×180"],
  ["default", "Default 120×90"],
];

const embedOptions: TextOp["options"] = [
  { id: "start", label: "Start at (m:ss, optional)", type: "text", default: "", placeholder: "0:30" },
  { id: "end", label: "End at (m:ss, optional)", type: "text", default: "" },
  { id: "size", label: "Size", type: "select", choices: [["responsive", "Responsive 16:9 (full width)"], ["560x315", "560 × 315"], ["640x360", "640 × 360"], ["853x480", "853 × 480"], ["1280x720", "1280 × 720"]], default: "responsive" },
  { id: "nocookie", label: "Privacy-enhanced mode (youtube-nocookie.com)", type: "checkbox", default: true },
  { id: "autoplay", label: "Autoplay (browsers usually require mute too)", type: "checkbox", default: false },
  { id: "mute", label: "Start muted", type: "checkbox", default: false },
  { id: "controls", label: "Show player controls", type: "checkbox", default: true },
  { id: "loop", label: "Loop", type: "checkbox", default: false },
];

function iframe(src: string, size: string, title: string): string {
  const attrs = `src="${escapeAttr(src)}" title="${escapeAttr(title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen`;
  if (size === "responsive") return `<div style="position:relative;width:100%;aspect-ratio:16/9">\n  <iframe style="position:absolute;inset:0;width:100%;height:100%" ${attrs}></iframe>\n</div>`;
  const [w, h] = size.split("x");
  return `<iframe width="${w}" height="${h}" ${attrs}></iframe>`;
}

function embedParams(options: Record<string, string | number | boolean>, loopId?: string): URLSearchParams {
  const params = new URLSearchParams();
  const start = String(options.start ?? "").trim();
  const end = String(options.end ?? "").trim();
  const startS = start ? parseTime(start) : 0;
  if (start) params.set("start", String(startS));
  if (end) {
    const endS = parseTime(end);
    if (endS <= startS) throw new Error("The end time must be after the start time.");
    params.set("end", String(endS));
  }
  if (options.autoplay) params.set("autoplay", "1");
  if (options.mute) params.set("mute", "1");
  if (!options.controls) params.set("controls", "0");
  if (options.loop) {
    params.set("loop", "1");
    if (loopId) params.set("playlist", loopId);
  }
  return params;
}

export const linkOps: Record<string, TextOp> = {
  "yt-video-id-extract": {
    input: { label: "YouTube links (one per line)", example: SAMPLE_URLS, rows: 6 },
    options: [{ id: "unique", label: "Remove duplicate IDs", type: "checkbox", default: true }],
    outputLabel: "Video IDs",
    note: "Understands watch, youtu.be, Shorts, embed, live and youtube-nocookie links.",
    run(input, options) {
      const ids = lines(input).map(line => videoId(line) ?? `(no video ID in: ${line.slice(0, 60)})`);
      if (ids.length === 0) throw new Error("Paste at least one YouTube link.");
      return (options.unique ? [...new Set(ids)] : ids).join("\n");
    },
  },
  "yt-timestamp-link": {
    input: { label: "YouTube link or video ID", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    options: [
      { id: "time", label: "Start time", type: "text", default: "1:23", hint: "m:ss, h:mm:ss, seconds or 1h2m3s" },
      { id: "style", label: "Link style", type: "select", choices: [["short", "youtu.be/ID?t=83"], ["watch", "youtube.com/watch?v=ID&t=83s"]], default: "short" },
    ],
    outputLabel: "Link that starts at the chosen time",
    run(input, options) {
      const id = requireId(input);
      const seconds = parseTime(String(options.time));
      return options.style === "watch" ? `https://www.youtube.com/watch?v=${id}&t=${seconds}s` : `https://youtu.be/${id}?t=${seconds}`;
    },
  },
  "yt-short-link": {
    input: { label: "YouTube links (one per line)", example: SAMPLE_URLS, rows: 6 },
    outputLabel: "youtu.be short links",
    note: "Keeps a start time (t=) if the original link had one and drops tracking parameters such as si=.",
    run(input) {
      return eachLine(input, line => {
        const id = videoId(line);
        if (!id) return `(no video ID in: ${line.slice(0, 60)})`;
        const t = tryUrl(line)?.searchParams.get("t");
        return `https://youtu.be/${id}${t ? `?t=${parseTime(t)}` : ""}`;
      });
    },
  },
  "yt-shorts-converter": {
    input: { label: "YouTube links (one per line)", example: "https://www.youtube.com/shorts/aqz-KE-bpKQ\nhttps://youtube.com/shorts/9bZkp7q19f0?feature=share", rows: 5 },
    options: [{ id: "to", label: "Convert to", type: "select", choices: [["watch", "Regular watch page"], ["shorts", "Shorts player"]], default: "watch" }],
    outputLabel: "Converted links",
    run(input, options) {
      return eachLine(input, line => {
        const id = videoId(line);
        if (!id) return `(no video ID in: ${line.slice(0, 60)})`;
        return options.to === "shorts" ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
      });
    },
  },
  "yt-url-cleaner": {
    input: { label: "YouTube links (one per line)", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUJcmljayByb2xs&si=XyZ123&t=43s\nhttps://youtu.be/9bZkp7q19f0?si=AbCdEf123&feature=shared", rows: 5 },
    options: [
      { id: "keepTime", label: "Keep start time (t)", type: "checkbox", default: true },
      { id: "keepList", label: "Keep playlist (list, index)", type: "checkbox", default: false },
    ],
    outputLabel: "Clean links",
    run(input, options) {
      return eachLine(input, line => {
        const url = tryUrl(line);
        const id = videoId(line);
        if (!url || !id) return `(no video ID in: ${line.slice(0, 60)})`;
        const params = new URLSearchParams({ v: id });
        const t = url.searchParams.get("t");
        if (options.keepTime && t) params.set("t", t);
        for (const key of ["list", "index"]) {
          const value = url.searchParams.get(key);
          if (options.keepList && value) params.set(key, value);
        }
        return `https://www.youtube.com/watch?${params.toString()}`;
      });
    },
  },
  "yt-embed-code": {
    input: { label: "YouTube link or video ID", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    options: embedOptions,
    outputLabel: "Embed HTML",
    outputExt: "html",
    run(input, options) {
      const id = requireId(input);
      const host = options.nocookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
      const query = embedParams(options, id).toString();
      return iframe(`${host}/embed/${id}${query ? `?${query}` : ""}`, String(options.size), "YouTube video player");
    },
  },
  "yt-playlist-embed": {
    input: { label: "YouTube playlist link or playlist ID", example: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI" },
    options: embedOptions.filter(option => option.id !== "start" && option.id !== "end"),
    outputLabel: "Embed HTML",
    outputExt: "html",
    run(input, options) {
      const list = playlistId(input);
      if (!list) throw new Error("No playlist ID found. Paste a link that contains list=… or the playlist ID itself.");
      const host = options.nocookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
      const params = embedParams({ ...options, start: "", end: "" });
      params.set("list", list);
      return iframe(`${host}/embed/videoseries?${params.toString()}`, String(options.size), "YouTube playlist player");
    },
  },
  "yt-playlist-id-extract": {
    input: { label: "YouTube links (one per line)", example: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&index=2", rows: 5 },
    options: [{ id: "unique", label: "Remove duplicates", type: "checkbox", default: true }],
    outputLabel: "Playlist IDs",
    run(input, options) {
      const ids = lines(input).map(line => playlistId(line) ?? `(no playlist ID in: ${line.slice(0, 60)})`);
      if (ids.length === 0) throw new Error("Paste at least one YouTube link.");
      return (options.unique ? [...new Set(ids)] : ids).join("\n");
    },
  },
  "yt-channel-id-extract": {
    input: { label: "YouTube channel links (one per line)", example: "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw\nhttps://www.youtube.com/@GoogleDevelopers/videos\nhttps://www.youtube.com/c/GoogleDevelopers\nhttps://www.youtube.com/user/GoogleDevelopers", rows: 5 },
    outputLabel: "Channel identifiers",
    note: "Reads the identifier written in the link. A handle or custom URL cannot be turned into a UC… channel ID without asking YouTube, so it is listed as it is.",
    run(input) {
      return eachLine(input, line => {
        const url = tryUrl(line);
        if (!url || !isYouTubeHost(url.hostname)) return `(not a YouTube link: ${line.slice(0, 60)})`;
        const [first = "", second = ""] = url.pathname.split("/").filter(Boolean);
        if (first === "channel" && /^UC[A-Za-z0-9_-]{22}$/.test(second)) return `Channel ID: ${second}`;
        if (first.startsWith("@")) return `Handle: ${decodeURIComponent(first)}`;
        if (first === "c" && second) return `Custom URL name: ${decodeURIComponent(second)}`;
        if (first === "user" && second) return `Legacy username: ${decodeURIComponent(second)}`;
        return `(no channel identifier in: ${line.slice(0, 60)})`;
      });
    },
  },
  "yt-thumbnail-urls": {
    input: { label: "YouTube link or video ID", example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    options: [{ id: "format", label: "Image format", type: "select", choices: [["jpg", "JPEG (i.ytimg.com/vi/)"], ["webp", "WebP (i.ytimg.com/vi_webp/)"]], default: "jpg" }],
    outputLabel: "Thumbnail image URLs",
    note: "Open a URL to view or save the image. YouTube only serves the 1280×720 and 640×480 versions when the video has them.",
    run(input, options) {
      const id = requireId(input);
      const webp = options.format === "webp";
      return THUMBS.map(([file, label]) => `${label}\nhttps://i.ytimg.com/${webp ? "vi_webp" : "vi"}/${id}/${file}.${webp ? "webp" : "jpg"}`).join("\n\n");
    },
  },
  "yt-timestamp-linkify": {
    input: { label: "Show notes or comment with timestamps", example: "0:00 Intro\n1:45 Setting up the project\n6:30 Writing the first test\n12:05 Wrap-up and next steps", rows: 6 },
    options: [
      { id: "video", label: "Video link or ID", type: "text", default: "https://youtu.be/dQw4w9WgXcQ" },
      { id: "format", label: "Output", type: "select", choices: [["markdown", "Markdown links"], ["html", "HTML links"], ["plain", "Plain URLs after each time"]], default: "markdown" },
    ],
    outputLabel: "Text with timestamp links",
    run(input, options) {
      const id = requireId(String(options.video));
      let count = 0;
      const out = input.replace(/(?<![\d:])(\d{1,2}:)?\d{1,2}:\d{2}(?![\d:])/g, time => {
        const seconds = parseTime(time);
        count += 1;
        const url = `https://youtu.be/${id}?t=${seconds}`;
        if (options.format === "html") return `<a href="${url}">${time}</a>`;
        if (options.format === "plain") return `${time} (${url})`;
        return `[${time}](${url})`;
      });
      if (count === 0) throw new Error("No timestamps such as 1:45 or 1:02:03 were found in the text.");
      return out;
    },
  },
};
