export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function downloadText(text: string, filename: string, type = "text/plain;charset=utf-8") { downloadBlob(new Blob([text], { type }), filename); }
export async function copyText(text: string) {
  if (!navigator.clipboard) throw new Error("Clipboard access is unavailable. Select the output and copy it manually.");
  await navigator.clipboard.writeText(text);
}
