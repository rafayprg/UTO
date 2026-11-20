// Radix encodings: Base32 (RFC 4648 standard and extended-hex), Base58 (Bitcoin alphabet),
// Ascii85 (Adobe), Base62, Base45 (RFC 9285) and Base36 integers.
import type { OptionField, TextOp } from "./types";
import { fromUtf8, utf8 } from "./crypto-text-bytes.ts";

const B32_STD = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const B32_HEX = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

export function base32Encode(bytes: Uint8Array, alphabet: string, padding: boolean): string {
  let out = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) out += alphabet[(buffer << (5 - bits)) & 31];
  return padding ? out + "=".repeat((8 - (out.length % 8)) % 8) : out;
}

export function base32Decode(text: string, alphabet: string): Uint8Array {
  const clean = text.replace(/\s+/g, "").toUpperCase().replace(/=+$/, "");
  if ([1, 3, 6].includes(clean.length % 8)) throw new Error("This Base32 text has an impossible length. Check for missing or extra characters.");
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error(`"${char}" is not a valid character in this Base32 alphabet.`);
    buffer = ((buffer << 5) | value) & 0xfff;
    bits += 5;
    if (bits >= 8) {
      out.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

/** Big-number radix conversion that keeps leading zero bytes as leading zero digits. */
export function radixEncode(bytes: Uint8Array, alphabet: string): string {
  const base = BigInt(alphabet.length);
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  let value = BigInt(0);
  for (const byte of bytes.subarray(zeros)) value = (value << BigInt(8)) | BigInt(byte);
  let out = "";
  while (value > BigInt(0)) {
    out = alphabet[Number(value % base)] + out;
    value /= base;
  }
  return alphabet[0].repeat(zeros) + out;
}

export function radixDecode(text: string, alphabet: string, name: string): Uint8Array {
  const clean = text.replace(/\s+/g, "");
  const base = BigInt(alphabet.length);
  let zeros = 0;
  while (zeros < clean.length && clean[zeros] === alphabet[0]) zeros += 1;
  let value = BigInt(0);
  for (const char of clean.slice(zeros)) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) throw new Error(`"${char}" is not a valid ${name} character.`);
    value = value * base + BigInt(digit);
  }
  const bytes: number[] = [];
  while (value > BigInt(0)) {
    bytes.unshift(Number(value & BigInt(255)));
    value >>= BigInt(8);
  }
  return Uint8Array.from([...new Array<number>(zeros).fill(0), ...bytes]);
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export function ascii85Encode(bytes: Uint8Array, delimiters: boolean): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 4) {
    const chunk = bytes.subarray(i, i + 4);
    const group = new Uint8Array(4);
    group.set(chunk);
    let value = ((group[0] << 24) | (group[1] << 16) | (group[2] << 8) | group[3]) >>> 0;
    if (value === 0 && chunk.length === 4) {
      out += "z";
      continue;
    }
    const digits = new Array<string>(5);
    for (let d = 4; d >= 0; d -= 1) {
      digits[d] = String.fromCharCode(33 + (value % 85));
      value = Math.floor(value / 85);
    }
    out += digits.slice(0, chunk.length + 1).join("");
  }
  return delimiters ? `<~${out}~>` : out;
}

export function ascii85Decode(text: string): Uint8Array {
  let clean = text.replace(/\s+/g, "");
  if (clean.startsWith("<~")) clean = clean.slice(2);
  if (clean.endsWith("~>")) clean = clean.slice(0, -2);
  const out: number[] = [];
  let group: number[] = [];
  const flush = (count: number): void => {
    let value = 0;
    for (const digit of group) value = value * 85 + digit;
    if (value > 0xffffffff) throw new Error("This Ascii85 group decodes to a value larger than 32 bits.");
    const bytes = [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    out.push(...bytes.slice(0, count));
    group = [];
  };
  for (const char of clean) {
    if (char === "z" && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    const code = char.charCodeAt(0);
    if (code < 33 || code > 117) throw new Error(`"${char}" is not a valid Ascii85 character (allowed: ! to u, and z).`);
    group.push(code - 33);
    if (group.length === 5) flush(4);
  }
  if (group.length === 1) throw new Error("The last Ascii85 group has a single character, which is not valid.");
  if (group.length > 0) {
    const count = group.length - 1;
    while (group.length < 5) group.push(84);
    flush(count);
  }
  return Uint8Array.from(out);
}

const B45 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

export function base45Encode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      let n = bytes[i] * 256 + bytes[i + 1];
      for (let k = 0; k < 3; k += 1) {
        out += B45[n % 45];
        n = Math.floor(n / 45);
      }
    } else {
      out += B45[bytes[i] % 45] + B45[Math.floor(bytes[i] / 45)];
    }
  }
  return out;
}

export function base45Decode(text: string): Uint8Array {
  const clean = text.replace(/[\r\n]+/g, "");
  if (clean.length % 3 === 1) throw new Error("Base45 text length must be a multiple of 3, or one more pair of 2 characters at the end.");
  const out: number[] = [];
  const digit = (char: string): number => {
    const value = B45.indexOf(char);
    if (value < 0) throw new Error(`"${char}" is not a valid Base45 character.`);
    return value;
  };
  for (let i = 0; i < clean.length; i += 3) {
    const chunk = clean.slice(i, i + 3);
    const n = chunk.split("").reduce((sum, char, k) => sum + digit(char) * 45 ** k, 0);
    if (chunk.length === 3) {
      if (n > 65535) throw new Error(`The Base45 group "${chunk}" is out of range.`);
      out.push(n >> 8, n & 255);
    } else {
      if (n > 255) throw new Error(`The Base45 group "${chunk}" is out of range.`);
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}

const paddingOption: OptionField = { id: "padding", label: "Add = padding", type: "checkbox", default: true };

function encodeOp(label: string, example: string, encode: (bytes: Uint8Array, options: Record<string, unknown>) => string, options: OptionField[] = [], note?: string): TextOp {
  return {
    input: { label: "Text to encode", example },
    options,
    outputLabel: label,
    note,
    run: (input, values) => encode(utf8(input), values),
  };
}

function decodeOp(label: string, example: string, decode: (text: string) => Uint8Array, note?: string): TextOp {
  return {
    input: { label: `${label} to decode`, example },
    outputLabel: "Decoded text",
    note,
    run: input => fromUtf8(decode(input)),
  };
}

function base36Lines(input: string, convert: (line: string) => string): string {
  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Enter at least one value.");
  return lines.map(convert).join("\n");
}

export const baseOps: Record<string, TextOp> = {
  "base32-encode": encodeOp("Base32", "Hello, world!", (bytes, o) => base32Encode(bytes, B32_STD, Boolean(o.padding)), [paddingOption], "RFC 4648 Base32 alphabet A–Z and 2–7."),
  "base32-decode": decodeOp("Base32", "JBSWY3DPFQQHO33SNRSCC===", text => base32Decode(text, B32_STD), "Case-insensitive; padding and spaces are optional."),
  "base32hex-encode": encodeOp("Base32hex", "Hello, world!", (bytes, o) => base32Encode(bytes, B32_HEX, Boolean(o.padding)), [paddingOption], "RFC 4648 §7 \"extended hex\" alphabet 0–9 and A–V, which keeps sort order."),
  "base32hex-decode": decodeOp("Base32hex", "91IMOR3F5GG7ERRIDHI22===", text => base32Decode(text, B32_HEX)),
  "base58-encode": encodeOp("Base58", "Hello, world!", bytes => radixEncode(bytes, B58), [], "Bitcoin alphabet (no 0, O, I or l). Plain Base58, without the Base58Check checksum."),
  "base58-decode": decodeOp("Base58", "72k1xXWG59wUsYv7h2", text => radixDecode(text, B58, "Base58")),
  "ascii85-encode": encodeOp("Ascii85", "Hello, world!", (bytes, o) => ascii85Encode(bytes, Boolean(o.delimiters)), [{ id: "delimiters", label: "Wrap in <~ ~> (Adobe style)", type: "checkbox", default: true }], "Adobe Ascii85 (Base85). Four zero bytes become \"z\"."),
  "ascii85-decode": decodeOp("Ascii85", "<~87cURD_*#TDfTZ)+T~>", ascii85Decode),
  "base62-encode": encodeOp("Base62", "Hello, world!", bytes => radixEncode(bytes, B62), [], "Alphabet 0–9, A–Z, a–z. Bytes are read as one big number; leading zero bytes become leading \"0\" digits."),
  "base62-decode": decodeOp("Base62", "1wJfrzvdbthTq5ANZB", text => radixDecode(text, B62, "Base62")),
  "base45-encode": encodeOp("Base45", "Hello!!", bytes => base45Encode(bytes), [], "RFC 9285 Base45, as used in QR-code health certificates."),
  "base45-decode": decodeOp("Base45", "%69 VD92EX0", base45Decode),
  "base36-encode": {
    input: { label: "Whole numbers (decimal, one per line)", example: "1234567890\n-255\n36" },
    outputLabel: "Base36",
    options: [{ id: "upper", label: "Uppercase letters", type: "checkbox", default: false }],
    note: "Converts integers of any size (BigInt), not text. Digits 0–9 then a–z.",
    run: (input, o) => base36Lines(input, line => {
      if (!/^-?\d+$/.test(line)) throw new Error(`"${line}" is not a whole decimal number.`);
      const value = BigInt(line).toString(36);
      return o.upper ? value.toUpperCase() : value;
    }),
  },
  "base36-decode": {
    input: { label: "Base36 numbers (one per line)", example: "kf12oi\n-73\n10" },
    outputLabel: "Decimal",
    note: "Case-insensitive. Converts integers of any size (BigInt).",
    run: input => base36Lines(input, line => {
      const negative = line.startsWith("-");
      const digits = (negative ? line.slice(1) : line).toLowerCase();
      if (!/^[0-9a-z]+$/.test(digits)) throw new Error(`"${line}" is not a valid Base36 number.`);
      const value = digits.split("").reduce((sum, char) => sum * BigInt(36) + BigInt(parseInt(char, 36)), BigInt(0));
      return (negative && value > BigInt(0) ? "-" : "") + value.toString(10);
    }),
  },
};
