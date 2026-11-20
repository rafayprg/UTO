// Hash, checksum, HMAC and key-derivation ops. SHA-1/256/384/512, HMAC-SHA*, PBKDF2 and HKDF
// use Web Crypto; everything else uses the TypeScript implementations in the hash-* helpers.
import type { OptionField, OptionValues, TextOp } from "./types";
import { buf, formatBytes, fromBase64, fromHex, inputFormatOption, outputFormatOption, readInput, toBase64, toHex, uintBytes, utf8 } from "./crypto-text-bytes.ts";
import { md5, ripemd160, sha224, sha512_224, sha512_256 } from "./crypto-text-hash-md.ts";
import { blake2b, blake2s, keccakHash, sha3, shake } from "./crypto-text-hash-sponge.ts";
import { CRC_SPECS, adler32, crc, fnv32, fnv64, murmur3, xxhash32 } from "./crypto-text-hash-sum.ts";

type Digest = (data: Uint8Array, options: OptionValues) => Uint8Array | Promise<Uint8Array>;

const EXAMPLE = "The quick brown fox jumps over the lazy dog";

async function subtleDigest(algorithm: string, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest(algorithm, buf(data)));
}

function hashOp(name: string, digest: Digest, extra: OptionField[] = [], note?: string): TextOp {
  return {
    input: { label: "Text to hash", example: EXAMPLE },
    options: [inputFormatOption, outputFormatOption, ...extra],
    outputLabel: `${name} digest`,
    note,
    async run(input, options) {
      return formatBytes(await digest(readInput(input, options), options), options);
    },
  };
}

const checksumOutput: OptionField = {
  id: "outputFormat", label: "Output as", type: "select", default: "hex",
  choices: [["hex", "Hex (lowercase)"], ["HEX", "Hex (uppercase)"], ["decimal", "Decimal"]],
};
const seedOption: OptionField = { id: "seed", label: "Seed (unsigned 32-bit integer)", type: "number", default: 0, min: 0, max: 4294967295, step: 1 };

function checksumOp(name: string, bytes: number, compute: (data: Uint8Array, options: OptionValues) => number | bigint, extra: OptionField[] = [], note?: string): TextOp {
  return {
    input: { label: "Text to checksum", example: "123456789" },
    options: [inputFormatOption, checksumOutput, ...extra],
    outputLabel: name,
    note,
    run(input, options) {
      const value = compute(readInput(input, options), options);
      if (options.outputFormat === "decimal") return BigInt(value).toString(10);
      const hex = toHex(uintBytes(value, bytes));
      return options.outputFormat === "HEX" ? hex.toUpperCase() : hex;
    },
  };
}

function seedValue(options: OptionValues): number {
  const seed = Number(options.seed);
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error("The seed must be a whole number from 0 to 4294967295.");
  return seed;
}

const crcNote = (spec: string): string => `Parameters: ${spec}. Check value for "123456789" is shown when you load the example.`;

// ---- HMAC ----
const keyOptions: OptionField[] = [
  { id: "key", label: "Secret key", type: "text", default: "secret-key", placeholder: "Your HMAC key" },
  { id: "keyFormat", label: "Key is", type: "select", default: "text", choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"], ["base64", "Base64 bytes"]] },
];

function readKey(options: OptionValues, id = "key", formatId = "keyFormat"): Uint8Array {
  const value = String(options[id] ?? "");
  if (options[formatId] === "hex") return fromHex(value);
  if (options[formatId] === "base64") return fromBase64(value);
  return utf8(value);
}

/** RFC 2104 HMAC over a TypeScript hash function with the given block size. */
function hmacGeneric(hash: (data: Uint8Array) => Uint8Array, blockSize: number, key: Uint8Array, message: Uint8Array): Uint8Array {
  const block = new Uint8Array(blockSize);
  block.set(key.length > blockSize ? hash(key) : key);
  const inner = new Uint8Array(blockSize + message.length);
  const outer = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i += 1) {
    inner[i] = block[i] ^ 0x36;
    outer[i] = block[i] ^ 0x5c;
  }
  inner.set(message, blockSize);
  const innerHash = hash(inner);
  const final = new Uint8Array(blockSize + innerHash.length);
  final.set(outer);
  final.set(innerHash, blockSize);
  return hash(final);
}

export async function hmacSubtle(hash: string, key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  // Web Crypto rejects empty HMAC keys. HMAC zero-pads keys to the block size, so an empty key
  // and a single zero byte give the same result.
  const cryptoKey = await crypto.subtle.importKey("raw", buf(key.length ? key : new Uint8Array(1)), { name: "HMAC", hash }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, buf(message)));
}

function hmacOp(name: string, mac: (key: Uint8Array, message: Uint8Array) => Uint8Array | Promise<Uint8Array>): TextOp {
  return {
    input: { label: "Message", example: EXAMPLE },
    options: [...keyOptions, inputFormatOption, outputFormatOption],
    outputLabel: `${name}`,
    note: "The key never leaves your browser. HMAC proves a message was made by someone who holds the same key.",
    async run(input, options) {
      return formatBytes(await mac(readKey(options), readInput(input, options)), options);
    },
  };
}

// ---- KDFs ----
const hashChoice: OptionField = { id: "hash", label: "Hash function", type: "select", default: "SHA-256", choices: [["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]] };

async function pbkdf2(password: Uint8Array, salt: Uint8Array, iterations: number, hash: string, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", buf(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: buf(salt), iterations, hash }, key, bytes * 8));
}

function wholeNumber(value: unknown, label: string, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
}

const sriAlgorithms: Record<string, string> = { sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512" };

export const hashOps: Record<string, TextOp> = {
  "md5-hash": hashOp("MD5", data => md5(data), [], "MD5 is broken for security use (collisions are easy). Use it only for legacy checksums."),
  "sha1-hash": hashOp("SHA-1", data => subtleDigest("SHA-1", data), [], "SHA-1 has practical collision attacks. Prefer SHA-256 for anything security related."),
  "sha224-hash": hashOp("SHA-224", data => sha224(data)),
  "sha256-hash": hashOp("SHA-256", data => subtleDigest("SHA-256", data)),
  "sha384-hash": hashOp("SHA-384", data => subtleDigest("SHA-384", data)),
  "sha512-hash": hashOp("SHA-512", data => subtleDigest("SHA-512", data)),
  "sha512-224-hash": hashOp("SHA-512/224", data => sha512_224(data)),
  "sha512-256-hash": hashOp("SHA-512/256", data => sha512_256(data)),
  "sha3-224-hash": hashOp("SHA3-224", data => sha3(data, 224)),
  "sha3-256-hash": hashOp("SHA3-256", data => sha3(data, 256)),
  "sha3-384-hash": hashOp("SHA3-384", data => sha3(data, 384)),
  "sha3-512-hash": hashOp("SHA3-512", data => sha3(data, 512)),
  "keccak-256-hash": hashOp("Keccak-256", data => keccakHash(data, 256), [], "Original Keccak padding (0x01), as used by Ethereum. It differs from the standard SHA3-256."),
  "keccak-512-hash": hashOp("Keccak-512", data => keccakHash(data, 512), [], "Original Keccak padding (0x01). It differs from the standard SHA3-512."),
  "shake128-hash": hashOp("SHAKE128", (data, o) => shake(data, 128, wholeNumber(o.length, "Output length", 1, 1024)), [{ id: "length", label: "Output length (bytes)", type: "number", default: 32, min: 1, max: 1024, step: 1 }]),
  "shake256-hash": hashOp("SHAKE256", (data, o) => shake(data, 256, wholeNumber(o.length, "Output length", 1, 1024)), [{ id: "length", label: "Output length (bytes)", type: "number", default: 64, min: 1, max: 1024, step: 1 }]),
  "ripemd160-hash": hashOp("RIPEMD-160", data => ripemd160(data)),
  "blake2b-hash": hashOp("BLAKE2b", (data, o) => blake2b(data, wholeNumber(o.length, "Output length", 1, 64), readKey(o, "b2key", "b2keyFormat")), [
    { id: "length", label: "Output length (bytes)", type: "number", default: 64, min: 1, max: 64, step: 1, hint: "64 = BLAKE2b-512, 32 = BLAKE2b-256" },
    { id: "b2key", label: "Optional key (keyed hashing / MAC)", type: "text", default: "" },
    { id: "b2keyFormat", label: "Key is", type: "select", default: "text", choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"]] },
  ]),
  "blake2s-hash": hashOp("BLAKE2s", (data, o) => blake2s(data, wholeNumber(o.length, "Output length", 1, 32), readKey(o, "b2key", "b2keyFormat")), [
    { id: "length", label: "Output length (bytes)", type: "number", default: 32, min: 1, max: 32, step: 1, hint: "32 = BLAKE2s-256" },
    { id: "b2key", label: "Optional key (keyed hashing / MAC)", type: "text", default: "" },
    { id: "b2keyFormat", label: "Key is", type: "select", default: "text", choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"]] },
  ]),
  "crc32-checksum": checksumOp("CRC-32", 4, data => crc(data, CRC_SPECS.crc32), [], crcNote("CRC-32/ISO-HDLC (zip, PNG, Ethernet): poly 0x04C11DB7, reflected, init and xor-out 0xFFFFFFFF")),
  "crc32c-checksum": checksumOp("CRC-32C", 4, data => crc(data, CRC_SPECS.crc32c), [], crcNote("CRC-32C (Castagnoli, iSCSI, ext4): poly 0x1EDC6F41, reflected, init and xor-out 0xFFFFFFFF")),
  "crc16-checksum": checksumOp("CRC-16/ARC", 2, data => crc(data, CRC_SPECS["crc16-arc"]), [], crcNote("CRC-16/ARC (also called CRC-16/IBM): poly 0x8005, reflected, init 0")),
  "crc16-ccitt-checksum": checksumOp("CRC-16/CCITT-FALSE", 2, data => crc(data, CRC_SPECS["crc16-ccitt-false"]), [], crcNote("CRC-16/CCITT-FALSE (IBM-3740): poly 0x1021, not reflected, init 0xFFFF")),
  "crc16-xmodem-checksum": checksumOp("CRC-16/XMODEM", 2, data => crc(data, CRC_SPECS["crc16-xmodem"]), [], crcNote("CRC-16/XMODEM: poly 0x1021, not reflected, init 0")),
  "crc16-modbus-checksum": checksumOp("CRC-16/MODBUS", 2, data => crc(data, CRC_SPECS["crc16-modbus"]), [], crcNote("CRC-16/MODBUS: poly 0x8005, reflected, init 0xFFFF. Modbus frames send the low byte first")),
  "crc8-checksum": checksumOp("CRC-8", 1, data => crc(data, CRC_SPECS.crc8), [], crcNote("CRC-8/SMBUS: poly 0x07, not reflected, init 0")),
  "adler32-checksum": checksumOp("Adler-32", 4, data => adler32(data), [], "Adler-32 as used by zlib (RFC 1950)."),
  "fnv1a-32-hash": checksumOp("FNV-1a 32-bit", 4, data => fnv32(data, "1a")),
  "fnv1a-64-hash": checksumOp("FNV-1a 64-bit", 8, data => fnv64(data, "1a")),
  "fnv1-32-hash": checksumOp("FNV-1 32-bit", 4, data => fnv32(data, "1")),
  "fnv1-64-hash": checksumOp("FNV-1 64-bit", 8, data => fnv64(data, "1")),
  "murmurhash3-hash": checksumOp("MurmurHash3 x86_32", 4, (data, o) => murmur3(data, seedValue(o)), [seedOption], "MurmurHash3_x86_32. Fast and well distributed, but not a cryptographic hash."),
  "xxhash32-hash": checksumOp("xxHash32", 4, (data, o) => xxhash32(data, seedValue(o)), [seedOption], "xxHash32 (XXH32). Fast, not a cryptographic hash."),
  "hmac-md5": hmacOp("HMAC-MD5", (key, message) => hmacGeneric(md5, 64, key, message)),
  "hmac-sha1": hmacOp("HMAC-SHA1", (key, message) => hmacSubtle("SHA-1", key, message)),
  "hmac-sha256": hmacOp("HMAC-SHA256", (key, message) => hmacSubtle("SHA-256", key, message)),
  "hmac-sha384": hmacOp("HMAC-SHA384", (key, message) => hmacSubtle("SHA-384", key, message)),
  "hmac-sha512": hmacOp("HMAC-SHA512", (key, message) => hmacSubtle("SHA-512", key, message)),
  "hmac-sha3-256": hmacOp("HMAC-SHA3-256", (key, message) => hmacGeneric(data => sha3(data, 256), 136, key, message)),
  "pbkdf2-generator": {
    input: { label: "Password", example: "correct horse battery staple" },
    options: [
      { id: "salt", label: "Salt", type: "text", default: "a1b2c3d4e5f60718", hint: "Use a random, unique salt per password." },
      { id: "saltFormat", label: "Salt is", type: "select", default: "hex", choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"], ["base64", "Base64 bytes"]] },
      { id: "iterations", label: "Iterations", type: "number", default: 600000, min: 1, max: 10000000, step: 1 },
      hashChoice,
      { id: "length", label: "Derived key length (bytes)", type: "number", default: 32, min: 1, max: 256, step: 1 },
      outputFormatOption,
    ],
    outputLabel: "Derived key",
    manual: true,
    note: "PBKDF2 (RFC 8018) via Web Crypto. OWASP suggests at least 600,000 iterations for PBKDF2-HMAC-SHA256.",
    async run(input, options) {
      const iterations = wholeNumber(options.iterations, "Iterations", 1, 10000000);
      const length = wholeNumber(options.length, "Key length", 1, 256);
      const salt = readKey(options, "salt", "saltFormat");
      return formatBytes(await pbkdf2(utf8(input), salt, iterations, String(options.hash), length), options);
    },
  },
  "hkdf-generator": {
    input: { label: "Input keying material", example: "0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b" },
    options: [
      { id: "inputFormat", label: "Input is", type: "select", default: "hex", choices: [["text", "Text (UTF-8)"], ["hex", "Hex bytes"], ["base64", "Base64 bytes"]] },
      { id: "salt", label: "Salt (hex, may be empty)", type: "text", default: "000102030405060708090a0b0c" },
      { id: "info", label: "Info (hex, may be empty)", type: "text", default: "f0f1f2f3f4f5f6f7f8f9" },
      { id: "hash", label: "Hash function", type: "select", default: "SHA-256", choices: [["SHA-1", "SHA-1"], ["SHA-256", "SHA-256"], ["SHA-384", "SHA-384"], ["SHA-512", "SHA-512"]] },
      { id: "length", label: "Output length (bytes)", type: "number", default: 42, min: 1, max: 255, step: 1 },
      outputFormatOption,
    ],
    outputLabel: "Output keying material",
    note: "HKDF (RFC 5869) via Web Crypto. The example is RFC 5869 test case 1.",
    async run(input, options) {
      const length = wholeNumber(options.length, "Output length", 1, 255);
      const key = await crypto.subtle.importKey("raw", buf(readInput(input, options)), "HKDF", false, ["deriveBits"]);
      const params = { name: "HKDF", hash: String(options.hash), salt: buf(fromHex(String(options.salt))), info: buf(fromHex(String(options.info))) };
      return formatBytes(new Uint8Array(await crypto.subtle.deriveBits(params, key, length * 8)), options);
    },
  },
  "sri-hash-generator": {
    input: { label: "File contents (script or stylesheet)", example: "alert('Hello, world.');", rows: 10 },
    options: [{ id: "algorithm", label: "Algorithm", type: "select", default: "sha384", choices: [["sha256", "SHA-256"], ["sha384", "SHA-384 (recommended)"], ["sha512", "SHA-512"]] }],
    outputLabel: "integrity attribute value",
    note: "Hashes the exact text you paste as UTF-8. Any change, even a trailing newline, changes the hash.",
    async run(input, options) {
      const algorithm = String(options.algorithm);
      const digest = await subtleDigest(sriAlgorithms[algorithm] ?? "SHA-384", utf8(input));
      return `${algorithm}-${toBase64(digest)}`;
    },
  },
};

export { pbkdf2, readKey, wholeNumber };
