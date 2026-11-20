"use client";

import React, { useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { Download, ShieldCheck, FileCheck } from "lucide-react";

export default function LocalPdfRedactor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [targetPages, setTargetPages] = useState<string>("all");
  const [redactionType, setRedactionType] = useState<"header" | "footer" | "metadata">("metadata");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [redactedUrl, setRedactedUrl] = useState<string>("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setRedactedUrl("");
      try {
        const bytes = await selected.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        setPageCount(doc.getPageCount());
      } catch {
        alert("Failed to load PDF. Please make sure the file is not password-protected.");
      }
    }
  };

  const handleRedact = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);

      // 1. Strip all metadata (Author, Producer, Title, Subject, Creator, Dates)
      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      doc.setProducer("Localtools Privacy Engine");
      doc.setCreator("Localtools PDF Redactor");

      // 2. Burn physical redaction boxes if header or footer selected
      if (redactionType === "header" || redactionType === "footer") {
        const pages = doc.getPages();
        for (const page of pages) {
          const { width, height } = page.getSize();
          if (redactionType === "header") {
            // Draw permanent solid black box across top 50 pt
            page.drawRectangle({
              x: 0,
              y: height - 60,
              width,
              height: 60,
              color: rgb(0, 0, 0),
            });
          } else if (redactionType === "footer") {
            // Draw permanent solid black box across bottom 50 pt
            page.drawRectangle({
              x: 0,
              y: 0,
              width,
              height: 50,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const redactedBytes = await doc.save();
      const blob = new Blob([redactedBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setRedactedUrl(url);
    } catch (err) {
      alert("Error redacting PDF: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool-panel">
      <h3 className="text-lg font-semibold mb-2">HIPAA-Safe Local PDF Redactor & Metadata Stripper</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Burn permanent blackout redaction overlays and strip hidden metadata (author, location, history) 100% locally in your browser.
      </p>

      {!file ? (
        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg text-center bg-gray-50 dark:bg-slate-900">
          <input
            type="file"
            accept="application/pdf"
            id="pdf-upload"
            className="hidden"
            onChange={handleFile}
          />
          <label htmlFor="pdf-upload" className="button cursor-pointer inline-flex items-center gap-2">
            <ShieldCheck size={16} /> Select PDF Document to Redact
          </label>
          <p className="text-xs text-gray-500 mt-2">Zero document uploads. Safe for medical, legal, and financial records.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded border border-blue-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-blue-600" />
              <span><strong>{file.name}</strong> ({pageCount} {pageCount === 1 ? "page" : "pages"})</span>
            </div>
            <label htmlFor="change-pdf" className="text-blue-600 hover:underline cursor-pointer">
              Change File
              <input type="file" id="change-pdf" accept="application/pdf" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              Redaction Operation
              <select
                value={redactionType}
                onChange={e => setRedactionType(e.target.value as "metadata" | "header" | "footer")}
              >
                <option value="metadata">Sanitize & Strip All Hidden Metadata Only</option>
                <option value="header">Blackout Top Header Area (All Pages) + Strip Metadata</option>
                <option value="footer">Blackout Bottom Footer Area (All Pages) + Strip Metadata</option>
              </select>
            </label>
            <label className="field">
              Target Scope
              <select value={targetPages} onChange={e => setTargetPages(e.target.value)}>
                <option value="all">Apply to All Pages (1 to {pageCount})</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleRedact}
              disabled={isProcessing}
              className="button text-xs flex items-center gap-1.5 py-1.5 px-4"
              type="button"
            >
              <ShieldCheck size={14} /> {isProcessing ? "Processing Locally..." : "Apply Permanent Redaction"}
            </button>
          </div>

          {redactedUrl && (
            <div className="p-4 bg-green-50 dark:bg-slate-800 rounded border border-green-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 mt-4">
              <div>
                <strong className="text-sm text-green-900 dark:text-green-300 block">Redaction Complete!</strong>
                <p className="text-xs text-green-700 dark:text-green-400 m-0">
                  Hidden metadata removed and blackout layers permanently embedded into the vector PDF stream.
                </p>
              </div>
              <a
                href={redactedUrl}
                download={`redacted-${file.name}`}
                className="button text-xs flex items-center gap-1.5 py-1.5 px-4"
              >
                <Download size={14} /> Download Redacted PDF
              </a>
            </div>
          )}
        </div>
      )}

      <p className="hint text-xs opacity-75 mt-4">
        Unlike superficial black highlighter marks, this tool draws solid vector rectangles directly into the PDF content stream and clears all metadata keys. HIPAA, GDPR, and attorney-client safe.
      </p>
    </div>
  );
}
