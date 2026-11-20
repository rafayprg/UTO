export const ZIP_LIMITS = { input: 50 * 1024 * 1024, expanded: 100 * 1024 * 1024, entry: 25 * 1024 * 1024, count: 500 };
/** Read declared central-directory sizes before JSZip attempts decompression. */
export function inspectZipSafety(buffer: ArrayBuffer) {
  if (buffer.byteLength > ZIP_LIMITS.input) throw new Error("ZIP files must be 50 MB or smaller.");
  const data = new DataView(buffer);
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (data.getUint32(i, true) === 0x06054b50 && i + 22 + data.getUint16(i + 20, true) === buffer.byteLength) { end = i; break; }
  }
  if (end < 0) throw new Error("This is not a complete supported ZIP archive.");
  const count = data.getUint16(end + 10, true);
  const directorySize = data.getUint32(end + 12, true);
  let offset = data.getUint32(end + 16, true);
  if (data.getUint16(end + 4, true) || data.getUint16(end + 6, true) || data.getUint16(end + 8, true) !== count) throw new Error("Split ZIP archives are not supported.");
  if (count === 65535 || directorySize === 0xffffffff || offset === 0xffffffff) throw new Error("ZIP64 archives are not supported in this lightweight tool.");
  if (count > ZIP_LIMITS.count || offset + directorySize > end) throw new Error("The archive is oversized or has an invalid directory.");
  let expanded = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || data.getUint32(offset, true) !== 0x02014b50) throw new Error("The archive directory is damaged.");
    const flags = data.getUint16(offset + 8, true);
    const size = data.getUint32(offset + 24, true);
    const nameLength = data.getUint16(offset + 28, true);
    const extraLength = data.getUint16(offset + 30, true);
    const commentLength = data.getUint16(offset + 32, true);
    const next = offset + 46 + nameLength + extraLength + commentLength;
    if (next > end || flags & 1) throw new Error(flags & 1 ? "Password-protected ZIP files are not supported." : "The archive directory is truncated.");
    const name = new TextDecoder().decode(new Uint8Array(buffer, offset + 46, nameLength));
    if (name.includes("\0") || name.includes("\\") || name.startsWith("/") || /^[a-z]:/i.test(name) || name.split("/").includes("..")) throw new Error("The archive contains unsafe file paths.");
    if (names.has(name)) throw new Error("The archive contains duplicate entry names.");
    names.add(name); expanded += size;
    if (size > ZIP_LIMITS.entry || expanded > ZIP_LIMITS.expanded) throw new Error("The archive exceeds safe extraction limits (25 MB per file or 100 MB total).");
    offset = next;
  }
  return { count, expanded };
}
export function safeDownloadName(name: string) { return name.split(/[\\/]/).pop()?.replace(/[<>:"|?*\x00-\x1f]/g, "_") || "extracted-file"; }
export function uniqueArchiveNames(names: string[]) {
  const used = new Set<string>();
  return names.map(original => {
    const base = safeDownloadName(original); let candidate = base; let count = 2;
    const dot = base.lastIndexOf("."); const stem = dot > 0 ? base.slice(0, dot) : base; const extension = dot > 0 ? base.slice(dot) : "";
    while (used.has(candidate.toLowerCase())) candidate = `${stem} (${count++})${extension}`;
    used.add(candidate.toLowerCase()); return candidate;
  });
}
