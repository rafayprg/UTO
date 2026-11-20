import type { TextOp } from "./types";
import { advancedImageOps } from "./image-media-advanced.ts";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (isNaN(num) || full.length !== 6) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export const ops: Record<string, TextOp> = {
  "css-linear-gradient": {
    input: { label: "Angle or direction (e.g. 135deg, to right)", example: "135deg", rows: 2 },
    options: [
      { id: "color1", label: "Start Color", type: "color", default: "#3b82f6" },
      { id: "color2", label: "End Color", type: "color", default: "#9333ea" },
      { id: "stop1", label: "Start Stop %", type: "number", default: 0, min: 0, max: 100 },
      { id: "stop2", label: "End Stop %", type: "number", default: 100, min: 0, max: 100 }
    ],
    outputLabel: "CSS Background Property",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const angle = input.trim() || "135deg";
      const c1 = String(options.color1 || "#3b82f6");
      const c2 = String(options.color2 || "#9333ea");
      const s1 = Number(options.stop1 ?? 0);
      const s2 = Number(options.stop2 ?? 100);
      return `background: linear-gradient(${angle}, ${c1} ${s1}%, ${c2} ${s2}%);\n`;
    }
  },

  "css-radial-gradient": {
    input: { label: "Shape and position (e.g. circle at center)", example: "circle at center", rows: 2 },
    options: [
      { id: "color1", label: "Center Color", type: "color", default: "#60a5fa" },
      { id: "color2", label: "Outer Color", type: "color", default: "#1e3a8a" },
      { id: "stop1", label: "Inner Stop %", type: "number", default: 0, min: 0, max: 100 },
      { id: "stop2", label: "Outer Stop %", type: "number", default: 100, min: 0, max: 100 }
    ],
    outputLabel: "CSS Background Property",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const shape = input.trim() || "circle at center";
      const c1 = String(options.color1 || "#60a5fa");
      const c2 = String(options.color2 || "#1e3a8a");
      return `background: radial-gradient(${shape}, ${c1} ${options.stop1 ?? 0}%, ${c2} ${options.stop2 ?? 100}%);\n`;
    }
  },

  "css-conic-gradient": {
    input: { label: "Center position (e.g. from 0deg at 50% 50%)", example: "from 0deg at 50% 50%", rows: 2 },
    options: [
      { id: "color1", label: "Color 1", type: "color", default: "#ef4444" },
      { id: "color2", label: "Color 2", type: "color", default: "#eab308" },
      { id: "color3", label: "Color 3", type: "color", default: "#3b82f6" }
    ],
    outputLabel: "CSS Background Property",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const pos = input.trim() || "from 0deg at 50% 50%";
      const c1 = String(options.color1 || "#ef4444");
      const c2 = String(options.color2 || "#eab308");
      const c3 = String(options.color3 || "#3b82f6");
      return `background: conic-gradient(${pos}, ${c1}, ${c2}, ${c3}, ${c1});\n`;
    }
  },

  "css-box-shadow": {
    input: { label: "Custom Shadow Label / Selector", example: ".card-elevated", rows: 2 },
    options: [
      { id: "x", label: "Horizontal Offset (px)", type: "number", default: 0 },
      { id: "y", label: "Vertical Offset (px)", type: "number", default: 10 },
      { id: "blur", label: "Blur Radius (px)", type: "number", default: 25, min: 0 },
      { id: "spread", label: "Spread Radius (px)", type: "number", default: -5 },
      { id: "color", label: "Shadow Color (rgba or hex)", type: "text", default: "rgba(0, 0, 0, 0.15)" },
      { id: "inset", label: "Inset Shadow", type: "checkbox", default: false }
    ],
    outputLabel: "CSS Box Shadow Rules",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const sel = input.trim() || ".box-shadow";
      const inset = options.inset ? "inset " : "";
      const val = `${inset}${options.x}px ${options.y}px ${options.blur}px ${options.spread}px ${options.color}`;
      return `${sel} {\n  box-shadow: ${val};\n}\n`;
    }
  },

  "css-glassmorphism": {
    input: { label: "Selector Name", example: ".glass-panel", rows: 2 },
    options: [
      { id: "blur", label: "Backdrop Blur (px)", type: "number", default: 16, min: 0, max: 40 },
      { id: "opacity", label: "Background Alpha (0.0 - 1.0)", type: "number", default: 0.25, min: 0, max: 1, step: 0.05 },
      { id: "borderOpacity", label: "Border Highlight Alpha", type: "number", default: 0.18, min: 0, max: 1, step: 0.05 }
    ],
    outputLabel: "Glassmorphism CSS Rules",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const sel = input.trim() || ".glass-card";
      const b = Number(options.blur || 16);
      const a = Number(options.opacity || 0.25);
      const ba = Number(options.borderOpacity || 0.18);
      return `${sel} {\n  background: rgba(255, 255, 255, ${a});\n  backdrop-filter: blur(${b}px);\n  -webkit-backdrop-filter: blur(${b}px);\n  border: 1px solid rgba(255, 255, 255, ${ba});\n  border-radius: 12px;\n  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);\n}\n`;
    }
  },

  "css-neumorphism": {
    input: { label: "Base surface hex color", example: "#e0e5ec", rows: 2 },
    options: [
      { id: "size", label: "Offset Distance (px)", type: "number", default: 9, min: 2, max: 30 },
      { id: "blur", label: "Blur Radius (px)", type: "number", default: 16, min: 2, max: 50 },
      { id: "type", label: "Surface Type", type: "select", choices: [["flat", "Flat Extruded"], ["pressed", "Pressed Inset"]], default: "flat" }
    ],
    outputLabel: "Neumorphic CSS Rules",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const hex = input.trim() || "#e0e5ec";
      const dist = Number(options.size || 9);
      const blur = Number(options.blur || 16);
      const isPressed = options.type === "pressed";
      const pre = isPressed ? "inset " : "";
      return `.neumorphic-box {\n  background: ${hex};\n  border-radius: 16px;\n  box-shadow: ${pre}${dist}px ${dist}px ${blur}px #b8b9be, ${pre}-${dist}px -${dist}px ${blur}px #ffffff;\n}\n`;
    }
  },

  "css-border-radius-blob": {
    input: { label: "CSS Selector", example: ".organic-blob", rows: 2 },
    options: [
      { id: "tl", label: "Top-Left Radius %", type: "number", default: 60, min: 10, max: 90 },
      { id: "tr", label: "Top-Right Radius %", type: "number", default: 40, min: 10, max: 90 },
      { id: "br", label: "Bottom-Right Radius %", type: "number", default: 30, min: 10, max: 90 },
      { id: "bl", label: "Bottom-Left Radius %", type: "number", default: 70, min: 10, max: 90 }
    ],
    outputLabel: "8-Point Blob Border-Radius",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const sel = input.trim() || ".blob";
      const tl = Number(options.tl || 60);
      const tr = Number(options.tr || 40);
      const br = Number(options.br || 30);
      const bl = Number(options.bl || 70);
      const val = `${tl}% ${100 - tl}% ${br}% ${100 - br}% / ${100 - tr}% ${bl}% ${100 - bl}% ${tr}%`;
      return `${sel} {\n  border-radius: ${val};\n}\n`;
    }
  },

  "css-aspect-ratio-calc": {
    input: { label: "Target Dimensions (Width x Height, e.g. 1920x1080)", example: "1920x1080", rows: 2 },
    outputLabel: "CSS Aspect Ratio & Responsive Rules",
    outputExt: "css",
    run(input) {
      const parts = input.split(/x|\*|\//i).map(s => parseFloat(s.trim()));
      const w = parts[0] || 16;
      const h = parts[1] || 9;
      const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
      const d = gcd(Math.round(w), Math.round(h));
      const simpW = Math.round(w / d);
      const simpH = Math.round(h / d);
      const percent = ((h / w) * 100).toFixed(4);
      return `/* Modern CSS aspect-ratio */\n.aspect-box {\n  aspect-ratio: ${simpW} / ${simpH};\n}\n\n/* Legacy responsive padding-top hack */\n.aspect-wrapper {\n  position: relative;\n  width: 100%;\n  padding-top: ${percent}%; /* ${h} / ${w} */\n}\n.aspect-wrapper > * {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n}\n`;
    }
  },

  "css-filter-effects": {
    input: { label: "Selector Name", example: ".filtered-image", rows: 2 },
    options: [
      { id: "blur", label: "Blur (px)", type: "number", default: 0, min: 0, max: 20 },
      { id: "brightness", label: "Brightness %", type: "number", default: 110, min: 0, max: 200 },
      { id: "contrast", label: "Contrast %", type: "number", default: 105, min: 0, max: 200 },
      { id: "grayscale", label: "Grayscale %", type: "number", default: 0, min: 0, max: 100 },
      { id: "sepia", label: "Sepia %", type: "number", default: 0, min: 0, max: 100 },
      { id: "hue", label: "Hue Rotate (deg)", type: "number", default: 0, min: 0, max: 360 }
    ],
    outputLabel: "CSS Filter Declarations",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const sel = input.trim() || ".filter-effect";
      const filters = [
        Number(options.blur) > 0 ? `blur(${options.blur}px)` : "",
        Number(options.brightness) !== 100 ? `brightness(${options.brightness}%)` : "",
        Number(options.contrast) !== 100 ? `contrast(${options.contrast}%)` : "",
        Number(options.grayscale) > 0 ? `grayscale(${options.grayscale}%)` : "",
        Number(options.sepia) > 0 ? `sepia(${options.sepia}%)` : "",
        Number(options.hue) > 0 ? `hue-rotate(${options.hue}deg)` : ""
      ].filter(Boolean).join(" ") || "none";
      return `${sel} {\n  filter: ${filters};\n}\n`;
    }
  },

  "css-clip-path-generator": {
    input: { label: "Selector Name", example: ".clipped-banner", rows: 2 },
    options: [
      { id: "shape", label: "Clip Path Shape", type: "select", choices: [
        ["triangle", "Triangle (polygon)"],
        ["trapezoid", "Trapezoid (polygon)"],
        ["hexagon", "Hexagon (polygon)"],
        ["circle", "Circle"],
        ["ellipse", "Ellipse"]
      ], default: "triangle" }
    ],
    outputLabel: "CSS clip-path property",
    outputExt: "css",
    preview: "css",
    run(input, options) {
      const sel = input.trim() || ".clip-path-item";
      let val = "polygon(50% 0%, 0% 100%, 100% 100%)";
      if (options.shape === "trapezoid") val = "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)";
      else if (options.shape === "hexagon") val = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
      else if (options.shape === "circle") val = "circle(50% at 50% 50%)";
      else if (options.shape === "ellipse") val = "ellipse(50% 35% at 50% 50%)";
      return `${sel} {\n  clip-path: ${val};\n}\n`;
    }
  },

  "svg-placeholder-generator": {
    input: { label: "Placeholder text label", example: "800 × 400", rows: 2 },
    options: [
      { id: "width", label: "Width (px)", type: "number", default: 800 },
      { id: "height", label: "Height (px)", type: "number", default: 400 },
      { id: "bg", label: "Background Color", type: "color", default: "#e2e8f0" },
      { id: "fg", label: "Text Color", type: "color", default: "#64748b" }
    ],
    outputLabel: "Inline SVG & Data URI",
    outputExt: "svg",
    run(input, options) {
      const label = input.trim() || `${options.width} × ${options.height}`;
      const w = Number(options.width || 800);
      const h = Number(options.height || 400);
      const bg = String(options.bg || "#e2e8f0");
      const fg = String(options.fg || "#64748b");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <rect width="${w}" height="${h}" fill="${bg}"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="system-ui, sans-serif" font-size="24" font-weight="600">${label}</text>\n</svg>`;
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      return `<!-- Raw SVG -->\n${svg}\n\n<!-- Data URI -->\n${dataUri}\n`;
    }
  },

  "svg-wave-divider": {
    input: { label: "Wave SVG fill hex color", example: "#3b82f6", rows: 2 },
    options: [
      { id: "height", label: "Wave Height (px)", type: "number", default: 120, min: 40, max: 300 },
      { id: "flip", label: "Invert / Flip Vertically", type: "checkbox", default: false }
    ],
    outputLabel: "Responsive SVG Wave Markup",
    outputExt: "svg",
    run(input, options) {
      const fill = input.trim() || "#3b82f6";
      const h = Number(options.height || 120);
      const transform = options.flip ? ' transform="rotate(180 720 60)"' : "";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 ${h}" preserveAspectRatio="none">\n  <path fill="${fill}"${transform} d="M0,32L48,48C96,64,192,96,288,96C384,96,480,64,576,48C672,32,768,32,864,48C960,64,1056,96,1152,96C1248,96,1344,64,1392,48L1440,32L1440,${h}L1392,${h}C1344,${h},1248,${h},1152,${h}C1056,${h},960,${h},864,${h}C768,${h},672,${h},576,${h}C480,${h},384,${h},288,${h}C192,${h},96,${h},48,${h}L0,${h}Z"></path>\n</svg>\n`;
    }
  },

  "hex-to-rgb-hsl-converter": {
    input: { label: "Hex Color (e.g. #3b82f6)", example: "#3b82f6", rows: 2 },
    outputLabel: "Color Formats (RGB, HSL, CSS)",
    outputExt: "txt",
    run(input) {
      const [r, g, b] = hexToRgb(input);
      const [h, s, l] = rgbToHsl(r, g, b);
      return [
        `HEX: ${input.trim()}`,
        `RGB: rgb(${r}, ${g}, ${b})`,
        `RGBA: rgba(${r}, ${g}, ${b}, 1)`,
        `HSL: hsl(${h}, ${s}%, ${l}%)`,
        `HSLA: hsla(${h}, ${s}%, ${l}%, 1)`,
        `Normalized: ${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}`
      ].join("\n") + "\n";
    }
  },

  "color-shades-tints": {
    input: { label: "Base Hex Color", example: "#3b82f6", rows: 2 },
    outputLabel: "10-Step Palette (Shades & Tints)",
    outputExt: "txt",
    run(input) {
      const [r, g, b] = hexToRgb(input);
      const palette: string[] = ["=== 10-Step Palette ==="];
      // Tints (lighter)
      for (let i = 4; i >= 1; i--) {
        const factor = i * 0.2;
        const tr = Math.round(r + (255 - r) * factor);
        const tg = Math.round(g + (255 - g) * factor);
        const tb = Math.round(b + (255 - b) * factor);
        const hex = `#${((1 << 24) + (tr << 16) + (tg << 8) + tb).toString(16).slice(1)}`;
        palette.push(`Tint +${(factor * 100).toFixed(0)}%: ${hex} (rgb(${tr}, ${tg}, ${tb}))`);
      }
      palette.push(`Base: ${input.trim()} (rgb(${r}, ${g}, ${b}))`);
      // Shades (darker)
      for (let i = 1; i <= 4; i++) {
        const factor = 1 - (i * 0.2);
        const sr = Math.round(r * factor);
        const sg = Math.round(g * factor);
        const sb = Math.round(b * factor);
        const hex = `#${((1 << 24) + (sr << 16) + (sg << 8) + sb).toString(16).slice(1)}`;
        palette.push(`Shade -${((1 - factor) * 100).toFixed(0)}%: ${hex} (rgb(${sr}, ${sg}, ${sb}))`);
      }
      return palette.join("\n") + "\n";
    }
  },

  "wcag-contrast-ratio-calc": {
    input: { label: "Foreground Text Color (Hex)", example: "#1e3a8a", rows: 2 },
    options: [{ id: "bg", label: "Background Color (Hex)", type: "color", default: "#ffffff" }],
    outputLabel: "WCAG 2.1 Contrast Analysis",
    outputExt: "txt",
    run(input, options) {
      const fg = hexToRgb(input);
      const bg = hexToRgb(String(options.bg || "#ffffff"));
      const l1 = luminance(fg[0], fg[1], fg[2]);
      const l2 = luminance(bg[0], bg[1], bg[2]);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      const ratio = (lighter + 0.05) / (darker + 0.05);
      const rStr = ratio.toFixed(2) + ":1";

      const aaNormal = ratio >= 4.5 ? "PASS" : "FAIL";
      const aaLarge = ratio >= 3.0 ? "PASS" : "FAIL";
      const aaaNormal = ratio >= 7.0 ? "PASS" : "FAIL";
      const aaaLarge = ratio >= 4.5 ? "PASS" : "FAIL";

      return [
        `Contrast Ratio: ${rStr}`,
        "",
        `• WCAG AA Normal Text (>= 4.5:1): ${aaNormal}`,
        `• WCAG AA Large Text (>= 3.0:1): ${aaLarge}`,
        `• WCAG AAA Normal Text (>= 7.0:1): ${aaaNormal}`,
        `• WCAG AAA Large Text (>= 4.5:1): ${aaaLarge}`,
        "",
        `Verdict: ${ratio >= 4.5 ? "Compliant for standard body text." : ratio >= 3.0 ? "Compliant for large/heading text only." : "Fails accessibility requirements; increase contrast."}`
      ].join("\n") + "\n";
    }
  },

  ...advancedImageOps,
};
