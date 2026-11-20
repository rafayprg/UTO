// Keccak-f[1600] (SHA-3, SHAKE, original Keccak) and BLAKE2b / BLAKE2s, written in TypeScript.
// 64-bit lanes use BigInt. Verified against Node's OpenSSL digests and RFC 7693 vectors
// in scripts/ops-tests/crypto.mjs.
import { SHA256_IV, SHA512_IV } from "./crypto-text-hash-md.ts";

const MASK64 = (BigInt(1) << BigInt(64)) - BigInt(1);
const big = (n: number): bigint => BigInt(n);
const rotl64 = (x: bigint, n: number): bigint => (n === 0 ? x : ((x << big(n)) | (x >> big(64 - n))) & MASK64);

/** Round constants from the LFSR in FIPS 202 §3.2.5. */
function roundConstants(): bigint[] {
  let lfsr = 1;
  const bit = (): number => {
    const out = lfsr & 1;
    lfsr = lfsr & 0x80 ? ((lfsr << 1) ^ 0x71) & 0xff : (lfsr << 1) & 0xff;
    return out;
  };
  return Array.from({ length: 24 }, () => {
    let rc = BigInt(0);
    for (let j = 0; j < 7; j += 1) if (bit()) rc |= BigInt(1) << big((1 << j) - 1);
    return rc;
  });
}
const RC = roundConstants();

/** Rotation offsets: (t+1)(t+2)/2 mod 64 along the (x, y) -> (y, 2x+3y) walk. */
function rotationOffsets(): number[] {
  const offsets = new Array<number>(25).fill(0);
  let x = 1;
  let y = 0;
  for (let t = 0; t < 24; t += 1) {
    offsets[x + 5 * y] = (((t + 1) * (t + 2)) / 2) % 64;
    [x, y] = [y, (2 * x + 3 * y) % 5];
  }
  return offsets;
}
const ROT = rotationOffsets();

function keccakF(a: bigint[]): void {
  const b = new Array<bigint>(25);
  const c = new Array<bigint>(5);
  for (let round = 0; round < 24; round += 1) {
    for (let x = 0; x < 5; x += 1) c[x] = a[x] ^ a[x + 5] ^ a[x + 10] ^ a[x + 15] ^ a[x + 20];
    for (let x = 0; x < 5; x += 1) {
      const d = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
      for (let y = 0; y < 25; y += 5) a[x + y] ^= d;
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(a[x + 5 * y], ROT[x + 5 * y]);
    }
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x += 1) a[x + y] = b[x + y] ^ (~b[((x + 1) % 5) + y] & MASK64 & b[((x + 2) % 5) + y]);
    }
    a[0] ^= RC[round];
  }
}

/** Sponge with `rate` bytes, domain-separation byte `suffix`, squeezing `outBytes`. */
export function keccak(data: Uint8Array, rate: number, suffix: number, outBytes: number): Uint8Array {
  const state = new Array<bigint>(25).fill(BigInt(0));
  const padded = new Uint8Array(Math.floor(data.length / rate + 1) * rate);
  padded.set(data);
  padded[data.length] ^= suffix;
  padded[padded.length - 1] ^= 0x80;
  const view = new DataView(padded.buffer);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let i = 0; i < rate / 8; i += 1) state[i] ^= view.getBigUint64(offset + i * 8, true);
    keccakF(state);
  }
  const out = new Uint8Array(Math.ceil(outBytes / rate) * rate);
  const outView = new DataView(out.buffer);
  for (let offset = 0; offset < out.length; offset += rate) {
    if (offset > 0) keccakF(state);
    for (let i = 0; i < rate / 8; i += 1) outView.setBigUint64(offset + i * 8, state[i], true);
  }
  return out.slice(0, outBytes);
}

export const sha3 = (data: Uint8Array, bits: 224 | 256 | 384 | 512): Uint8Array => keccak(data, 200 - bits / 4, 0x06, bits / 8);
export const keccakHash = (data: Uint8Array, bits: 224 | 256 | 384 | 512): Uint8Array => keccak(data, 200 - bits / 4, 0x01, bits / 8);
export const shake = (data: Uint8Array, strength: 128 | 256, outBytes: number): Uint8Array => keccak(data, 200 - strength / 4, 0x1f, outBytes);

// ---- BLAKE2 (RFC 7693) ----
const SIGMA = [
  "0123456789abcdef", "ea489fd61c02b753", "b8c052fdae367194", "7931dcbe265a40f8", "905724afe1bc683d",
  "2c6a0b834d75fe19", "c51fed4a0763928b", "db7ec13950f4862a", "6fe9b308c2d714a5", "a2847615fb9e3cd0",
].map(row => row.split("").map(c => parseInt(c, 16)));

function blake2bCompress(h: bigint[], block: Uint8Array, counter: number, last: boolean): void {
  const view = new DataView(block.buffer, block.byteOffset, 128);
  const m = Array.from({ length: 16 }, (_, i) => view.getBigUint64(i * 8, true));
  const v = [...h, ...SHA512_IV];
  v[12] ^= big(counter);
  if (last) v[14] ^= MASK64;
  const g = (a: number, b: number, c: number, d: number, x: bigint, y: bigint): void => {
    v[a] = (v[a] + v[b] + x) & MASK64; v[d] = rotl64(v[d] ^ v[a], 32);
    v[c] = (v[c] + v[d]) & MASK64; v[b] = rotl64(v[b] ^ v[c], 40);
    v[a] = (v[a] + v[b] + y) & MASK64; v[d] = rotl64(v[d] ^ v[a], 48);
    v[c] = (v[c] + v[d]) & MASK64; v[b] = rotl64(v[b] ^ v[c], 1);
  };
  for (let round = 0; round < 12; round += 1) mixRound(SIGMA[round % 10], m, g);
  for (let i = 0; i < 8; i += 1) h[i] ^= v[i] ^ v[i + 8];
}

const rotr32 = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

function blake2sCompress(h: number[], block: Uint8Array, counter: number, last: boolean): void {
  const view = new DataView(block.buffer, block.byteOffset, 64);
  const m = Array.from({ length: 16 }, (_, i) => view.getUint32(i * 4, true));
  const v = [...h, ...SHA256_IV];
  v[12] ^= counter >>> 0;
  v[13] ^= Math.floor(counter / 0x100000000);
  if (last) v[14] = ~v[14];
  const g = (a: number, b: number, c: number, d: number, x: number, y: number): void => {
    v[a] = (v[a] + v[b] + x) | 0; v[d] = rotr32(v[d] ^ v[a], 16);
    v[c] = (v[c] + v[d]) | 0; v[b] = rotr32(v[b] ^ v[c], 12);
    v[a] = (v[a] + v[b] + y) | 0; v[d] = rotr32(v[d] ^ v[a], 8);
    v[c] = (v[c] + v[d]) | 0; v[b] = rotr32(v[b] ^ v[c], 7);
  };
  for (let round = 0; round < 10; round += 1) mixRound(SIGMA[round], m, g);
  for (let i = 0; i < 8; i += 1) h[i] = h[i] ^ v[i] ^ v[i + 8];
}

function mixRound<T>(s: number[], m: T[], g: (a: number, b: number, c: number, d: number, x: T, y: T) => void): void {
  g(0, 4, 8, 12, m[s[0]], m[s[1]]);
  g(1, 5, 9, 13, m[s[2]], m[s[3]]);
  g(2, 6, 10, 14, m[s[4]], m[s[5]]);
  g(3, 7, 11, 15, m[s[6]], m[s[7]]);
  g(0, 5, 10, 15, m[s[8]], m[s[9]]);
  g(1, 6, 11, 12, m[s[10]], m[s[11]]);
  g(2, 7, 8, 13, m[s[12]], m[s[13]]);
  g(3, 4, 9, 14, m[s[14]], m[s[15]]);
}

/** Splits the message (key block first) into blocks and calls `compress` with byte counters. */
function blake2Blocks(data: Uint8Array, key: Uint8Array, blockSize: number, compress: (block: Uint8Array, counter: number, last: boolean) => void): void {
  const input = new Uint8Array((key.length ? blockSize : 0) + data.length);
  input.set(key);
  input.set(data, key.length ? blockSize : 0);
  const blocks = Math.max(1, Math.ceil(input.length / blockSize));
  for (let i = 0; i < blocks; i += 1) {
    const block = new Uint8Array(blockSize);
    block.set(input.subarray(i * blockSize, (i + 1) * blockSize));
    const last = i === blocks - 1;
    compress(block, last ? input.length : (i + 1) * blockSize, last);
  }
}

export function blake2b(data: Uint8Array, outBytes = 64, key: Uint8Array = new Uint8Array(0)): Uint8Array {
  if (outBytes < 1 || outBytes > 64) throw new Error("BLAKE2b output length must be 1–64 bytes.");
  if (key.length > 64) throw new Error("A BLAKE2b key can be at most 64 bytes.");
  const h = [...SHA512_IV];
  h[0] ^= big(0x01010000 ^ (key.length << 8) ^ outBytes);
  blake2Blocks(data, key, 128, (block, counter, last) => blake2bCompress(h, block, counter, last));
  const out = new Uint8Array(64);
  const view = new DataView(out.buffer);
  h.forEach((word, i) => view.setBigUint64(i * 8, word, true));
  return out.slice(0, outBytes);
}

export function blake2s(data: Uint8Array, outBytes = 32, key: Uint8Array = new Uint8Array(0)): Uint8Array {
  if (outBytes < 1 || outBytes > 32) throw new Error("BLAKE2s output length must be 1–32 bytes.");
  if (key.length > 32) throw new Error("A BLAKE2s key can be at most 32 bytes.");
  const h = [...SHA256_IV];
  h[0] ^= 0x01010000 ^ (key.length << 8) ^ outBytes;
  blake2Blocks(data, key, 64, (block, counter, last) => blake2sCompress(h, block, counter, last));
  const out = new Uint8Array(32);
  const view = new DataView(out.buffer);
  h.forEach((word, i) => view.setUint32(i * 4, word >>> 0, true));
  return out.slice(0, outBytes);
}
