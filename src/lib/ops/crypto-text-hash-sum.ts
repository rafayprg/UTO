// Non-cryptographic checksums and hashes: CRC family (Rocksoft parameter model), Adler-32,
// FNV-1 / FNV-1a (32/64-bit), MurmurHash3 x86_32 and xxHash32. Each is checked against its
// published check value in scripts/ops-tests/crypto.mjs.

export interface CrcSpec {
  width: number;
  poly: number;
  init: number;
  reflect: boolean;
  xorOut: number;
}

export const CRC_SPECS = {
  "crc32": { width: 32, poly: 0x04c11db7, init: 0xffffffff, reflect: true, xorOut: 0xffffffff },
  "crc32c": { width: 32, poly: 0x1edc6f41, init: 0xffffffff, reflect: true, xorOut: 0xffffffff },
  "crc16-arc": { width: 16, poly: 0x8005, init: 0x0000, reflect: true, xorOut: 0x0000 },
  "crc16-ccitt-false": { width: 16, poly: 0x1021, init: 0xffff, reflect: false, xorOut: 0x0000 },
  "crc16-xmodem": { width: 16, poly: 0x1021, init: 0x0000, reflect: false, xorOut: 0x0000 },
  "crc16-modbus": { width: 16, poly: 0x8005, init: 0xffff, reflect: true, xorOut: 0x0000 },
  "crc8": { width: 8, poly: 0x07, init: 0x00, reflect: false, xorOut: 0x00 },
} satisfies Record<string, CrcSpec>;

function reflectBits(value: number, width: number): number {
  let out = 0;
  for (let i = 0; i < width; i += 1) if (value & (2 ** i)) out += 2 ** (width - 1 - i);
  return out;
}

/** Bitwise CRC for widths up to 32 bits, using unsigned arithmetic. */
export function crc(data: Uint8Array, spec: CrcSpec): number {
  const { width, reflect } = spec;
  const mask = width === 32 ? 0xffffffff : (1 << width) - 1;
  if (reflect) {
    const poly = reflectBits(spec.poly, width);
    let reg = spec.init;
    for (const byte of data) {
      reg = (reg ^ byte) >>> 0;
      for (let bit = 0; bit < 8; bit += 1) reg = reg & 1 ? ((reg >>> 1) ^ poly) >>> 0 : reg >>> 1;
    }
    return ((reg ^ spec.xorOut) & mask) >>> 0;
  }
  const top = 2 ** (width - 1);
  let reg = spec.init;
  for (const byte of data) {
    reg = (reg ^ (width >= 8 ? byte * 2 ** (width - 8) : byte)) >>> 0;
    for (let bit = 0; bit < 8; bit += 1) {
      const carry = reg >= top ? 1 : 0;
      reg = ((reg - carry * top) * 2) >>> 0;
      if (carry) reg = (reg ^ spec.poly) >>> 0;
    }
  }
  return ((reg ^ spec.xorOut) & mask) >>> 0;
}

export function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return (b * 65536 + a) >>> 0;
}

export function fnv32(data: Uint8Array, variant: "1" | "1a"): number {
  let hash = 0x811c9dc5;
  for (const byte of data) {
    if (variant === "1a") hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
    if (variant === "1") hash = (hash ^ byte) >>> 0;
  }
  return hash >>> 0;
}

export function fnv64(data: Uint8Array, variant: "1" | "1a"): bigint {
  const mask = (BigInt(1) << BigInt(64)) - BigInt(1);
  const prime = BigInt("0x100000001b3");
  let hash = BigInt("0xcbf29ce484222325");
  for (const byte of data) {
    if (variant === "1a") hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
    if (variant === "1") hash ^= BigInt(byte);
  }
  return hash;
}

const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n));
const u32le = (data: Uint8Array, i: number): number => (data[i] | (data[i + 1] << 8) | (data[i + 2] << 16) | (data[i + 3] << 24)) >>> 0;

export function murmur3(data: Uint8Array, seed: number): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let h = seed >>> 0;
  const blocks = data.length - (data.length % 4);
  for (let i = 0; i < blocks; i += 4) {
    let k = Math.imul(u32le(data, i), c1);
    k = Math.imul(rotl(k, 15), c2);
    h ^= k;
    h = (Math.imul(rotl(h, 13), 5) + 0xe6546b64) | 0;
  }
  let k = 0;
  const tail = data.length % 4;
  if (tail === 3) k ^= data[blocks + 2] << 16;
  if (tail >= 2) k ^= data[blocks + 1] << 8;
  if (tail >= 1) {
    k ^= data[blocks];
    h ^= Math.imul(rotl(Math.imul(k, c1), 15), c2);
  }
  h ^= data.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const P1 = 2654435761;
const P2 = 2246822519;
const P3 = 3266489917;
const P4 = 668265263;
const P5 = 374761393;

export function xxhash32(data: Uint8Array, seed: number): number {
  const round = (acc: number, lane: number): number => Math.imul(rotl((acc + Math.imul(lane, P2)) | 0, 13), P1);
  let i = 0;
  let h: number;
  if (data.length >= 16) {
    let v1 = (seed + P1 + P2) | 0;
    let v2 = (seed + P2) | 0;
    let v3 = seed | 0;
    let v4 = (seed - P1) | 0;
    for (; i + 16 <= data.length; i += 16) {
      v1 = round(v1, u32le(data, i));
      v2 = round(v2, u32le(data, i + 4));
      v3 = round(v3, u32le(data, i + 8));
      v4 = round(v4, u32le(data, i + 12));
    }
    h = (rotl(v1, 1) + rotl(v2, 7) + rotl(v3, 12) + rotl(v4, 18)) | 0;
  } else {
    h = (seed + P5) | 0;
  }
  h = (h + data.length) | 0;
  for (; i + 4 <= data.length; i += 4) h = Math.imul(rotl((h + Math.imul(u32le(data, i), P3)) | 0, 17), P4);
  for (; i < data.length; i += 1) h = Math.imul(rotl((h + Math.imul(data[i], P5)) | 0, 11), P1);
  h ^= h >>> 15;
  h = Math.imul(h, P2);
  h ^= h >>> 13;
  h = Math.imul(h, P3);
  h ^= h >>> 16;
  return h >>> 0;
}
