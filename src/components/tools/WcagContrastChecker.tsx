"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

export default function WcagContrastChecker() {
  const [textColor, setTextColor] = useState("#1e293b");
  const [bgColor, setBgColor] = useState("#ffffff");

  // Parse hex to RGB
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const clean = hex.replace("#", "").trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    if (clean.length === 6) {
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16),
      ];
    }
    return null;
  };

  // Relative luminance
  const luminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const rgb1 = hexToRgb(textColor);
  const rgb2 = hexToRgb(bgColor);

  let ratio = 1;
  if (rgb1 && rgb2) {
    const l1 = luminance(...rgb1);
    const l2 = luminance(...rgb2);
    ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const passNormalAa = ratio >= 4.5;
  const passNormalAaa = ratio >= 7.0;
  const passLargeAa = ratio >= 3.0;
  const passLargeAaa = ratio >= 4.5;
  const passUi = ratio >= 3.0;

  return (
    <div className="tool-panel">
      <h3 className="text-lg font-semibold mb-2">WCAG 2.2 Color Contrast & ADA Accessibility Checker</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Calculate WCAG 2.2 AA and AAA contrast ratios for normal text, large headings, and graphical interface components.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <label className="field">
          Text / Foreground Color
          <div className="flex gap-2 items-center">
            <input
              type="color"
              className="w-10 h-9 p-0 border rounded cursor-pointer"
              value={textColor}
              onChange={e => setTextColor(e.target.value)}
            />
            <input
              type="text"
              className="font-mono text-xs flex-1"
              value={textColor}
              onChange={e => setTextColor(e.target.value)}
            />
          </div>
        </label>
        <label className="field">
          Background Color
          <div className="flex gap-2 items-center">
            <input
              type="color"
              className="w-10 h-9 p-0 border rounded cursor-pointer"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
            />
            <input
              type="text"
              className="font-mono text-xs flex-1"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
            />
          </div>
        </label>
      </div>

      {/* Live Preview Stage */}
      <div
        className="p-6 rounded-lg border my-4 transition-colors text-center"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>
          Large Heading Preview (18pt+ or 14pt bold)
        </h4>
        <p className="text-sm m-0" style={{ color: textColor }}>
          Standard body text preview. Good typography ensures all users, including those with visual impairments, can comfortably read your content without eye strain.
        </p>
      </div>

      {/* Contrast Ratio Result */}
      <div className="result-panel my-4 text-center">
        <p className="m-0 text-sm opacity-80">Calculated Contrast Ratio</p>
        <strong className="big-result text-4xl font-bold my-1 block text-blue-600 dark:text-blue-400">
          {ratio.toFixed(2)} : 1
        </strong>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 text-xs">
          <div className={`p-2 rounded border flex flex-col items-center ${passNormalAa ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            <span>Normal Text AA</span>
            <strong className="flex items-center gap-1 mt-1">
              {passNormalAa ? <Check size={14} /> : <X size={14} />} {passNormalAa ? "Pass (4.5:1)" : "Fail"}
            </strong>
          </div>
          <div className={`p-2 rounded border flex flex-col items-center ${passNormalAaa ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            <span>Normal Text AAA</span>
            <strong className="flex items-center gap-1 mt-1">
              {passNormalAaa ? <Check size={14} /> : <X size={14} />} {passNormalAaa ? "Pass (7:1)" : "Fail"}
            </strong>
          </div>
          <div className={`p-2 rounded border flex flex-col items-center ${passLargeAa ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            <span>Large Text AA</span>
            <strong className="flex items-center gap-1 mt-1">
              {passLargeAa ? <Check size={14} /> : <X size={14} />} {passLargeAa ? "Pass (3:1)" : "Fail"}
            </strong>
          </div>
          <div className={`p-2 rounded border flex flex-col items-center ${passLargeAaa ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            <span>Large Text AAA</span>
            <strong className="flex items-center gap-1 mt-1">
              {passLargeAaa ? <Check size={14} /> : <X size={14} />} {passLargeAaa ? "Pass (4.5:1)" : "Fail"}
            </strong>
          </div>
          <div className={`p-2 rounded border flex flex-col items-center ${passUi ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            <span>UI & Icons</span>
            <strong className="flex items-center gap-1 mt-1">
              {passUi ? <Check size={14} /> : <X size={14} />} {passUi ? "Pass (3:1)" : "Fail"}
            </strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Follows W3C WCAG 2.2 relative luminance specifications. Essential for Section 508 and ADA website compliance audits.
      </p>
    </div>
  );
}
