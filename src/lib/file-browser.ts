"use client";
import { useEffect, useState } from "react";

export const MB = 1024 * 1024;
export function fileError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "The file could not be processed. Try a smaller, supported file.";
}
export function sizeLabel(bytes: number): string { return bytes < 1024 ? `${bytes} B` : bytes < MB ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / MB).toFixed(1)} MB`; }
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export function useFileURL(blob: Blob | null) {
  const [url, setURL] = useState("");
  useEffect(() => {
    if (!blob) { setURL(""); return; }
    const value = URL.createObjectURL(blob); setURL(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return url;
}
export async function imageCanvas(blob: Blob, background?: string): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(blob);
  try {
    if (bitmap.width * bitmap.height > 32_000_000) throw new Error("This image exceeds the 32 megapixel browser limit. Resize it before processing.");
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create an image canvas.");
    if (background) { context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height); }
    context.drawImage(bitmap, 0, 0);
    return canvas;
  } finally { bitmap.close(); }
}
export function canvasBlob(canvas: HTMLCanvasElement, type: string, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (!blob) reject(new Error("The browser could not export this image."));
    else if (blob.type !== type) reject(new Error(`Your browser cannot export ${type}. Choose another format.`));
    else resolve(blob);
  }, type, quality));
}
export function runFileWorker<T>(worker: Worker, payload: unknown, progress?: (text: string) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<{ result?: T; error?: string; progress?: string }>) => {
      if (event.data.progress) { progress?.(event.data.progress); return; }
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.result as T);
    };
    worker.onerror = () => { worker.terminate(); reject(new Error("The browser worker stopped. Try again with a smaller file.")); };
    worker.postMessage(payload);
  });
}
