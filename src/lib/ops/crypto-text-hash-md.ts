// Merkle–Damgård hashes written in TypeScript: MD5, SHA-224/256, SHA-384/512 and the
// truncated SHA-512/224 and SHA-512/256 variants, and RIPEMD-160. (SHA-1/256/384/512 pages
// use Web Crypto; these cover what crypto.subtle does not offer.) Verified against Node's
// OpenSSL implementation in scripts/ops-tests/crypto.mjs.

const MD5_K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];
const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n));
const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

/** MD padding: 0x80, zeros, then the bit length (8 or 16 bytes, little or big endian). */
function pad(data: Uint8Array, blockSize: number, lengthBytes: number, littleEndian: boolean): Uint8Array {
  const total = Math.ceil((data.length + 1 + lengthBytes) / blockSize) * blockSize;
  const out = new Uint8Array(total);
  out.set(data);
  out[data.length] = 0x80;
  let bits = BigInt(data.length) * BigInt(8);
  for (let i = 0; i < 8; i += 1) {
    const index = littleEndian ? total - lengthBytes + i : total - 1 - i;
    out[index] = Number(bits & BigInt(255));
    bits >>= BigInt(8);
  }
  return out;
}

function words(data: Uint8Array, offset: number, count: number, littleEndian: boolean): number[] {
  const view = new DataView(data.buffer, data.byteOffset + offset, count * 4);
  return Array.from({ length: count }, (_, i) => view.getUint32(i * 4, littleEndian));
}

function wordsToBytes(state: number[], littleEndian: boolean, byteLength = state.length * 4): Uint8Array {
  const out = new Uint8Array(state.length * 4);
  const view = new DataView(out.buffer);
  state.forEach((word, i) => view.setUint32(i * 4, word >>> 0, littleEndian));
  return out.slice(0, byteLength);
}

export function md5(data: Uint8Array): Uint8Array {
  const padded = pad(data, 64, 8, true);
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < padded.length; offset += 64) {
    const m = words(padded, offset, 16, true);
    let [a, b, c, d] = h;
    for (let i = 0; i < 64; i += 1) {
      const round = i >> 4;
      let f: number;
      let g: number;
      if (round === 0) { f = (b & c) | (~b & d); g = i; }
      else if (round === 1) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (round === 2) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const next = d;
      d = c;
      c = b;
      b = (b + rotl((a + f + MD5_K[i] + m[g]) | 0, MD5_S[round * 4 + (i % 4)])) | 0;
      a = next;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
  }
  return wordsToBytes(h, true);
}

// ---- SHA-2 constants, derived exactly with integer roots instead of copied tables ----
function iroot(value: bigint, k: number): bigint {
  const big = BigInt(k);
  let x = BigInt(1) << BigInt(Math.ceil(value.toString(2).length / k) + 1);
  for (;;) {
    const next = ((big - BigInt(1)) * x + value / x ** (big - BigInt(1))) / big;
    if (next >= x) return x;
    x = next;
  }
}
function primes(count: number): number[] {
  const out: number[] = [];
  for (let n = 2; out.length < count; n += 1) if (out.every(p => n % p !== 0)) out.push(n);
  return out;
}
const MASK64 = (BigInt(1) << BigInt(64)) - BigInt(1);
const PRIMES = primes(80);
/** First 64 bits of the fractional part of the k-th root of p. */
const frac64 = (p: number, k: number): bigint => iroot(BigInt(p) << BigInt(64 * k), k) & MASK64;

export const SHA512_K: bigint[] = PRIMES.map(p => frac64(p, 3));
export const SHA512_IV: bigint[] = PRIMES.slice(0, 8).map(p => frac64(p, 2));
const SHA384_IV: bigint[] = PRIMES.slice(8, 16).map(p => frac64(p, 2));
const SHA256_K: number[] = SHA512_K.slice(0, 64).map(k => Number(k >> BigInt(32)));
export const SHA256_IV: number[] = SHA512_IV.map(v => Number(v >> BigInt(32)));
const SHA224_IV: number[] = SHA384_IV.map(v => Number(v & BigInt(0xffffffff)));

function sha256Core(data: Uint8Array, iv: number[], outBytes: number): Uint8Array {
  const padded = pad(data, 64, 8, false);
  const h = [...iv];
  const w = new Array<number>(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    words(padded, offset, 16, false).forEach((word, i) => { w[i] = word; });
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_K[i] + w[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
  }
  return wordsToBytes(h, false, outBytes);
}

export const sha256 = (data: Uint8Array): Uint8Array => sha256Core(data, SHA256_IV, 32);
export const sha224 = (data: Uint8Array): Uint8Array => sha256Core(data, SHA224_IV, 28);

const r64 = (x: bigint, n: number): bigint => ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK64;

function sha512Core(data: Uint8Array, iv: bigint[], outBytes: number): Uint8Array {
  const padded = pad(data, 128, 16, false);
  const h = [...iv];
  const w = new Array<bigint>(80);
  const view = new DataView(padded.buffer, padded.byteOffset);
  for (let offset = 0; offset < padded.length; offset += 128) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getBigUint64(offset + i * 8, false);
    for (let i = 16; i < 80; i += 1) {
      const s0 = r64(w[i - 15], 1) ^ r64(w[i - 15], 8) ^ (w[i - 15] >> BigInt(7));
      const s1 = r64(w[i - 2], 19) ^ r64(w[i - 2], 61) ^ (w[i - 2] >> BigInt(6));
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & MASK64;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 80; i += 1) {
      const t1 = (hh + (r64(e, 14) ^ r64(e, 18) ^ r64(e, 41)) + ((e & f) ^ (~e & MASK64 & g)) + SHA512_K[i] + w[i]) & MASK64;
      const t2 = ((r64(a, 28) ^ r64(a, 34) ^ r64(a, 39)) + ((a & b) ^ (a & c) ^ (b & c))) & MASK64;
      hh = g; g = f; f = e; e = (d + t1) & MASK64; d = c; c = b; b = a; a = (t1 + t2) & MASK64;
    }
    [a, b, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) & MASK64; });
  }
  const out = new Uint8Array(64);
  const outView = new DataView(out.buffer);
  h.forEach((v, i) => outView.setBigUint64(i * 8, v, false));
  return out.slice(0, outBytes);
}

/** FIPS 180-4 §5.3.6: the SHA-512/t IV is SHA-512 (with a modified IV) of the string "SHA-512/t". */
function sha512tIv(t: number): bigint[] {
  const mask = BigInt("0xa5a5a5a5a5a5a5a5");
  const digest = sha512Core(new TextEncoder().encode(`SHA-512/${t}`), SHA512_IV.map(v => v ^ mask), 64);
  const view = new DataView(digest.buffer);
  return Array.from({ length: 8 }, (_, i) => view.getBigUint64(i * 8, false));
}
const SHA512_224_IV = sha512tIv(224);
const SHA512_256_IV = sha512tIv(256);

export const sha512 = (data: Uint8Array): Uint8Array => sha512Core(data, SHA512_IV, 64);
export const sha384 = (data: Uint8Array): Uint8Array => sha512Core(data, SHA384_IV, 48);
export const sha512_224 = (data: Uint8Array): Uint8Array => sha512Core(data, SHA512_224_IV, 28);
export const sha512_256 = (data: Uint8Array): Uint8Array => sha512Core(data, SHA512_256_IV, 32);

// ---- RIPEMD-160 ----
// Word order: r = rho^k(i) on the left line and rho^k(pi(i)) on the right, pi(i) = 9i + 5 mod 16.
const RMD_RHO = [7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8];
function rmdOrder(start: number[]): number[] {
  const rows: number[][] = [start];
  while (rows.length < 5) rows.push(rows[rows.length - 1].map(i => RMD_RHO[i]));
  return rows.flat();
}
const RMD_R = rmdOrder(Array.from({ length: 16 }, (_, i) => i));
const RMD_RP = rmdOrder(Array.from({ length: 16 }, (_, i) => (9 * i + 5) % 16));
const RMD_S = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6];
const RMD_SP = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11];
const RMD_K = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
const RMD_KP = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];

function rmdF(j: number, x: number, y: number, z: number): number {
  if (j < 16) return x ^ y ^ z;
  if (j < 32) return (x & y) | (~x & z);
  if (j < 48) return (x | ~y) ^ z;
  if (j < 64) return (x & z) | (y & ~z);
  return x ^ (y | ~z);
}

export function ripemd160(data: Uint8Array): Uint8Array {
  const padded = pad(data, 64, 8, true);
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  for (let offset = 0; offset < padded.length; offset += 64) {
    const x = words(padded, offset, 16, true);
    let [al, bl, cl, dl, el] = h;
    let [ar, br, cr, dr, er] = h;
    for (let j = 0; j < 80; j += 1) {
      const round = j >> 4;
      let t = (rotl((al + rmdF(j, bl, cl, dl) + x[RMD_R[j]] + RMD_K[round]) | 0, RMD_S[j]) + el) | 0;
      al = el; el = dl; dl = rotl(cl, 10); cl = bl; bl = t;
      t = (rotl((ar + rmdF(79 - j, br, cr, dr) + x[RMD_RP[j]] + RMD_KP[round]) | 0, RMD_SP[j]) + er) | 0;
      ar = er; er = dr; dr = rotl(cr, 10); cr = br; br = t;
    }
    const t = (h[1] + cl + dr) | 0;
    h[1] = (h[2] + dl + er) | 0;
    h[2] = (h[3] + el + ar) | 0;
    h[3] = (h[4] + al + br) | 0;
    h[4] = (h[0] + bl + cr) | 0;
    h[0] = t;
  }
  return wordsToBytes(h, true);
}
