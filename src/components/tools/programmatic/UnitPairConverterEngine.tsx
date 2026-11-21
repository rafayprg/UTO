"use client";

import { useState, useMemo } from "react";
import { UNIT_PAIRS } from "@/data/programmatic/unit-pairs";
import type { ToolDefinition } from "@/lib/tools-registry";
import { ArrowLeftRight, ShieldCheck } from "lucide-react";

interface PresetData {
  pairId?: string;
}

export default function UnitPairConverterEngine({ tool }: { tool: ToolDefinition }) {
  const preset = (tool.preset || {}) as PresetData;
  const initialPairId = preset.pairId || "meters-to-feet";

  const [pairId, setPairId] = useState<string>(initialPairId);
  const [fromValue, setFromValue] = useState<number>(10);
  const [isReversed, setIsReversed] = useState<boolean>(false);
  const precision = 4;

  const pair = useMemo(() => {
    return UNIT_PAIRS.find((p) => p.id === pairId) || UNIT_PAIRS[0];
  }, [pairId]);

  const activeFromUnit = isReversed ? pair.toName : pair.fromName;
  const activeFromSymbol = isReversed ? pair.toSymbol : pair.fromSymbol;
  const activeToUnit = isReversed ? pair.fromName : pair.toName;
  const activeToSymbol = isReversed ? pair.fromSymbol : pair.toSymbol;

  // Conversion math
  const convertedValue = useMemo(() => {
    if (pair.customConvert) {
      return pair.customConvert(fromValue, isReversed);
    }
    if (isReversed) {
      return fromValue / pair.factor;
    }
    return fromValue * pair.factor;
  }, [fromValue, isReversed, pair]);

  // Quick lookup table
  const lookupTable = useMemo(() => {
    const samples = [1, 2, 5, 10, 20, 50, 100, 250, 500];
    return samples.map((val) => {
      let res = 0;
      if (pair.customConvert) {
        res = pair.customConvert(val, isReversed);
      } else {
        res = isReversed ? val / pair.factor : val * pair.factor;
      }
      return { val, res };
    });
  }, [pair, isReversed]);

  return (
    <div className="unit-pair-engine">
      {/* Engine Switcher */}
      <div className="engine-card">
        <div className="card-row-between">
          <div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              {activeFromUnit} to {activeToUnit} Converter
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
              {pair.formulaDescription}
            </p>
          </div>

          <label className="state-select-label">
            Other Unit Pairs:
            <select
              value={pairId}
              onChange={(e) => {
                setPairId(e.target.value);
                setIsReversed(false);
              }}
              className="state-select"
            >
              {UNIT_PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fromName} ↔ {p.toName} ({p.category})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Main Conversion Cards */}
      <div className="calc-layout-grid" style={{ alignItems: "center" }}>
        {/* Left: Input */}
        <div className="input-panel" style={{ flex: 1 }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
            From ({activeFromUnit} - {activeFromSymbol})
          </label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              step="any"
              value={fromValue}
              onChange={(e) => setFromValue(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                fontSize: "22px",
                fontWeight: 700,
                padding: "12px 14px",
                border: "2px solid #cbd5e1",
                borderRadius: "8px",
              }}
            />
            <span style={{ position: "absolute", right: "14px", top: "14px", fontWeight: 700, color: "#94a3b8" }}>
              {activeFromSymbol}
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="button secondary"
            style={{ borderRadius: "50%", width: "44px", height: "44px", padding: 0 }}
            onClick={() => setIsReversed(!isReversed)}
            title="Swap units"
          >
            <ArrowLeftRight size={18} />
          </button>
        </div>

        {/* Right: Output */}
        <div className="results-panel" style={{ flex: 1 }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
            To ({activeToUnit} - {activeToSymbol})
          </span>
          <div
            style={{
              marginTop: "8px",
              padding: "12px 14px",
              background: "#eff6ff",
              border: "2px solid #bfdbfe",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "22px", color: "#1d4ed8" }}>
              {convertedValue.toLocaleString("en-US", { maximumFractionDigits: precision })}
            </strong>
            <span style={{ fontWeight: 700, color: "#3b82f6" }}>{activeToSymbol}</span>
          </div>
        </div>
      </div>

      {/* Quick Lookup Conversion Table */}
      <div style={{ marginTop: "32px" }}>
        <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>
          Quick Reference: {activeFromUnit} to {activeToUnit} Table
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table className="specs-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "10px 14px" }}>{activeFromUnit} ({activeFromSymbol})</th>
                <th style={{ textAlign: "left", padding: "10px 14px" }}>{activeToUnit} ({activeToSymbol})</th>
              </tr>
            </thead>
            <tbody>
              {lookupTable.map(({ val, res }) => (
                <tr key={val}>
                  <td style={{ padding: "8px 14px" }}>{val} {activeFromSymbol}</td>
                  <td style={{ padding: "8px 14px", fontWeight: 600, color: "#2563eb" }}>
                    {res.toLocaleString("en-US", { maximumFractionDigits: precision })} {activeToSymbol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="engine-footer-note">
        <ShieldCheck size={16} />
        <span>High-precision mathematical conversion executed 100% locally in your browser.</span>
      </div>
    </div>
  );
}
