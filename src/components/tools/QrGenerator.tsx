"use client";
import { useEffect, useRef, useState } from "react";
import { httpUrl, wifiPayload } from "@/lib/native-tools";
import { downloadBlob, downloadText } from "@/lib/native-download";
type Security = "WPA" | "WEP" | "nopass";
type Level = "L" | "M" | "Q" | "H";

export default function QrGenerator() {
  const [mode, setMode] = useState<"url" | "wifi">("url");
  const [url, setUrl] = useState(""); const [ssid, setSsid] = useState(""); const [password, setPassword] = useState("");
  const [security, setSecurity] = useState<Security>("WPA"); const [hidden, setHidden] = useState(false);
  const [size, setSize] = useState(512); const [level, setLevel] = useState<Level>("M");
  const [result, setResult] = useState<{ png: string; svg: string } | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  useEffect(() => () => { revision.current += 1; }, []);
  function invalidate() { revision.current += 1; setResult(null); setError(""); setBusy(false); }
  async function generate() {
    const current = ++revision.current; setResult(null); setError(""); setBusy(true);
    try {
      const payload = mode === "url" ? httpUrl(url) : wifiPayload(ssid, password, security, hidden);
      if (new TextEncoder().encode(payload).length > 1800) throw new Error("This QR payload is too long. Shorten the URL or credentials.");
      const QRCode = await import("qrcode");
      const options = { errorCorrectionLevel: level, width: size, margin: 4, color: { dark: "#111111", light: "#ffffff" } };
      const [png, svg] = await Promise.all([QRCode.toDataURL(payload, options), QRCode.toString(payload, { ...options, type: "svg" })]);
      if (current === revision.current) setResult({ png, svg });
    } catch (reason) { if (current === revision.current) setError(reason instanceof Error ? reason.message : "Could not generate QR code. Try a shorter value."); }
    finally { if (current === revision.current) setBusy(false); }
  }
  return <div className="tool-panel"><h2>A useful code, made locally</h2><p className="hint">Static codes, no tracking redirects. Your WiFi password is encoded in readable form inside the code.</p>
    <div className="segment-control" aria-label="QR type">{(["url", "wifi"] as const).map(value => <button key={value} className="button secondary" aria-pressed={mode === value} onClick={() => { invalidate(); setMode(value); }}>{value === "url" ? "Website URL" : "WiFi network"}</button>)}</div>
    <form onSubmit={event => { event.preventDefault(); void generate(); }}><div className="form-grid">
      <div>{mode === "url" ? <div className="field"><label htmlFor="qr-url">Website URL</label><input id="qr-url" name="url" type="url" required placeholder="https://example.com" value={url} onChange={event => { invalidate(); setUrl(event.target.value); }} aria-describedby="qr-error"/></div> : <>
        <div className="field"><label htmlFor="qr-ssid">Network name (SSID)</label><input id="qr-ssid" name="ssid" required autoComplete="off" value={ssid} onChange={event => { invalidate(); setSsid(event.target.value); }}/></div>
        <div className="field"><label htmlFor="qr-security">Network security</label><select id="qr-security" value={security} onChange={event => { invalidate(); setSecurity(event.target.value as Security); }}><option value="WPA">WPA / WPA2 / WPA3 Personal</option><option value="WEP">WEP</option><option value="nopass">Open network (no password)</option></select></div>
        {security !== "nopass" && <div className="field"><label htmlFor="qr-password">WiFi password</label><input id="qr-password" name="password" type="password" required autoComplete="off" maxLength={256} value={password} onChange={event => { invalidate(); setPassword(event.target.value); }}/></div>}
        <label><input type="checkbox" checked={hidden} onChange={event => { invalidate(); setHidden(event.target.checked); }}/> Hidden network</label>
      </>}</div>
      <div className="result-panel">{result ? <img src={result.png} alt={`${mode === "wifi" ? "WiFi connection" : "Website"} QR code`} width={256} height={256} style={{ width: "min(100%, 256px)", height: "auto", margin: "auto" }}/> : <div className="empty"><p>{busy ? "Creating your QR code…" : "Your QR preview will appear here."}</p></div>}</div>
    </div><div className="toolbar"><div className="field"><label htmlFor="qr-size">PNG size</label><select id="qr-size" value={size} onChange={event => { invalidate(); setSize(Number(event.target.value)); }}>{[256,512,1024,2048].map(value => <option key={value} value={value}>{value} × {value} px</option>)}</select></div><div className="field"><label htmlFor="qr-level">Error correction</label><select id="qr-level" value={level} onChange={event => { invalidate(); setLevel(event.target.value as Level); }}><option value="L">Low (~7%)</option><option value="M">Medium (~15%)</option><option value="Q">Quartile (~25%)</option><option value="H">High (~30%)</option></select></div><button type="submit" className="button" disabled={busy}>{busy ? "Generating…" : "Generate QR code"}</button></div></form>
    <p id="qr-error" className="error-message" role={error ? "alert" : undefined}>{error}</p>
    {result && <><p className="status-message" role="status">QR code ready. Test it with your phone before sharing or printing.</p><div className="toolbar"><button className="button secondary" onClick={async () => { try { const blob = await (await fetch(result.png)).blob(); downloadBlob(blob, "qr-code.png"); } catch { setError("PNG download failed. Try generating the code again."); } }}>Download PNG</button><button className="button secondary" onClick={() => downloadText(result.svg, "qr-code.svg", "image/svg+xml")}>Download SVG</button></div></>}
  </div>;
}
