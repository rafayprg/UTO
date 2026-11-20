// Character-level encoders and decoders: URL, HTML entities, hex/octal/binary/decimal bytes,
// UTF-16, Unicode escapes and code points, Base64 variants, data URIs, ROT ciphers and string
// escapes for JavaScript and JSON.
import type { OptionField, TextOp } from "./types";
import { fromBase64, fromHex, fromUtf8, toBase64, toBase64Url, toHex, utf8 } from "./crypto-text-bytes.ts";
import { CODE_TO_ENTITY, ENTITY_TO_CODE } from "./crypto-text-entities.ts";

const separatorOption: OptionField = {
  id: "separator", label: "Separator", type: "select", default: "space",
  choices: [["space", "Space"], ["none", "None"], ["comma", "Comma"], ["newline", "New line"]],
};
const SEPARATORS: Record<string, string> = { space: " ", none: "", comma: ",", newline: "\n" };
const sep = (value: unknown): string => SEPARATORS[String(value)] ?? " ";

function bytesTo(text: string, radix: number, width: number, separator: string, prefix = ""): string {
  return Array.from(utf8(text), byte => prefix + byte.toString(radix).padStart(width, "0")).join(separator);
}

/** Splits numeric byte tokens; without separators, fixed-width digit groups are used. */
function parseByteTokens(input: string, radix: number, width: number, name: string): Uint8Array {
  const clean = input.trim().replace(/0[box]/gi, "").replace(/\\x/gi, "");
  const tokens = /[\s,;]/.test(clean) ? clean.split(/[\s,;]+/).filter(Boolean) : clean.match(new RegExp(`.{1,${width}}`, "g")) ?? [];
  if (tokens.length === 0) throw new Error(`Enter some ${name} values.`);
  return Uint8Array.from(tokens, token => {
    const value = parseInt(token, radix);
    if (!new RegExp(radix === 2 ? "^[01]+$" : radix === 8 ? "^[0-7]+$" : "^\\d+$").test(token) || value > 255) {
      throw new Error(`"${token}" is not a valid ${name} byte (0–255).`);
    }
    return value;
  });
}

function encodeEntities(input: string, mode: string): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    const basic: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    if (basic[char]) out += basic[char];
    else if (code < 128) out += char;
    else if (mode === "minimal") out += char;
    else if (mode === "named" && CODE_TO_ENTITY.has(code)) out += `&${CODE_TO_ENTITY.get(code)};`;
    else out += mode === "hex" ? `&#x${code.toString(16).toUpperCase()};` : `&#${code};`;
  }
  return out;
}

function decodeEntities(input: string): string {
  return input.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "�";
    }
    const code = ENTITY_TO_CODE.get(body);
    return code === undefined ? match : String.fromCodePoint(code);
  });
}

function rotate(input: string, ranges: Array<[number, number]>, shift: number): string {
  return input.replace(/[\s\S]/g, char => {
    const code = char.charCodeAt(0);
    for (const [start, size] of ranges) {
      if (code >= start && code < start + size) return String.fromCharCode(start + ((code - start + shift) % size));
    }
    return char;
  });
}

function utf16Units(input: string, littleEndian: boolean): Uint8Array {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i += 1) view.setUint16(i * 2, input.charCodeAt(i), littleEndian);
  return out;
}

function decodeUtf16(bytes: Uint8Array, endian: string): string {
  if (bytes.length % 2 !== 0) throw new Error("UTF-16 needs an even number of bytes (two per code unit).");
  let littleEndian = endian === "le";
  let start = 0;
  if (bytes[0] === 0xfe && bytes[1] === 0xff) { littleEndian = false; start = 2; }
  else if (bytes[0] === 0xff && bytes[1] === 0xfe) { littleEndian = true; start = 2; }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
  let out = "";
  for (let i = start; i < bytes.length; i += 2) out += String.fromCharCode(view.getUint16(i, littleEndian));
  return out;
}

function unicodeEscape(input: string, style: string, onlyNonAscii: boolean): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (onlyNonAscii && code < 128) { out += char; continue; }
    if (style === "es6") out += `\\u{${code.toString(16).toUpperCase()}}`;
    else if (style === "python" && code > 0xffff) out += `\\U${code.toString(16).toUpperCase().padStart(8, "0")}`;
    else out += Array.from({ length: char.length }, (_, i) => `\\u${char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")}`).join("");
  }
  return out;
}

function unicodeUnescape(input: string): string {
  return input
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}|\\U([0-9a-fA-F]{8})/g, (_, a: string | undefined, b: string | undefined) => {
      const code = parseInt(a ?? b ?? "", 16);
      if (code > 0x10ffff) throw new Error(`U+${code.toString(16).toUpperCase()} is beyond the last Unicode code point.`);
      return String.fromCodePoint(code);
    })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

const JS_ESCAPES: Record<string, string> = { "\\": "\\\\", "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f", "\v": "\\v", "\0": "\\0" };

function jsEscape(input: string, quote: string, escapeUnicode: boolean): string {
  let out = "";
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    if (JS_ESCAPES[char]) out += JS_ESCAPES[char];
    else if (char === quote) out += `\\${quote}`;
    else if (code < 0x20 || code === 0x7f) out += `\\x${code.toString(16).padStart(2, "0")}`;
    else if (escapeUnicode && code > 0x7e) out += unicodeEscape(char, "js", false);
    else out += char;
  }
  return out;
}

function jsUnescape(input: string): string {
  const simple: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0" };
  return input.replace(/\\(u\{[0-9a-fA-F]{1,6}\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\r\n|[\s\S])/g, (_, esc: string) => {
    if (esc[0] === "u" || esc[0] === "x") return unicodeUnescape(`\\${esc}`);
    if (esc === "\n" || esc === "\r\n") return "";
    return simple[esc] ?? esc;
  });
}

function graphemes(input: string): string[] {
  const Segmenter = (Intl as { Segmenter?: new (locale?: string, options?: { granularity: string }) => { segment(text: string): Iterable<{ segment: string }> } }).Segmenter;
  if (!Segmenter) return Array.from(input);
  return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(input), part => part.segment);
}

function windows1252Reverse(): Map<string, number> {
  const decoded = new TextDecoder("windows-1252").decode(Uint8Array.from({ length: 256 }, (_, i) => i));
  return new Map(Array.from(decoded, (char, i): [string, number] => [char, i]));
}

function fixMojibake(input: string): string {
  const table = windows1252Reverse();
  const bytes = Array.from(input, char => {
    const byte = table.get(char);
    if (byte === undefined) throw new Error(`"${char}" is not a Windows-1252 character, so this text was not mis-decoded that way.`);
    return byte;
  });
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    throw new Error("Re-reading the text as UTF-8 failed, so it does not look like UTF-8 shown as Windows-1252 / Latin-1.");
  }
}

const CHARSETS: Array<[string, string]> = [
  ["windows-1252", "Windows-1252 (Western)"], ["iso-8859-1", "ISO-8859-1 (Latin-1)"], ["iso-8859-2", "ISO-8859-2 (Central European)"], ["iso-8859-15", "ISO-8859-15 (Latin-9)"],
  ["windows-1250", "Windows-1250"], ["windows-1251", "Windows-1251 (Cyrillic)"], ["koi8-r", "KOI8-R"], ["windows-1253", "Windows-1253 (Greek)"], ["windows-1254", "Windows-1254 (Turkish)"],
  ["windows-1255", "Windows-1255 (Hebrew)"], ["windows-1256", "Windows-1256 (Arabic)"], ["windows-874", "Windows-874 (Thai)"], ["macintosh", "Mac OS Roman"],
  ["shift_jis", "Shift_JIS"], ["euc-jp", "EUC-JP"], ["iso-2022-jp", "ISO-2022-JP"], ["gbk", "GBK"], ["gb18030", "GB18030"], ["big5", "Big5"], ["euc-kr", "EUC-KR"],
  ["utf-8", "UTF-8"], ["utf-16le", "UTF-16LE"], ["utf-16be", "UTF-16BE"],
];

function utf8Inspector(input: string): string {
  const rows = Array.from(input).map(char => {
    const code = char.codePointAt(0) ?? 0;
    const shown = code < 0x20 ? JSON.stringify(char).slice(1, -1) : char;
    const units = Array.from({ length: char.length }, (_, i) => char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")).join(" ");
    return `${shown.padEnd(4)}U+${code.toString(16).toUpperCase().padStart(4, "0").padEnd(7)}UTF-8: ${toHex(utf8(char), " ").toUpperCase().padEnd(12)}UTF-16: ${units}`;
  });
  return `${rows.length} characters, ${utf8(input).length} UTF-8 bytes, ${input.length} UTF-16 code units\n\n${rows.join("\n")}`;
}

function parseDataUri(input: string): string {
  const match = /^data:([^,]*),([\s\S]*)$/.exec(input.trim());
  if (!match) throw new Error('A data URI starts with "data:" and has a comma before the data.');
  const meta = match[1].split(";");
  const isBase64 = meta.includes("base64");
  const mime = meta[0] || "text/plain";
  let text: string;
  try {
    text = isBase64 ? fromUtf8(fromBase64(match[2])) : decodeURIComponent(match[2]);
  } catch (error) {
    throw error instanceof Error && error.message.startsWith("The decoded") ? error : new Error("The data part could not be decoded as text.");
  }
  return `MIME type: ${mime}\nEncoding: ${isBase64 ? "Base64" : "percent-encoding"}\nParameters: ${meta.slice(1).filter(p => p !== "base64").join("; ") || "none"}\n\n${text}`;
}

const a1z26Encode = (input: string): string => input.trim().split(/\s+/).map(word => Array.from(word.toLowerCase()).filter(c => /[a-z]/.test(c)).map(c => c.charCodeAt(0) - 96).join("-")).filter(Boolean).join(" ");

function a1z26Decode(input: string): string {
  return input.trim().split(/\s+/).map(word => word.split(/[-,.]+/).filter(Boolean).map(token => {
    const n = Number(token);
    if (!Number.isInteger(n) || n < 1 || n > 26) throw new Error(`"${token}" is not a number from 1 to 26.`);
    return String.fromCharCode(96 + n);
  }).join("")).join(" ");
}

function safe<T>(fn: () => T, message: string): T {
  try { return fn(); } catch { throw new Error(message); }
}

export const encodeOps: Record<string, TextOp> = {
  "base64url-encode": {
    input: { label: "Text to encode", example: "Hello? Is this URL-safe? ✓" },
    outputLabel: "Base64url",
    note: "RFC 4648 §5: - and _ replace + and /, and = padding is removed.",
    run: input => toBase64Url(utf8(input)),
  },
  "base64url-decode": {
    input: { label: "Base64url to decode", example: "SGVsbG8_IElzIHRoaXMgVVJMLXNhZmU_IOKckw" },
    outputLabel: "Decoded text",
    run: input => fromUtf8(fromBase64(input)),
  },
  "base64-to-hex": {
    input: { label: "Base64", example: "3q2+7w==" },
    options: [separatorOption, { id: "upper", label: "Uppercase", type: "checkbox", default: false }],
    outputLabel: "Hex bytes",
    run: (input, o) => { const hex = toHex(fromBase64(input), sep(o.separator)); return o.upper ? hex.toUpperCase() : hex; },
  },
  "hex-to-base64": {
    input: { label: "Hex bytes", example: "de ad be ef" },
    outputLabel: "Base64",
    run: input => toBase64(fromHex(input)),
  },
  "url-encode": {
    input: { label: "Text to encode", example: "name=Jane Doe & city=São Paulo" },
    options: [{ id: "plus", label: "Encode spaces as + (form style)", type: "checkbox", default: false }],
    outputLabel: "Percent-encoded",
    note: "Uses encodeURIComponent: everything except A–Z a–z 0–9 - _ . ! ~ * ' ( ) is encoded. Use it for one query value or path segment.",
    run: (input, o) => { const out = encodeURIComponent(input); return o.plus ? out.replace(/%20/g, "+") : out; },
  },
  "url-decode": {
    input: { label: "Percent-encoded text", example: "name%3DJane%20Doe%20%26%20city%3DS%C3%A3o%20Paulo" },
    options: [{ id: "plus", label: "Treat + as a space", type: "checkbox", default: true }],
    outputLabel: "Decoded text",
    run: (input, o) => safe(() => decodeURIComponent(o.plus ? input.replace(/\+/g, " ") : input), "This text has a broken percent sequence (a % must be followed by two hex digits forming valid UTF-8)."),
  },
  "url-encode-full": {
    input: { label: "Full URL", example: "https://example.com/search results/ünïcode?q=a b&lang=en#top" },
    outputLabel: "Encoded URL",
    note: "Uses encodeURI: keeps URL structure characters (: / ? # & = etc.) and encodes spaces and non-ASCII.",
    run: input => safe(() => encodeURI(input), "This text contains a lone surrogate character that cannot be encoded."),
  },
  "url-decode-full": {
    input: { label: "Encoded URL", example: "https://example.com/search%20results/%C3%BCn%C3%AFcode?q=a%20b&lang=en#top" },
    outputLabel: "Decoded URL",
    note: "Uses decodeURI: reserved characters such as %2F and %3F stay encoded so the URL keeps its meaning.",
    run: input => safe(() => decodeURI(input), "This URL has a broken percent sequence."),
  },
  "url-encode-all": {
    input: { label: "Text", example: "Hi there!" },
    options: [{ id: "lower", label: "Lowercase hex", type: "checkbox", default: false }],
    outputLabel: "Every byte percent-encoded",
    run: (input, o) => { const out = Array.from(utf8(input), b => `%${b.toString(16).padStart(2, "0")}`).join(""); return o.lower ? out : out.toUpperCase(); },
  },
  "html-entity-encode": {
    input: { label: "Text or HTML", example: '<p class="note">Café & crème © 2026 — “quotes”</p>' },
    options: [{ id: "mode", label: "Non-ASCII characters", type: "select", default: "named", choices: [["minimal", "Leave as is (escape only & < > \" ')"], ["named", "Named entities where they exist"], ["decimal", "Decimal &#233;"], ["hex", "Hex &#xE9;"]] }],
    outputLabel: "Escaped HTML",
    run: (input, o) => encodeEntities(input, String(o.mode)),
  },
  "html-entity-decode": {
    input: { label: "HTML with entities", example: "&lt;p&gt;Caf&eacute; &amp; cr&#232;me &copy; 2026 &mdash; &#x201C;quotes&#x201D;&lt;/p&gt;" },
    outputLabel: "Decoded text",
    note: "Decodes all numeric references and the HTML 4 named set (plus &apos;). Unknown names are left unchanged.",
    run: input => decodeEntities(input),
  },
  "text-to-hex": {
    input: { label: "Text", example: "Hello ✓" },
    options: [separatorOption, { id: "prefix", label: "Prefix", type: "select", default: "", choices: [["", "None"], ["0x", "0x"], ["\\x", "\\x"]] }, { id: "upper", label: "Uppercase", type: "checkbox", default: false }],
    outputLabel: "Hex (UTF-8 bytes)",
    run: (input, o) => { const out = bytesTo(input, 16, 2, sep(o.separator), String(o.prefix)); return o.upper ? out.toUpperCase().replace(/0X/g, "0x").replace(/\\X/g, "\\x") : out; },
  },
  "hex-to-text": {
    input: { label: "Hex bytes", example: "48 65 6c 6c 6f 20 e2 9c 93" },
    outputLabel: "Text",
    run: input => fromUtf8(fromHex(input.replace(/\\x/gi, ""))),
  },
  "text-to-octal": {
    input: { label: "Text", example: "Hello" },
    options: [separatorOption],
    outputLabel: "Octal (UTF-8 bytes)",
    run: (input, o) => bytesTo(input, 8, 3, sep(o.separator)),
  },
  "octal-to-text": {
    input: { label: "Octal bytes", example: "110 145 154 154 157" },
    outputLabel: "Text",
    run: input => fromUtf8(parseByteTokens(input, 8, 3, "octal")),
  },
  "text-to-binary": {
    input: { label: "Text", example: "Hi!" },
    options: [separatorOption],
    outputLabel: "Binary (UTF-8 bytes)",
    run: (input, o) => bytesTo(input, 2, 8, sep(o.separator)),
  },
  "binary-to-text": {
    input: { label: "Binary", example: "01001000 01101001 00100001" },
    outputLabel: "Text",
    note: "Groups of 8 bits; without separators the input is split every 8 digits.",
    run: input => fromUtf8(parseByteTokens(input, 2, 8, "binary")),
  },
  "text-to-decimal": {
    input: { label: "Text", example: "Hello" },
    options: [separatorOption, { id: "unit", label: "Values", type: "select", default: "bytes", choices: [["bytes", "UTF-8 bytes (0–255)"], ["codepoints", "Unicode code points"]] }],
    outputLabel: "Decimal",
    run: (input, o) => o.unit === "codepoints" ? Array.from(input, c => String(c.codePointAt(0))).join(sep(o.separator) || " ") : bytesTo(input, 10, 1, sep(o.separator) || " "),
  },
  "decimal-to-text": {
    input: { label: "Decimal values", example: "72 101 108 108 111" },
    options: [{ id: "unit", label: "Values are", type: "select", default: "bytes", choices: [["bytes", "UTF-8 bytes (0–255)"], ["codepoints", "Unicode code points"]] }],
    outputLabel: "Text",
    run: (input, o) => {
      const tokens = input.trim().split(/[^\d]+/).filter(Boolean);
      if (tokens.length === 0) throw new Error("Enter some decimal numbers.");
      if (o.unit !== "codepoints") return fromUtf8(parseByteTokens(tokens.join(" "), 10, 3, "decimal"));
      return tokens.map(t => { const n = Number(t); if (n > 0x10ffff) throw new Error(`${t} is beyond the last Unicode code point.`); return String.fromCodePoint(n); }).join("");
    },
  },
  "utf8-byte-inspector": {
    input: { label: "Text", example: "Aé€😀" },
    outputLabel: "Character breakdown",
    run: input => utf8Inspector(input),
  },
  "text-to-utf16": {
    input: { label: "Text", example: "Hi 😀" },
    options: [{ id: "endian", label: "Byte order", type: "select", default: "be", choices: [["be", "Big-endian (UTF-16BE)"], ["le", "Little-endian (UTF-16LE)"]] }, { id: "bom", label: "Add byte order mark", type: "checkbox", default: false }, separatorOption],
    outputLabel: "UTF-16 bytes (hex)",
    run: (input, o) => toHex(utf16Units((o.bom ? "﻿" : "") + input, o.endian === "le"), sep(o.separator)),
  },
  "utf16-to-text": {
    input: { label: "UTF-16 bytes (hex)", example: "00 48 00 69 00 20 d8 3d de 00" },
    options: [{ id: "endian", label: "Byte order (a BOM overrides this)", type: "select", default: "be", choices: [["be", "Big-endian"], ["le", "Little-endian"]] }],
    outputLabel: "Text",
    run: (input, o) => decodeUtf16(fromHex(input), String(o.endian)),
  },
  "unicode-escape": {
    input: { label: "Text", example: "Café ☕ 😀" },
    options: [{ id: "style", label: "Escape style", type: "select", default: "js", choices: [["js", "\\uXXXX (JavaScript, JSON, Java)"], ["es6", "\\u{X} (modern JavaScript)"], ["python", "\\uXXXX / \\UXXXXXXXX (Python)"]] }, { id: "onlyNonAscii", label: "Escape only non-ASCII", type: "checkbox", default: true }],
    outputLabel: "Escaped",
    run: (input, o) => unicodeEscape(input, String(o.style), Boolean(o.onlyNonAscii)),
  },
  "unicode-unescape": {
    input: { label: "Escaped text", example: "Caf\\u00E9 \\u2615 \\uD83D\\uDE00 \\u{1F680}" },
    outputLabel: "Text",
    note: "Understands \\uXXXX, \\u{X…}, \\UXXXXXXXX and \\xXX.",
    run: input => unicodeUnescape(input),
  },
  "text-to-code-points": {
    input: { label: "Text", example: "A€😀" },
    options: [{ id: "format", label: "Format", type: "select", default: "U+", choices: [["U+", "U+20AC"], ["0x", "0x20AC"], ["plain", "20AC"]] }],
    outputLabel: "Code points",
    run: (input, o) => Array.from(input, c => { const hex = (c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0"); return o.format === "plain" ? hex : `${o.format}${hex}`; }).join(" "),
  },
  "code-points-to-text": {
    input: { label: "Code points (hex)", example: "U+0041 U+20AC U+1F600" },
    outputLabel: "Text",
    run: input => {
      const tokens = input.replace(/U\+|0x/gi, " ").trim().split(/[\s,]+/).filter(Boolean);
      if (tokens.length === 0) throw new Error("Enter code points such as U+0041.");
      return tokens.map(t => { const n = parseInt(t, 16); if (!/^[0-9a-f]+$/i.test(t) || n > 0x10ffff) throw new Error(`"${t}" is not a valid code point.`); return String.fromCodePoint(n); }).join("");
    },
  },
  "data-uri-encode": {
    input: { label: "Text content", example: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\"><circle cx=\"5\" cy=\"5\" r=\"4\"/></svg>" },
    options: [{ id: "mime", label: "MIME type", type: "text", default: "image/svg+xml" }, { id: "encoding", label: "Encoding", type: "select", default: "base64", choices: [["base64", "Base64"], ["percent", "Percent-encoding"]] }],
    outputLabel: "Data URI",
    run: (input, o) => {
      const mime = String(o.mime).trim() || "text/plain";
      if (!/^[\w.+-]+\/[\w.+-]+$/.test(mime)) throw new Error("Enter a MIME type like text/plain or image/svg+xml.");
      return o.encoding === "percent" ? `data:${mime};charset=utf-8,${encodeURIComponent(input)}` : `data:${mime};base64,${toBase64(utf8(input))}`;
    },
  },
  "data-uri-decode": {
    input: { label: "Data URI", example: "data:text/plain;charset=utf-8;base64,SGVsbG8sIHdvcmxkIQ==" },
    outputLabel: "Decoded",
    run: input => parseDataUri(input),
  },
  "rot13": {
    input: { label: "Text", example: "Why did the chicken cross the road?" },
    outputLabel: "ROT13",
    note: "ROT13 is its own inverse: run it again to decode. It hides text, it does not protect it.",
    run: input => rotate(input, [[65, 26], [97, 26]], 13),
  },
  "rot47": {
    input: { label: "Text", example: "Meet me at 10:30 @ the café!" },
    outputLabel: "ROT47",
    note: "Rotates the 94 printable ASCII characters (! to ~) by 47. Run again to decode.",
    run: input => rotate(input, [[33, 94]], 47),
  },
  "rot18": {
    input: { label: "Text", example: "Call me at 555-0123, Bob." },
    outputLabel: "ROT18",
    note: "ROT13 on letters plus ROT5 on digits. Run again to decode.",
    run: input => rotate(rotate(input, [[65, 26], [97, 26]], 13), [[48, 10]], 5),
  },
  "string-reverse": {
    input: { label: "Text", example: "Hello, 🌍 world! 👋🏽" },
    options: [{ id: "unit", label: "Reverse", type: "select", default: "chars", choices: [["chars", "Characters (keeps emoji intact)"], ["words", "Word order"], ["lines", "Line order"]] }],
    outputLabel: "Reversed",
    run: (input, o) => {
      if (o.unit === "words") return input.split(/(\s+)/).reverse().join("");
      if (o.unit === "lines") return input.split(/\r?\n/).reverse().join("\n");
      return graphemes(input).reverse().join("");
    },
  },
  "a1z26-encode": {
    input: { label: "Text", example: "Hello World" },
    outputLabel: "A1Z26 numbers",
    note: "Letters become 1–26, separated by dashes; words by spaces. Other characters are dropped.",
    run: input => { const out = a1z26Encode(input); if (!out) throw new Error("Enter some letters A–Z."); return out; },
  },
  "a1z26-decode": {
    input: { label: "Numbers", example: "8-5-12-12-15 23-15-18-12-4" },
    outputLabel: "Text",
    run: input => a1z26Decode(input),
  },
  "js-string-escape": {
    input: { label: "Raw text", example: "He said \"hi\"\n\tand left — 😀" },
    options: [{ id: "quote", label: "Quote to escape", type: "select", default: "\"", choices: [["\"", "Double quote"], ["'", "Single quote"], ["`", "Backtick"]] }, { id: "unicode", label: "Escape non-ASCII as \\uXXXX", type: "checkbox", default: false }],
    outputLabel: "Escaped string body",
    run: (input, o) => jsEscape(input, String(o.quote), Boolean(o.unicode)),
  },
  "js-string-unescape": {
    input: { label: "Escaped string body", example: "He said \\\"hi\\\"\\n\\tand left \\u2014 \\u{1F600}" },
    outputLabel: "Raw text",
    run: input => jsUnescape(input),
  },
  "json-string-escape": {
    input: { label: "Raw text", example: "Line 1\nLine 2\t\"quoted\" \\ path" },
    options: [{ id: "quotes", label: "Include surrounding quotes", type: "checkbox", default: true }],
    outputLabel: "JSON string",
    run: (input, o) => { const out = JSON.stringify(input); return o.quotes ? out : out.slice(1, -1); },
  },
  "json-string-unescape": {
    input: { label: "JSON string (with or without quotes)", example: "\"Line 1\\nLine 2\\t\\\"quoted\\\" \\\\ path\"" },
    outputLabel: "Raw text",
    run: input => {
      const trimmed = input.trim();
      const quoted = trimmed.length >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"") ? trimmed : `"${trimmed}"`;
      const value: unknown = safe(() => JSON.parse(quoted), "This is not a valid JSON string. Check for unescaped quotes or bad backslash escapes.");
      return String(value);
    },
  },
  "mojibake-fixer": {
    input: { label: "Garbled text", example: "CafÃ© â€” naÃ¯ve rÃ©sumÃ©" },
    outputLabel: "Repaired text",
    note: "Fixes UTF-8 text that was wrongly shown as Windows-1252 / Latin-1 (Ã© instead of é). It reverses one round of mis-decoding.",
    run: input => fixMojibake(input),
  },
  "charset-decoder": {
    input: { label: "Bytes (hex)", example: "43 61 66 e9 20 80 20 31 30" },
    options: [{ id: "charset", label: "Character set", type: "select", default: "windows-1252", choices: CHARSETS }],
    outputLabel: "Decoded text",
    note: "Uses the browser's TextDecoder. Bytes that are invalid in the chosen set show as �.",
    run: (input, o) => new TextDecoder(String(o.charset)).decode(fromHex(input)),
  },
};
