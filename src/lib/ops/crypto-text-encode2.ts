// Line and symbol encodings: Morse, NATO phonetic, Braille, quoted-printable, uuencode,
// hex dumps, Punycode (RFC 3492) and gzip / deflate via CompressionStream.
import type { OptionField, TextOp } from "./types";
import { buf, fromBase64, fromHex, fromUtf8, toBase64, toHex, utf8 } from "./crypto-text-bytes.ts";

// ---- Morse (ITU-R M.1677-1) ----
const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...",
  ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", "\"": ".-..-.", "$": "...-..-", "@": ".--.-.",
};
const MORSE_REVERSE = new Map(Object.entries(MORSE).map(([char, code]): [string, string] => [code, char]));

function morseEncode(input: string): string {
  const words = input.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error("Enter some text to convert.");
  return words.map(word => Array.from(word, char => {
    const code = MORSE[char];
    if (!code) throw new Error(`"${char}" has no Morse code. Supported: letters, digits and . , ? ' ! / ( ) & : ; = + - _ " $ @`);
    return code;
  }).join(" ")).join(" / ");
}

function morseDecode(input: string): string {
  const normal = input.trim().replace(/[•·∙]/g, ".").replace(/[−–—_]/g, "-");
  if (!normal) throw new Error("Enter some Morse code.");
  return normal.split(/\s*\/\s*|\s{3,}|\n+/).map(word => word.trim().split(/\s+/).filter(Boolean).map(code => {
    const char = MORSE_REVERSE.get(code);
    if (!char) throw new Error(`"${code}" is not a known Morse sequence.`);
    return char;
  }).join("")).join(" ");
}

// ---- NATO / ICAO phonetic alphabet ----
const NATO = "Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu".split(" ");
const DIGIT_WORDS = "Zero One Two Three Four Five Six Seven Eight Nine".split(" ");
const NATO_ALIASES: Record<string, string> = { alpha: "A", juliet: "J", xray: "X", "x-ray": "X", niner: "9", tree: "3", fife: "5", whisky: "W" };

function natoEncode(input: string): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) throw new Error("Enter some text to spell.");
  return words.map(word => Array.from(word.toUpperCase(), char => {
    if (char >= "A" && char <= "Z") return NATO[char.charCodeAt(0) - 65];
    if (char >= "0" && char <= "9") return DIGIT_WORDS[Number(char)];
    return char;
  }).join(" ")).join(" / ");
}

function natoDecode(input: string): string {
  const lookup = new Map<string, string>([
    ...NATO.map((word, i): [string, string] => [word.toLowerCase(), String.fromCharCode(65 + i)]),
    ...DIGIT_WORDS.map((word, i): [string, string] => [word.toLowerCase(), String(i)]),
    ...Object.entries(NATO_ALIASES),
  ]);
  return input.trim().split(/\s*\/\s*|\n+/).map(group => group.split(/[\s,]+/).filter(Boolean).map(word => {
    const value = lookup.get(word.toLowerCase());
    if (value) return value;
    if (word.length === 1) return word;
    throw new Error(`"${word}" is not a NATO phonetic word.`);
  }).join("")).join(" ");
}

// ---- Braille (uncontracted English, Unicode patterns) ----
const BRAILLE_LETTERS = [1, 12, 14, 145, 15, 124, 1245, 125, 24, 245, 13, 123, 134, 1345, 135, 1234, 12345, 1235, 234, 2345, 136, 1236, 2456, 1346, 13456, 1356];
const BRAILLE_PUNCT: Record<string, number> = { ",": 2, ";": 23, ":": 25, ".": 256, "!": 235, "?": 236, "'": 3, "-": 36 };
const cell = (dots: number): string => String.fromCharCode(0x2800 + String(dots).split("").reduce((sum, d) => sum | (1 << (Number(d) - 1)), 0));
const NUMBER_SIGN = cell(3456);
const CAPITAL_SIGN = cell(6);

function brailleEncode(input: string): string {
  let out = "";
  let inNumber = false;
  for (const char of input) {
    const lower = char.toLowerCase();
    if (char >= "0" && char <= "9") {
      if (!inNumber) out += NUMBER_SIGN;
      inNumber = true;
      out += cell(BRAILLE_LETTERS[(Number(char) + 9) % 10]);
      continue;
    }
    inNumber = false;
    if (lower >= "a" && lower <= "z") out += (char !== lower ? CAPITAL_SIGN : "") + cell(BRAILLE_LETTERS[lower.charCodeAt(0) - 97]);
    else if (BRAILLE_PUNCT[char]) out += cell(BRAILLE_PUNCT[char]);
    else if (char === " " || char === "\n") out += char === " " ? "⠀" : "\n";
    else throw new Error(`"${char}" is not supported. Use letters, digits, spaces and , ; : . ! ? ' -`);
  }
  return out;
}

function brailleDecode(input: string): string {
  const letters = new Map(BRAILLE_LETTERS.map((dots, i): [string, number] => [cell(dots), i]));
  const punct = new Map(Object.entries(BRAILLE_PUNCT).map(([char, dots]): [string, string] => [cell(dots), char]));
  let out = "";
  let inNumber = false;
  let capital = false;
  for (const char of input) {
    if (char === NUMBER_SIGN) { inNumber = true; continue; }
    if (char === CAPITAL_SIGN) { capital = true; continue; }
    const index = letters.get(char);
    if (index !== undefined) {
      if (inNumber && index < 10) out += String((index + 1) % 10);
      else { out += capital ? String.fromCharCode(65 + index) : String.fromCharCode(97 + index); inNumber = false; }
      capital = false;
    } else if (char === "⠀" || char === " " || char === "\n") { out += char === "\n" ? "\n" : " "; inNumber = false; }
    else if (punct.has(char)) { out += punct.get(char); inNumber = false; }
    else throw new Error(`"${char}" is not a supported Grade 1 braille cell.`);
  }
  return out;
}

// ---- Quoted-printable (RFC 2045 §6.7) ----
function qpEncode(input: string): string {
  return input.split(/\r?\n/).map(line => {
    const bytes = utf8(line);
    const tokens = Array.from(bytes, (byte, i) => {
      const isLast = i === bytes.length - 1;
      if ((byte === 32 || byte === 9) && !isLast) return String.fromCharCode(byte);
      if (byte >= 33 && byte <= 126 && byte !== 61) return String.fromCharCode(byte);
      return `=${byte.toString(16).toUpperCase().padStart(2, "0")}`;
    });
    const lines: string[] = [];
    let current = "";
    for (const token of tokens) {
      if (current.length + token.length > 75) { lines.push(`${current}=`); current = ""; }
      current += token;
    }
    return [...lines, current].join("\r\n");
  }).join("\r\n");
}

function qpDecode(input: string): string {
  const joined = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < joined.length; i += 1) {
    if (joined[i] === "=") {
      const hex = joined.slice(i + 1, i + 3);
      if (!/^[0-9A-Fa-f]{2}$/.test(hex)) throw new Error(`"=${hex}" is not a valid quoted-printable escape.`);
      bytes.push(parseInt(hex, 16));
      i += 2;
    } else {
      bytes.push(...utf8(joined[i]));
    }
  }
  return fromUtf8(Uint8Array.from(bytes));
}

// ---- uuencode ----
const uuChar = (value: number): string => (value === 0 ? "`" : String.fromCharCode(32 + value));

function uuencode(bytes: Uint8Array, name: string, mode: string): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 45) {
    const chunk = bytes.subarray(i, i + 45);
    let line = uuChar(chunk.length);
    for (let j = 0; j < chunk.length; j += 3) {
      const [a, b = 0, c = 0] = chunk.subarray(j, j + 3);
      line += uuChar(a >> 2) + uuChar(((a & 3) << 4) | (b >> 4)) + uuChar(((b & 15) << 2) | (c >> 6)) + uuChar(c & 63);
    }
    lines.push(line);
  }
  return [`begin ${mode} ${name}`, ...lines, "`", "end"].join("\n");
}

function uudecode(input: string): Uint8Array {
  const lines = input.split(/\r?\n/);
  const start = lines.findIndex(line => /^begin \d{3,4} /.test(line));
  const body = start >= 0 ? lines.slice(start + 1) : lines;
  const out: number[] = [];
  const value = (char: string | undefined): number => (char === undefined ? 0 : (char.charCodeAt(0) - 32) & 63);
  for (const line of body) {
    if (line.trim() === "end") break;
    if (!line) continue;
    const length = value(line[0]);
    if (length === 0) continue;
    const bytes: number[] = [];
    for (let j = 1; bytes.length < length; j += 4) {
      if (j >= line.length) throw new Error("A uuencoded line is shorter than its length character says.");
      const [a, b, c, d] = [line[j], line[j + 1], line[j + 2], line[j + 3]].map(value);
      bytes.push((a << 2) | (b >> 4), ((b & 15) << 4) | (c >> 2), ((c & 3) << 6) | d);
    }
    out.push(...bytes.slice(0, length));
  }
  return Uint8Array.from(out);
}

// ---- Hex dump ----
function hexDump(bytes: Uint8Array, width: number): string {
  const lines: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += width) {
    const row = bytes.subarray(offset, offset + width);
    const hex = Array.from(row, (b, i) => b.toString(16).padStart(2, "0") + (i === width / 2 - 1 ? " " : "")).join(" ");
    const ascii = Array.from(row, b => (b >= 32 && b < 127 ? String.fromCharCode(b) : ".")).join("");
    const fullWidth = width * 3 + (width >= 2 ? 1 : 0) - 1;
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(fullWidth)}  |${ascii}|`);
  }
  lines.push(bytes.length.toString(16).padStart(8, "0"));
  return lines.join("\n");
}

function hexDumpReverse(input: string): Uint8Array {
  const out: number[] = [];
  for (const raw of input.split(/\r?\n/)) {
    let line = raw.includes("|") ? raw.slice(0, raw.indexOf("|")) : raw;
    const offset = /^\s*[0-9a-fA-F]{4,}:?\s+/.exec(line);
    if (offset && /:\s/.test(offset[0])) line = line.slice(offset[0].length).split(/\s{2,}/)[0];
    else if (offset) line = line.slice(offset[0].length);
    else if (/^\s*[0-9a-fA-F]{8}\s*$/.test(line)) continue;
    const hex = line.replace(/\s+/g, "");
    if (hex) out.push(...fromHex(hex));
  }
  if (out.length === 0) throw new Error("No hex bytes were found. Paste output from hexdump -C or xxd.");
  return Uint8Array.from(out);
}

// ---- Punycode (RFC 3492) ----
const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700, INITIAL_BIAS = 72, INITIAL_N = 128;
const MAX_INT = 0x7fffffff;

function adapt(delta: number, points: number, first: boolean): number {
  let d = first ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / points);
  let k = 0;
  while (d > ((BASE - TMIN) * TMAX) >> 1) {
    d = Math.floor(d / (BASE - TMIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - TMIN + 1) * d) / (d + SKEW));
}
const threshold = (k: number, bias: number): number => (k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias);
const digitChar = (d: number): string => String.fromCharCode(d < 26 ? 97 + d : 22 + d);

export function punycodeEncode(input: string): string {
  const points = Array.from(input, c => c.codePointAt(0) ?? 0);
  let output = points.filter(p => p < 128).map(p => String.fromCharCode(p)).join("");
  const basic = output.length;
  let handled = basic;
  if (basic > 0) output += "-";
  let n = INITIAL_N, delta = 0, bias = INITIAL_BIAS;
  while (handled < points.length) {
    const m = Math.min(...points.filter(p => p >= n));
    if (m - n > Math.floor((MAX_INT - delta) / (handled + 1))) throw new Error("This label is too long to encode.");
    delta += (m - n) * (handled + 1);
    n = m;
    for (const p of points) {
      if (p < n) delta += 1;
      if (p !== n) continue;
      let q = delta;
      for (let k = BASE; ; k += BASE) {
        const t = threshold(k, bias);
        if (q < t) break;
        output += digitChar(t + ((q - t) % (BASE - t)));
        q = Math.floor((q - t) / (BASE - t));
      }
      output += digitChar(q);
      bias = adapt(delta, handled + 1, handled === basic);
      delta = 0;
      handled += 1;
    }
    delta += 1;
    n += 1;
  }
  return output;
}

function digitValue(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 22;
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;
  throw new Error(`"${char}" is not a valid Punycode digit.`);
}

export function punycodeDecode(input: string): string {
  const dash = input.lastIndexOf("-");
  const output = Array.from(dash > 0 ? input.slice(0, dash) : "", c => {
    const code = c.charCodeAt(0);
    if (code >= 128) throw new Error("Punycode must be plain ASCII before decoding.");
    return code;
  });
  let n = INITIAL_N, i = 0, bias = INITIAL_BIAS;
  for (let pos = dash > 0 ? dash + 1 : 0; pos < input.length;) {
    const oldi = i;
    let w = 1;
    for (let k = BASE; ; k += BASE) {
      if (pos >= input.length) throw new Error("This Punycode ends in the middle of a number.");
      const digit = digitValue(input[pos++]);
      i += digit * w;
      const t = threshold(k, bias);
      if (digit < t) break;
      w *= BASE - t;
      if (i > MAX_INT || w > MAX_INT) throw new Error("This Punycode overflows.");
    }
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    if (n > 0x10ffff) throw new Error("This Punycode decodes past the last Unicode code point.");
    i %= output.length + 1;
    output.splice(i, 0, n);
    i += 1;
  }
  return String.fromCodePoint(...output);
}

function mapLabels(input: string, convert: (label: string) => string): string {
  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Enter a domain name or label.");
  return lines.map(line => line.split(/[.。．｡]/).map(convert).join(".")).join("\n");
}

// ---- Compression ----
type Format = "gzip" | "deflate" | "deflate-raw";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const response = new Response(new Blob([buf(bytes)]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

const bytesFormat: OptionField = { id: "format", label: "Compressed data as", type: "select", default: "base64", choices: [["base64", "Base64"], ["hex", "Hex"]] };

function compressOp(format: Format, name: string): TextOp {
  return {
    input: { label: "Text to compress", example: "Hello, world! Hello, world! Hello, world!" },
    options: [bytesFormat],
    outputLabel: `${name} data`,
    note: `Uses the browser's CompressionStream("${format}"). Output size depends on the browser's compressor settings.`,
    async run(input, o) {
      const out = await pipe(utf8(input), new CompressionStream(format));
      const encoded = o.format === "hex" ? toHex(out) : toBase64(out);
      return `${encoded}\n\n(${utf8(input).length} bytes in, ${out.length} bytes out)`;
    },
  };
}

function decompressOp(format: Format, name: string, example: string): TextOp {
  return {
    input: { label: `${name} data`, example },
    options: [bytesFormat],
    outputLabel: "Decompressed text",
    async run(input, o) {
      const bytes = o.format === "hex" ? fromHex(input) : fromBase64(input.split("\n\n(")[0]);
      let out: Uint8Array;
      try {
        out = await pipe(bytes, new DecompressionStream(format));
      } catch {
        throw new Error(`This is not valid ${name} data. Check the format (Base64 or hex) and that nothing was cut off.`);
      }
      return fromUtf8(out);
    },
  };
}

export const encode2Ops: Record<string, TextOp> = {
  "morse-code-encode": { input: { label: "Text", example: "SOS Help needed at 5pm" }, outputLabel: "Morse code", note: "Letters are separated by spaces and words by \" / \".", run: morseEncode },
  "morse-code-decode": { input: { label: "Morse code", example: "... --- ... / .... . .-.. .--. / -. . . -.. . -.. / .- - / ..... .--. --" }, outputLabel: "Text", note: "Separate letters with spaces and words with / or three spaces.", run: morseDecode },
  "nato-phonetic-encode": { input: { label: "Text", example: "AB12 CDX" }, outputLabel: "NATO phonetic", note: "ICAO/NATO spelling alphabet. Digits use plain English words.", run: natoEncode },
  "nato-phonetic-decode": { input: { label: "Phonetic words", example: "Alfa Bravo One Two / Charlie Delta X-ray" }, outputLabel: "Text", note: "Also accepts Alpha, Juliet, Xray, Niner, Tree and Fife.", run: natoDecode },
  "braille-encode": { input: { label: "Text", example: "Hello World 2026!" }, outputLabel: "Braille (Unicode)", note: "Uncontracted (Grade 1) English braille with capital and number signs. For official documents use a certified transcriber.", run: brailleEncode },
  "braille-decode": { input: { label: "Unicode braille", example: "⠠⠓⠑⠇⠇⠕⠀⠠⠺⠕⠗⠇⠙" }, outputLabel: "Text", note: "Reads uncontracted (Grade 1) braille only; contractions are not expanded.", run: brailleDecode },
  "quoted-printable-encode": { input: { label: "Text", example: "Café = 3 € — a line with a trailing space " }, outputLabel: "Quoted-printable", note: "RFC 2045 quoted-printable of the UTF-8 bytes, with soft line breaks at 76 characters.", run: qpEncode },
  "quoted-printable-decode": { input: { label: "Quoted-printable", example: "Caf=C3=A9 =3D 3 =E2=82=AC =E2=80=94 a line with a trailing space=20" }, outputLabel: "Text", run: qpDecode },
  "uuencode": {
    input: { label: "Text", example: "Hello, world!" },
    options: [{ id: "name", label: "File name", type: "text", default: "message.txt" }, { id: "mode", label: "Unix mode", type: "text", default: "644" }],
    outputLabel: "uuencoded",
    run: (input, o) => {
      const mode = String(o.mode).trim();
      if (!/^[0-7]{3,4}$/.test(mode)) throw new Error("The mode must be 3 or 4 octal digits, such as 644.");
      return uuencode(utf8(input), String(o.name).trim() || "file.txt", mode);
    },
  },
  "uudecode": { input: { label: "uuencoded text", example: "begin 644 message.txt\n-2&5L;&\\L('=O<FQD(0``\n`\nend" }, outputLabel: "Decoded text", run: input => fromUtf8(uudecode(input)) },
  "hex-dump": {
    input: { label: "Text", example: "Hello, world!\nLocal tools never upload your data." },
    options: [{ id: "width", label: "Bytes per line", type: "select", default: "16", choices: [["8", "8"], ["16", "16"], ["32", "32"]] }],
    outputLabel: "Hex dump (hexdump -C style)",
    run: (input, o) => hexDump(utf8(input), Number(o.width)),
  },
  "hex-dump-to-text": {
    input: { label: "Hex dump", example: "00000000  48 65 6c 6c 6f 2c 20 77  6f 72 6c 64 21 0a        |Hello, world!.|\n0000000e" },
    options: [{ id: "output", label: "Output", type: "select", default: "text", choices: [["text", "UTF-8 text"], ["hex", "Plain hex"]] }],
    outputLabel: "Recovered data",
    note: "Reads hexdump -C, xxd and plain hex lines.",
    run: (input, o) => { const bytes = hexDumpReverse(input); return o.output === "hex" ? toHex(bytes) : fromUtf8(bytes); },
  },
  "punycode-encode": {
    input: { label: "Domain or text", example: "münchen.de\nbücher.example\n日本語.jp" },
    options: [{ id: "mode", label: "Mode", type: "select", default: "domain", choices: [["domain", "Domain names (adds xn-- to non-ASCII labels)"], ["raw", "Raw Punycode (RFC 3492 only)"]] }],
    outputLabel: "Punycode / ASCII",
    note: "RFC 3492 Punycode per label. Domain mode lowercases labels but does not apply the full UTS #46 mapping.",
    run: (input, o) => o.mode === "raw"
      ? input.split(/\r?\n/).filter(Boolean).map(punycodeEncode).join("\n")
      : mapLabels(input, label => { const lower = label.toLowerCase(); return /^[\x00-\x7f]*$/.test(lower) ? lower : `xn--${punycodeEncode(lower)}`; }),
  },
  "punycode-decode": {
    input: { label: "Punycode domain or text", example: "xn--mnchen-3ya.de\nxn--bcher-kva.example\nxn--wgv71a119e.jp" },
    options: [{ id: "mode", label: "Mode", type: "select", default: "domain", choices: [["domain", "Domain names (xn-- labels)"], ["raw", "Raw Punycode (RFC 3492 only)"]] }],
    outputLabel: "Unicode",
    run: (input, o) => o.mode === "raw"
      ? input.split(/\r?\n/).filter(Boolean).map(line => punycodeDecode(line.trim())).join("\n")
      : mapLabels(input, label => (/^xn--/i.test(label) ? punycodeDecode(label.slice(4).toLowerCase()) : label)),
  },
  "gzip-compress": compressOp("gzip", "Gzip"),
  "gzip-decompress": decompressOp("gzip", "Gzip", "H4sIAAAAAAAACvNIzcnJ11Eozy/KSVFU8MDNAwC3BL8gKQAAAA=="),
  "zlib-deflate-compress": compressOp("deflate", "Zlib (deflate)"),
  "zlib-deflate-decompress": decompressOp("deflate", "Zlib (deflate)", "eJzzSM3JyddRKM8vyklRVPDAzQMAJOUN3A=="),
  "raw-deflate-compress": compressOp("deflate-raw", "Raw deflate"),
  "raw-deflate-decompress": decompressOp("deflate-raw", "Raw deflate", "80jNycnXUSjPL8pJUVTwwM0DAA=="),
};
