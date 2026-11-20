import { Clock3, UploadCloud, Camera, Mic, MonitorUp, Type } from "lucide-react";
import type { PlannedInput } from "@/lib/catalog/types";
import type { ToolDefinition } from "@/lib/tools-registry";

const INPUTS: Record<PlannedInput, { label: string; accept: string }> = {
  pdf: { label: "PDF files", accept: "PDF" },
  image: { label: "Images", accept: "PNG, JPG, WebP, GIF" },
  video: { label: "Video files", accept: "MP4, WebM, MOV" },
  audio: { label: "Audio files", accept: "MP3, WAV, OGG, M4A" },
  text: { label: "Text", accept: "Typed or pasted text" },
  csv: { label: "CSV or TSV files", accept: "CSV, TSV" },
  spreadsheet: { label: "Spreadsheets", accept: "XLSX, CSV" },
  database: { label: "Database files", accept: "SQLite .db, CSV" },
  camera: { label: "Camera", accept: "Your device camera" },
  microphone: { label: "Microphone", accept: "Your device microphone" },
  screen: { label: "Screen or webcam", accept: "Screen share and camera" },
};

function InputIcon({ kind }: { kind: PlannedInput }) {
  if (kind === "camera") return <Camera aria-hidden="true"/>;
  if (kind === "microphone") return <Mic aria-hidden="true"/>;
  if (kind === "screen") return <MonitorUp aria-hidden="true"/>;
  if (kind === "text") return <Type aria-hidden="true"/>;
  return <UploadCloud aria-hidden="true"/>;
}

/** Frontend preview of a tool whose processing engine is added in a later phase. Nothing here accepts or sends data. */
export default function PlannedTool({ tool }: { tool: ToolDefinition }) {
  const kind = tool.plannedInput ?? "text";
  const input = INPUTS[kind];
  return <div className="tool-panel planned-tool">
    <div className="planned-banner" role="note"><Clock3 aria-hidden="true"/><div><strong>Coming soon</strong><p>The workspace below shows how this tool will work. Its processing engine ({tool.plannedEngine}) is added in a later phase, so it cannot process files yet.</p></div></div>
    {kind === "text"
      ? <div className="field"><label htmlFor={`${tool.slug}-planned`}>Your text</label><textarea id={`${tool.slug}-planned`} rows={6} disabled placeholder="Available when this tool goes live."/></div>
      : <div className="dropzone is-disabled" aria-disabled="true"><InputIcon kind={kind}/><strong>{input.label}</strong><span>{input.accept} · processed in your browser when live</span></div>}
    <div className="toolbar"><button type="button" className="button" disabled>Process</button><span className="hint">No files are accepted or uploaded on this page yet.</span></div>
  </div>;
}
