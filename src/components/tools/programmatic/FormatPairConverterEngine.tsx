"use client";

import { useState, useRef, useMemo } from "react";
import { FORMAT_PAIRS } from "@/data/programmatic/format-pairs";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ShieldCheck, Download, Copy, Check, Upload } from "lucide-react";

interface PresetData {
  pairId?: string;
}

export default function FormatPairConverterEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialPairId = preset.pairId || "webp-to-png";

  const [pairId, setPairId] = useState<string>(initialPairId);
  const [inputText, setInputText] = useState<string>("");
  const [convertedText, setConvertedText] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pair = useMemo(() => {
    return FORMAT_PAIRS.find((p) => p.id === pairId) || FORMAT_PAIRS[0];
  }, [pairId]);

  // Handle Image Conversion via Canvas
  const handleImageFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name.replace(/\.[^/.]+$/, `.${pair.toExt}`));
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        // Fill white if converting to JPEG (no alpha)
        if (pair.toExt === "jpg" || pair.toExt === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
          }
          setIsProcessing(false);
        }, pair.mimeTo);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Text/Data Conversions
  const handleDataConvert = (raw: string) => {
    setInputText(raw);
    if (!raw.trim()) {
      setConvertedText("");
      return;
    }

    try {
      if (pair.id === "csv-to-json") {
        const lines = raw.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const rows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const obj: Record<string, string | number> = {};
          headers.forEach((h, i) => {
            const v = values[i];
            obj[h] = !isNaN(Number(v)) && v !== "" ? Number(v) : v;
          });
          return obj;
        });
        setConvertedText(JSON.stringify(rows, null, 2));
      } else if (pair.id === "json-to-csv") {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const headers = Object.keys(arr[0] || {});
        const csvRows = [headers.join(",")];
        for (const item of arr) {
          csvRows.push(headers.map((h) => JSON.stringify(item[h] ?? "")).join(","));
        }
        setConvertedText(csvRows.join("\n"));
      } else if (pair.id === "json-to-typescript") {
        const parsed = JSON.parse(raw);
        let ts = "export interface GeneratedType {\n";
        const sample = Array.isArray(parsed) ? parsed[0] || {} : parsed;
        for (const key of Object.keys(sample)) {
          const val = sample[key];
          const type = Array.isArray(val) ? "unknown[]" : typeof val;
          ts += `  ${key}: ${type};\n`;
        }
        ts += "}";
        setConvertedText(ts);
      } else {
        // Generic fallback/pass-through formatting
        setConvertedText(raw);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setConvertedText(`// Error parsing input: ${msg}`);
    }
  };

  const handleCopy = () => {
    if (convertedText) {
      navigator.clipboard.writeText(convertedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="format-pair-engine">
      <div className="engine-card">
        <div className="card-row-between">
          <div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              {pair.fromFormat} to {pair.toFormat}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
              {pair.shortDescription}
            </p>
          </div>

          <label className="state-select-label">
            Other Converters:
            <select
              value={pairId}
              onChange={(e) => {
                setPairId(e.target.value);
                setDownloadUrl(null);
                setConvertedText("");
              }}
              className="state-select"
            >
              {FORMAT_PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fromExt.toUpperCase()} to {p.toExt.toUpperCase()} ({p.category})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {pair.category === "image" ? (
        /* Image Converter Dropzone & Output */
        <div style={{ marginTop: "24px" }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "45px 20px",
              border: "2px dashed #93c5fd",
              borderRadius: "12px",
              background: "#eff6ff",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept={pair.mimeFrom}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
              style={{ display: "none" }}
            />
            <Upload size={32} style={{ color: "#2563eb", margin: "0 auto 12px" }} />
            <h4 style={{ margin: 0, fontSize: "16px" }}>
              Click or drag your {pair.fromExt.toUpperCase()} image here
            </h4>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
              Your image never leaves your device. Processed client-side via HTML5 canvas.
            </p>
          </div>

          {isProcessing && <p style={{ textAlign: "center", marginTop: "14px" }}>Converting image locally…</p>}

          {downloadUrl && (
            <div
              style={{
                marginTop: "20px",
                padding: "20px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong style={{ color: "#16a34a" }}>Conversion Complete!</strong>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569" }}>
                  Ready to download as {fileName}
                </p>
              </div>
              <a href={downloadUrl} download={fileName} className="button large">
                <Download size={16} /> Download {pair.toExt.toUpperCase()}
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Data / Code Text Area Converter */
        <div className="calc-layout-grid" style={{ marginTop: "24px" }}>
          <div className="input-panel">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Paste {pair.fromFormat}:</label>
            </div>
            <textarea
              rows={12}
              value={inputText}
              placeholder={`Paste your ${pair.fromFormat} source here...`}
              onChange={(e) => handleDataConvert(e.target.value)}
              style={{
                width: "100%",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
              }}
            />
          </div>

          <div className="results-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Converted {pair.toFormat}:</label>
              <button
                type="button"
                className="button secondary"
                onClick={handleCopy}
                disabled={!convertedText}
                style={{ padding: "4px 10px", fontSize: "11px", minHeight: "28px" }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              rows={12}
              readOnly
              value={convertedText}
              placeholder={`Converted ${pair.toFormat} appears here...`}
              style={{
                width: "100%",
                fontFamily: "monospace",
                fontSize: "12px",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#f8fafc",
              }}
            />
          </div>
        </div>
      )}

      <div className="engine-footer-note">
        <ShieldCheck size={16} />
        <span>100% In-Browser Transformation. Zero bytes sent to any remote server.</span>
      </div>
    </div>
  );
}
