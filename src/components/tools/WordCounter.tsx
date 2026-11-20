"use client";
import { useMemo, useState } from "react";
import { MAX_TEXT_LENGTH, textStatistics } from "@/lib/native-tools";
import { copyText, downloadText } from "@/lib/native-download";

export default function WordCounter() {
  const [text, setText] = useState(""); const [wpm, setWpm] = useState(200); const [notice, setNotice] = useState("");
  const tooLong = text.length > MAX_TEXT_LENGTH;
  const stats = useMemo(() => textStatistics(tooLong ? "" : text, wpm), [text, wpm, tooLong]);
  const reading = `${Math.floor(stats.readingSeconds / 60)}m ${stats.readingSeconds % 60}s`;
  const summary = `${stats.words} words\n${stats.characters} characters\n${stats.withoutSpaces} characters without whitespace\n${stats.sentences} sentences\n${stats.paragraphs} paragraphs\n${stats.syllables} approximate English syllables\nReading time: ${reading} at ${wpm} WPM\nFlesch Reading Ease: ${stats.readingEase?.toFixed(1) ?? "Not available"}\nFlesch-Kincaid grade: ${stats.grade?.toFixed(1) ?? "Not available"}`;
  return <div className="tool-panel"><div className="toolbar"><div><h2>Give your writing a quick check</h2><p className="hint">Counts update as you type. Nothing is saved outside this tab.</p></div><button className="button secondary" onClick={() => { setText(""); setNotice(""); }}>Clear text</button></div>
    <div className="field"><label htmlFor="word-text">Your text</label><textarea id="word-text" rows={12} value={text} onChange={event => { setText(event.target.value); setNotice(""); }} aria-describedby="readability-note word-limit" placeholder="Paste a draft, script, article, or a few words…"/></div>
    {tooLong && <p id="word-limit" className="error-message" role="alert">Text exceeds 1,000,000 characters. Reduce it to enable analysis.</p>}
    <div className="stats-grid" aria-label="Text statistics">{[["Words", stats.words], ["Characters", stats.characters], ["Without whitespace", stats.withoutSpaces], ["Sentences", stats.sentences], ["Paragraphs", stats.paragraphs], ["UTF-16 code units", stats.codeUnits]].map(([label, value]) => <div className="stat" key={label}><strong>{tooLong ? "—" : Number(value).toLocaleString()}</strong><span>{label}</span></div>)}</div>
    <div className="form-grid"><div className="field"><label htmlFor="reading-wpm">Reading speed: {wpm} words/minute</label><input id="reading-wpm" type="range" min="80" max="500" step="10" value={wpm} onChange={event => setWpm(Number(event.target.value))}/><p className="status-message">Estimated reading time: <strong>{tooLong ? "—" : reading}</strong></p></div><div className="result-panel"><h3>English readability estimates</h3><p>Flesch Reading Ease: <strong>{stats.readingEase?.toFixed(1) ?? "—"}</strong></p><p>Flesch-Kincaid grade: <strong>{stats.grade?.toFixed(1) ?? "—"}</strong></p><p>Approximate syllables: {stats.syllables}</p></div></div>
    <p id="readability-note" className="hint">Readability uses approximate English syllable and sentence counts; abbreviations, names, and short samples can skew results. These formulas are not a quality score and should not be used for other languages. Characters count grapheme clusters where supported, so a combined emoji can count as one.</p>
    <div className="toolbar"><button className="button secondary" disabled={!text || tooLong} onClick={async () => { try { await copyText(summary); setNotice("Statistics copied."); } catch { setNotice("Clipboard unavailable. Download the statistics instead."); } }}>Copy statistics</button><button className="button secondary" disabled={!text || tooLong} onClick={() => downloadText(summary, "text-statistics.txt")}>Download statistics</button><button className="button secondary" disabled={!text} onClick={() => downloadText(text, "writing.txt")}>Download text</button></div>{notice && <p role="status" className="status-message">{notice}</p>}
  </div>;
}
