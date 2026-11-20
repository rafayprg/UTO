export const MAX_TEXT_LENGTH = 1_000_000;

export function formatJson(source: string, indent: number | string = 2): string {
  if (source.length > MAX_TEXT_LENGTH) throw new Error("Use JSON smaller than 1,000,000 characters.");
  if (!source.trim()) throw new Error("Paste JSON to get started.");
  try {
    return JSON.stringify(JSON.parse(source), null, indent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    const position = message.match(/position (\d+)/);
    if (position) {
      const prefix = source.slice(0, Number(position[1]));
      const lines = prefix.split("\n");
      throw new Error(`${message} — line ${lines.length}, column ${lines[lines.length - 1].length + 1}.`);
    }
    throw new Error(message);
  }
}

export function wifiPayload(ssid: string, password: string, security: "WPA" | "WEP" | "nopass", hidden: boolean): string {
  if (!ssid.trim()) throw new Error("Enter a network name (SSID).");
  if (new TextEncoder().encode(ssid).length > 32) throw new Error("A WiFi network name must be no longer than 32 UTF-8 bytes.");
  if (security !== "nopass" && !password) throw new Error("Enter the WiFi password or choose an open network.");
  const escape = (value: string) => value.replace(/[\\;,:\"]/g, "\\$&");
  return `WIFI:T:${security};S:${escape(ssid)};P:${security === "nopass" ? "" : escape(password)};H:${hidden};;`;
}

export function httpUrl(value: string): string {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Enter a complete URL beginning with https:// or http://."); }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error("Use an HTTP or HTTPS URL without embedded credentials.");
  return url.href;
}

export function youtubeId(value: string): string {
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error("Enter a YouTube video URL or its 11-character video ID."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Use a valid YouTube URL.");
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let id = "";
  if (host === "youtu.be" || host === "www.youtu.be") id = parts[0] || "";
  else if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) {
    if (parts[0] === "watch") id = url.searchParams.get("v") || "";
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) id = parts[1] || "";
  }
  if (!/^[\w-]{11}$/.test(id)) throw new Error("That is not a supported YouTube video link. Channel and playlist URLs are not video IDs.");
  return id;
}

export function decodeCaptionEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", lrm: "", rlm: "" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? whole;
    const point = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "\uFFFD";
  });
}

export function cleanCaptions(source: string, removeDuplicates = true, paragraphs = true): string {
  if (source.length > MAX_TEXT_LENGTH) throw new Error("Use a caption file smaller than 1,000,000 characters.");
  const blocks = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim().split(/\n\s*\n/);
  const output: string[] = [];
  const timing = /^(?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3}\s+-->\s+(?:\d{1,}:)?\d{2}:\d{2}[,.]\d{3}(?:\s.*)?$/;
  const hasCues = blocks.some(block => block.split("\n").some(line => timing.test(line.trim())));
  for (const block of blocks) {
    const lines = block.split("\n");
    if (/^(WEBVTT(?:\s.*)?|NOTE(?:\s.*)?|STYLE|REGION)$/.test(lines[0].trim())) continue;
    const index = lines.findIndex(line => timing.test(line.trim()));
    if (hasCues && index < 0) continue;
    const body = (index >= 0 ? lines.slice(index + 1) : lines).join(" ")
      .replace(/<[^>]*>/g, "");
    const text = decodeCaptionEntities(body).replace(/\s+/g, " ").trim();
    if (!text || (removeDuplicates && output[output.length - 1] === text)) continue;
    output.push(text);
  }
  if (!paragraphs) return output.join("\n");
  const groups: string[] = [];
  let group: string[] = [];
  for (const line of output) {
    group.push(line);
    if (group.join(" ").length >= 450 && /[.!?]["')\]]?$/.test(line)) { groups.push(group.join(" ")); group = []; }
  }
  if (group.length) groups.push(group.join(" "));
  return groups.join("\n\n");
}

function syllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 3) return cleaned ? 1 : 0;
  const reduced = cleaned.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (reduced.match(/[aeiouy]{1,2}/g) || []).length);
}

export function textStatistics(text: string, wpm = 200) {
  const segments = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "word" }).segment(text) : null;
  const words = segments ? Array.from(segments).filter(segment => segment.isWordLike).map(segment => segment.segment) : text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || [];
  const englishWords = text.match(/[a-z]+(?:['’][a-z]+)*/gi) || [];
  const sentenceCount = text.trim() ? Math.max(1, (text.match(/[^.!?]+(?:[.!?]+|$)/g) || []).filter(sentence => /[\p{L}\p{N}]/u.test(sentence)).length) : 0;
  const countCharacters = (value: string) => typeof Intl.Segmenter === "function" ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)).length : Array.from(value).length;
  const syllableCount = englishWords.reduce((sum, word) => sum + syllables(word), 0);
  const readingEase = englishWords.length && sentenceCount ? 206.835 - 1.015 * (englishWords.length / sentenceCount) - 84.6 * (syllableCount / englishWords.length) : null;
  const grade = englishWords.length && sentenceCount ? .39 * (englishWords.length / sentenceCount) + 11.8 * (syllableCount / englishWords.length) - 15.59 : null;
  return { words: words.length, characters: countCharacters(text), withoutSpaces: countCharacters(text.replace(/\s/g, "")), codeUnits: text.length, sentences: sentenceCount, paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).length : 0, syllables: syllableCount, readingSeconds: Math.ceil(words.length / Math.max(1, wpm) * 60), readingEase, grade };
}

export function finiteInput(value: string): number {
  if (!value.trim()) throw new Error("Enter a value in every field.");
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error("Enter finite numeric values.");
  return result;
}
export type PercentageMode = "of" | "ratio" | "change" | "margin";
export function calculatePercentage(mode: PercentageMode, first: number, second: number) {
  if (!Number.isFinite(first) || !Number.isFinite(second)) throw new Error("Enter finite numeric values.");
  if (mode === "of") return { result: first / 100 * second, label: "Result", formula: `${first} ÷ 100 × ${second}`, suffix: "" };
  if (mode === "ratio") { if (second === 0) throw new Error("A percentage of zero is undefined. Enter a nonzero whole."); return { result: first / second * 100, label: "Percentage", formula: `${first} ÷ ${second} × 100`, suffix: "%" }; }
  if (mode === "change") { if (first === 0) throw new Error("Percentage change from zero is undefined."); if (first < 0) throw new Error("Use a positive starting value for conventional percentage change."); return { result: (second - first) / first * 100, label: "Percentage change", formula: `(${second} − ${first}) ÷ ${first} × 100`, suffix: "%" }; }
  if (first < 0 || second < 0) throw new Error("Cost and selling price must be nonnegative.");
  if (second === 0) throw new Error("Profit margin is undefined when the selling price is zero.");
  return { result: (second - first) / second * 100, label: "Profit margin", formula: `(${second} − ${first}) ÷ ${second} × 100`, suffix: "%", profit: second - first, markup: first === 0 ? null : (second - first) / first * 100 };
}

export const UNIT_GROUPS = {
  length: { name: "Length", units: { m: ["Meters", 1], km: ["Kilometers", 1000], cm: ["Centimeters", .01], mm: ["Millimeters", .001], in: ["Inches", .0254], ft: ["Feet", .3048], yd: ["Yards", .9144], mi: ["Miles", 1609.344] } },
  mass: { name: "Mass", units: { kg: ["Kilograms", 1], g: ["Grams", .001], mg: ["Milligrams", .000001], lb: ["Pounds", .45359237], oz: ["Ounces", .028349523125], t: ["Metric tonnes", 1000] } },
  temperature: { name: "Temperature", units: { C: ["Celsius (°C)", 1], F: ["Fahrenheit (°F)", 1], K: ["Kelvin (K)", 1] } },
  area: { name: "Area", units: { m2: ["Square meters", 1], km2: ["Square kilometers", 1e6], cm2: ["Square centimeters", .0001], ft2: ["Square feet", .09290304], acre: ["Acres", 4046.8564224], ha: ["Hectares", 10000] } },
  volume: { name: "Volume", units: { L: ["Liters", 1], mL: ["Milliliters", .001], m3: ["Cubic meters", 1000], usgal: ["US gallons", 3.785411784], ukgal: ["Imperial gallons", 4.54609], uscup: ["US cups", .2365882365], usfloz: ["US fluid ounces", .0295735295625] } },
  speed: { name: "Speed", units: { ms: ["Meters / second", 1], kmh: ["Kilometers / hour", 1 / 3.6], mph: ["Miles / hour", .44704], knot: ["Knots", .5144444444444445] } },
  time: { name: "Time", units: { s: ["Seconds", 1], ms: ["Milliseconds", .001], min: ["Minutes", 60], h: ["Hours", 3600], d: ["Days", 86400], week: ["Weeks", 604800] } },
  data: { name: "Data storage", units: { bit: ["Bits (b)", .125], B: ["Bytes (B)", 1], KB: ["Kilobytes (KB, 1000 B)", 1000], MB: ["Megabytes (MB)", 1e6], GB: ["Gigabytes (GB)", 1e9], TB: ["Terabytes (TB)", 1e12], KiB: ["Kibibytes (KiB, 1024 B)", 1024], MiB: ["Mebibytes (MiB)", 1048576], GiB: ["Gibibytes (GiB)", 1073741824], TiB: ["Tebibytes (TiB)", 1099511627776] } },
} as const;
export type UnitGroup = keyof typeof UNIT_GROUPS;
export function convertUnit(group: UnitGroup, value: number, from: string, to: string): number {
  if (!Number.isFinite(value)) throw new Error("Enter a finite number.");
  const units = UNIT_GROUPS[group].units as Record<string, readonly [string, number]>;
  if (!Object.hasOwn(units, from) || !Object.hasOwn(units, to)) throw new Error("Choose units from the same measurement family.");
  if (group === "temperature") {
    const kelvin = from === "K" ? value : from === "C" ? value + 273.15 : (value - 32) * 5 / 9 + 273.15;
    if (kelvin < -1e-10) throw new Error("Temperature cannot be below absolute zero.");
    const safeKelvin = Math.max(0, kelvin);
    return to === "K" ? safeKelvin : to === "C" ? safeKelvin - 273.15 : (safeKelvin - 273.15) * 9 / 5 + 32;
  }
  if (value < 0) throw new Error("Enter a nonnegative measurement.");
  const result = value * units[from][1] / units[to][1];
  if (!Number.isFinite(result)) throw new Error("That conversion is too large for browser numeric precision.");
  return result;
}
export function displayNumber(value: number): string {
  if (!Number.isFinite(value)) return "Outside numeric range";
  return Number(value.toPrecision(12)).toLocaleString("en-US", { maximumSignificantDigits: 12 });
}
