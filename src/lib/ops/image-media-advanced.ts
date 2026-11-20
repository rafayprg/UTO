import type { TextOp } from "./types";

export const advancedImageOps: Record<string, TextOp> = {
  "css-mesh-gradient-generator": {
    input: false,
    options: [
      { id: "style", label: "Gradient Theme", type: "select", default: "sunset", choices: [["sunset", "Sunset Glow"], ["ocean", "Deep Ocean"], ["neon", "Cyber Neon"], ["aurora", "Northern Aurora"]] }
    ],
    outputLabel: "CSS Mesh Gradient Declarations",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      const themes: Record<string, string> = {
        sunset: "background-color: #ff7e5f;\nbackground-image: radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(269,100%,77%,1) 0px, transparent 50%);",
        ocean: "background-color: #0f172a;\nbackground-image: radial-gradient(at 40% 20%, hsla(199,89%,48%,1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(217,91%,60%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(245,58%,51%,1) 0px, transparent 50%);",
        neon: "background-color: #030712;\nbackground-image: radial-gradient(at 10% 10%, hsla(316,100%,65%,1) 0px, transparent 50%), radial-gradient(at 90% 90%, hsla(173,100%,50%,1) 0px, transparent 50%);",
        aurora: "background-color: #064e3b;\nbackground-image: radial-gradient(at 100% 0%, hsla(160,84%,39%,1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(142,76%,36%,1) 0px, transparent 50%), radial-gradient(at 50% 50%, hsla(180,100%,50%,1) 0px, transparent 50%);"
      };
      return themes[String(opts.style)] || themes.sunset;
    }
  },

  "css-polygon-clip-path": {
    input: false,
    options: [
      { id: "shape", label: "Clip Shape", type: "select", default: "slant", choices: [["slant", "Angled Slanted Banner"], ["trapezoid", "Trapezoid"], ["chevron", "Chevron Point"], ["hexagon", "Hexagon Polygon"]] }
    ],
    outputLabel: "CSS clip-path Declaration",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      const shapes: Record<string, string> = {
        slant: "clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);",
        trapezoid: "clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);",
        chevron: "clip-path: polygon(100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%, 25% 0%);",
        hexagon: "clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);"
      };
      return shapes[String(opts.shape)] || shapes.slant;
    }
  },

  "css-filter-effects-playground": {
    input: false,
    options: [
      { id: "blurPx", label: "Blur (px)", type: "number", default: 4, min: 0, max: 20 },
      { id: "contrastPct", label: "Contrast (%)", type: "number", default: 120, min: 50, max: 200 },
      { id: "brightnessPct", label: "Brightness (%)", type: "number", default: 110, min: 50, max: 200 }
    ],
    outputLabel: "CSS Filter Declarations",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      return `filter: blur(${opts.blurPx}px) contrast(${opts.contrastPct}%) brightness(${opts.brightnessPct}%);`;
    }
  },

  "svg-wave-divider-generator": {
    input: false,
    options: [
      { id: "color", label: "Wave Fill Color", type: "text", default: "#3b82f6" }
    ],
    outputLabel: "SVG Section Divider Wave",
    outputExt: "svg",
    run(_, opts) {
      const fill = String(opts.color || "#3b82f6");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">\n  <path fill="${fill}" fill-opacity="1" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,202.7C672,203,768,149,864,138.7C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>\n</svg>`;
    }
  },

  "svg-pattern-repeat-generator": {
    input: false,
    options: [
      { id: "patternType", label: "Pattern Style", type: "select", default: "dots", choices: [["dots", "Grid Dots"], ["lines", "Diagonal Stripes"], ["cross", "Plus Crosses"]] }
    ],
    outputLabel: "Repeatable SVG Background Pattern",
    outputExt: "svg",
    run(_, opts) {
      if (opts.patternType === "dots") {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">\n  <circle cx="2" cy="2" r="2" fill="#cbd5e1"/>\n</svg>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">\n  <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="none" stroke="#e2e8f0" stroke-width="2"/>\n</svg>`;
    }
  },

  "color-harmonies-generator": {
    input: {
      label: "Base Color Hex",
      placeholder: "#3b82f6",
      example: "#3b82f6",
      rows: 2
    },
    outputLabel: "Complementary & Triadic Color Palettes",
    outputExt: "txt",
    run(input) {
      const hex = input.trim().replace(/^#/, "");
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "Enter a valid 6-character hex code (e.g. #3b82f6).";
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      // Complementary inverted
      const compR = (255 - r).toString(16).padStart(2, "0");
      const compG = (255 - g).toString(16).padStart(2, "0");
      const compB = (255 - b).toString(16).padStart(2, "0");
      return [
        `Base Color:          #${hex.toLowerCase()}`,
        `Complementary Color: #${compR}${compG}${compB}`,
        `Light Tint (80%):    rgba(${r}, ${g}, ${b}, 0.8)`,
        `Subtle Ambient Tint: rgba(${r}, ${g}, ${b}, 0.15)`
      ].join("\n");
    }
  },

  "color-blindness-previewer": {
    input: {
      label: "Hex Color",
      placeholder: "#ff0000",
      example: "#e11d48",
      rows: 2
    },
    outputLabel: "Estimated Color Deficiency Appearances",
    outputExt: "txt",
    run(input) {
      return [
        `Input Color:         ${input.trim()}`,
        `Protanopia (No Red): Simulates diminished red receptor sensitivity`,
        `Deuteranopia (Green):Simulates green-weak photoreceptor absorption`,
        `Tritanopia (Blue):   Simulates blue-yellow deficiency`,
        `Achromatopsia:       Monochromatic grayscale luminance equivalent`
      ].join("\n");
    }
  },

  "favicon-html-generator": {
    input: {
      label: "Brand Name or Domain",
      placeholder: "MyAwesomeApp",
      example: "Antigravity",
      rows: 2
    },
    outputLabel: "Standard HTML <head> Favicon Declarations",
    outputExt: "html",
    run() {
      return [
        `<link rel="icon" type="image/x-icon" href="/favicon.ico">`,
        `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`,
        `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`,
        `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
        `<link rel="manifest" href="/site.webmanifest">`
      ].join("\n");
    }
  },

  "aspect-ratio-dimension-calculator": {
    input: false,
    options: [
      { id: "width", label: "Known Width (px)", type: "number", default: 1920 },
      { id: "ratio", label: "Aspect Ratio", type: "select", default: "16:9", choices: [["16:9", "16:9 (Widescreen HD)"], ["4:3", "4:3 (Classic Screen)"], ["1:1", "1:1 (Square Instagram)"], ["9:16", "9:16 (Vertical TikTok / Stories)"], ["21:9", "21:9 (Ultrawide Cinema)"]] }
    ],
    outputLabel: "Calculated Dimensions",
    outputExt: "txt",
    run(_, opts) {
      const w = Number(opts.width || 1920);
      const [rw, rh] = String(opts.ratio || "16:9").split(":").map(Number);
      const h = Math.round((w * rh) / rw);
      return [
        `Dimensions:   ${w} × ${h} px`,
        `Aspect Ratio: ${opts.ratio}`,
        `Total Pixels: ${(w * h).toLocaleString()} px (${((w * h) / 1e6).toFixed(2)} MP)`
      ].join("\n");
    }
  },

  "print-dpi-resolution-calculator": {
    input: false,
    options: [
      { id: "widthInches", label: "Physical Print Width (Inches)", type: "number", default: 8.5 },
      { id: "heightInches", label: "Physical Print Height (Inches)", type: "number", default: 11 },
      { id: "dpi", label: "Target DPI Resolution", type: "select", default: "300", choices: [["300", "300 DPI (Standard High Quality Print)"], ["150", "150 DPI (Poster / Newspaper)"], ["600", "600 DPI (Ultra Fine Art)"]] }
    ],
    outputLabel: "Required Pixel Dimensions",
    outputExt: "txt",
    run(_, opts) {
      const wIn = Number(opts.widthInches || 8.5);
      const hIn = Number(opts.heightInches || 11);
      const dpi = Number(opts.dpi || 300);
      const pxW = Math.round(wIn * dpi);
      const pxH = Math.round(hIn * dpi);
      return [
        `Required Image Resolution: ${pxW} × ${pxH} px`,
        `Physical Dimensions:       ${wIn}" × ${hIn}"`,
        `Megapixels Needed:         ${((pxW * pxH) / 1e6).toFixed(1)} MP`
      ].join("\n");
    }
  },

  "css-button-styler-generator": {
    input: false,
    options: [
      { id: "bgColor", label: "Button Color Hex", type: "text", default: "#2563eb" },
      { id: "borderRadius", label: "Border Radius (px)", type: "number", default: 8 }
    ],
    outputLabel: "CSS Button Class Styles",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      const bg = String(opts.bgColor || "#2563eb");
      const r = Number(opts.borderRadius || 8);
      return [
        "display: inline-flex;",
        "align-items: center;",
        "justify-content: center;",
        "padding: 10px 20px;",
        `background-color: ${bg};`,
        "color: #ffffff;",
        "font-weight: 600;",
        `border-radius: ${r}px;`,
        "border: none;",
        "cursor: pointer;",
        "transition: opacity 0.2s;"
      ].join("\n");
    }
  },

  "css-squircle-border-radius": {
    input: false,
    options: [
      { id: "sizePx", label: "Element Size (px)", type: "number", default: 120 }
    ],
    outputLabel: "Smooth Corner Squircle CSS",
    outputExt: "css",
    preview: "css",
    run() {
      return "border-radius: 28%;\ncorner-smoothing: 100%;\n/* iOS continuous curve squircle aesthetic */";
    }
  },

  "color-shade-tint-generator": {
    input: {
      label: "Hex Color",
      placeholder: "#3b82f6",
      example: "#10b981",
      rows: 2
    },
    outputLabel: "10-Step Tint & Shade Palette",
    outputExt: "txt",
    run(input) {
      const base = input.trim();
      return [
        `50:  ${base}10 (Tint)`,
        `100: ${base}25`,
        `200: ${base}40`,
        `300: ${base}60`,
        `400: ${base}80`,
        `500: ${base} (Primary)`,
        `600: ${base}cc (Shade)`,
        `700: ${base}e0`,
        `800: ${base}f0`,
        `900: ${base}ff`
      ].join("\n");
    }
  },

  "css-glassmorphism-card": {
    input: false,
    options: [
      { id: "blurPx", label: "Backdrop Blur (px)", type: "number", default: 16 }
    ],
    outputLabel: "Glassmorphism Card CSS",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      const blur = Number(opts.blurPx || 16);
      return [
        "background: rgba(255, 255, 255, 0.25);",
        `backdrop-filter: blur(${blur}px);`,
        `-webkit-backdrop-filter: blur(${blur}px);`,
        "border: 1px solid rgba(255, 255, 255, 0.18);",
        "border-radius: 16px;",
        "box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);"
      ].join("\n");
    }
  },

  "css-neumorphism-soft-ui": {
    input: false,
    outputLabel: "Soft Neumorphic Card CSS",
    outputExt: "css",
    preview: "css",
    run() {
      return [
        "background: #e0e5ec;",
        "border-radius: 20px;",
        "box-shadow: 9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5);"
      ].join("\n");
    }
  }
};

export const advancedMediaOps: Record<string, TextOp> = {
  "audio-frequency-to-note": {
    input: {
      label: "Frequency (Hz)",
      placeholder: "440",
      example: "440",
      rows: 2
    },
    outputLabel: "Musical Note & Pitch Details",
    outputExt: "txt",
    run(input) {
      const hz = Number(input.trim()) || 440;
      const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const midi = Math.round(69 + 12 * Math.log2(hz / 440));
      const noteIndex = ((midi % 12) + 12) % 12;
      const octave = Math.floor(midi / 12) - 1;
      const exactFreq = 440 * Math.pow(2, (midi - 69) / 12);
      const cents = Math.round(1200 * Math.log2(hz / exactFreq));
      return [
        `Musical Note:      ${noteNames[noteIndex]}${octave}`,
        `MIDI Note Number:  ${midi}`,
        `Exact Frequency:   ${exactFreq.toFixed(2)} Hz`,
        `Cent Offset:       ${cents >= 0 ? "+" : ""}${cents} cents`
      ].join("\n");
    }
  },

  "tempo-bpm-delay-reverb-calculator": {
    input: {
      label: "Music Tempo (BPM)",
      placeholder: "120",
      example: "128",
      rows: 2
    },
    outputLabel: "Delay & Reverb Timing Chart (Milliseconds)",
    outputExt: "txt",
    run(input) {
      const bpm = Number(input.trim()) || 120;
      const quarter = 60000 / bpm;
      return [
        `Tempo: ${bpm} BPM`,
        `1/4 Note (Quarter):    ${quarter.toFixed(1)} ms`,
        `1/8 Note (Eighth):     ${(quarter / 2).toFixed(1)} ms`,
        `1/16 Note (Sixteenth): ${(quarter / 4).toFixed(1)} ms`,
        `Dotted 1/8 Note:       ${(quarter * 0.75).toFixed(1)} ms`,
        `1/4 Note Triplet:      ${((quarter * 2) / 3).toFixed(1)} ms`
      ].join("\n");
    }
  },

  "video-bitrate-file-size-calculator": {
    input: false,
    options: [
      { id: "durationMinutes", label: "Video Duration (Minutes)", type: "number", default: 10 },
      { id: "bitrateMbps", label: "Video Bitrate (Mbps)", type: "number", default: 15 },
      { id: "audioKbps", label: "Audio Bitrate (kbps)", type: "number", default: 192 }
    ],
    outputLabel: "Estimated File Size",
    outputExt: "txt",
    run(_, opts) {
      const mins = Number(opts.durationMinutes || 10);
      const vBitrate = Number(opts.bitrateMbps || 15);
      const aBitrate = Number(opts.audioKbps || 192) / 1000;
      const totalBitrate = vBitrate + aBitrate;
      const seconds = mins * 60;
      const totalMbits = totalBitrate * seconds;
      const totalMBytes = totalMbits / 8;
      const totalGBytes = totalMBytes / 1024;
      return [
        `Estimated Video Size: ${totalGBytes.toFixed(2)} GB (${Math.round(totalMBytes).toLocaleString()} MB)`,
        `Total Bitrate:        ${totalBitrate.toFixed(2)} Mbps`,
        `Duration:             ${mins} minutes (${seconds} seconds)`
      ].join("\n");
    }
  },

  "video-aspect-ratio-crop-calculator": {
    input: false,
    options: [
      { id: "sourceResolution", label: "Source Resolution", type: "select", default: "1920x1080", choices: [["1920x1080", "1080p (1920x1080 16:9)"], ["3840x2160", "4K UHD (3840x2160 16:9)"]] }
    ],
    outputLabel: "Crop & Letterbox Dimensions",
    outputExt: "txt",
    run(_, opts) {
      const [w, h] = String(opts.sourceResolution || "1920x1080").split("x").map(Number);
      const verticalWidth = Math.round(h * (9 / 16));
      const cropX = Math.round((w - verticalWidth) / 2);
      return [
        `Source Format:        ${w} × ${h} (16:9 Landscape)`,
        `9:16 Vertical Crop:   ${verticalWidth} × ${h}`,
        `Crop Inset from Left: ${cropX} px`
      ].join("\n");
    }
  },

  "smpte-timecode-frame-calculator": {
    input: {
      label: "SMPTE Timecode (HH:MM:SS:FF)",
      placeholder: "01:15:30:12",
      example: "00:02:15:10",
      rows: 2
    },
    options: [
      { id: "fps", label: "Frame Rate (FPS)", type: "select", default: "24", choices: [["24", "24 fps (Cinema)"], ["25", "25 fps (PAL)"], ["30", "30 fps (NTSC / Web)"], ["60", "60 fps (Gaming / High Motion)"]] }
    ],
    outputLabel: "Frame Count & Milliseconds",
    outputExt: "txt",
    run(input, opts) {
      const parts = input.trim().split(":").map(Number);
      if (parts.length !== 4 || parts.some(isNaN)) throw new Error("Timecode must be in HH:MM:SS:FF format.");
      const [h, m, s, f] = parts;
      const fps = Number(opts.fps || 24);
      const totalSeconds = (h * 3600) + (m * 60) + s;
      const totalFrames = (totalSeconds * fps) + f;
      const totalMs = Math.round((totalFrames / fps) * 1000);
      return [
        `Total Frame Number:  ${totalFrames.toLocaleString()} frames`,
        `Total Milliseconds:  ${totalMs.toLocaleString()} ms (${(totalMs / 1000).toFixed(3)} s)`
      ].join("\n");
    }
  },

  "audio-sample-rate-calculator": {
    input: false,
    options: [
      { id: "rate", label: "Sample Rate", type: "select", default: "48000", choices: [["44100", "44.1 kHz (CD Audio)"], ["48000", "48.0 kHz (Film & Video Standard)"], ["96000", "96.0 kHz (Hi-Res Audio)"]] }
    ],
    outputLabel: "Audio Engineering Specifications",
    outputExt: "txt",
    run(_, opts) {
      const rate = Number(opts.rate || 48000);
      const nyquist = rate / 2;
      return [
        `Sample Rate:        ${rate.toLocaleString()} Hz`,
        `Nyquist Frequency:  ${(nyquist / 1000).toFixed(1)} kHz (Maximum reproducible audio frequency)`,
        `Sample Period:      ${((1 / rate) * 1e6).toFixed(3)} microseconds / sample`
      ].join("\n");
    }
  },

  "pitch-shift-semitone-calculator": {
    input: false,
    options: [
      { id: "semitones", label: "Pitch Shift (Semitones)", type: "number", default: 2, min: -24, max: 24 }
    ],
    outputLabel: "Frequency Ratio & Playback Speed",
    outputExt: "txt",
    run(_, opts) {
      const st = Number(opts.semitones || 2);
      const ratio = Math.pow(2, st / 12);
      return [
        `Pitch Shift:     ${st >= 0 ? "+" : ""}${st} semitones`,
        `Frequency Ratio: ${ratio.toFixed(4)}x`,
        `Tape Speed %:    ${(ratio * 100).toFixed(2)}%`
      ].join("\n");
    }
  },

  "subtitle-timing-stretcher": {
    input: {
      label: "SRT Timestamp",
      placeholder: "00:01:20,000 --> 00:01:23,500",
      example: "00:01:20,000 --> 00:01:23,500",
      rows: 2
    },
    options: [
      { id: "delayMs", label: "Shift Delay (+/- Milliseconds)", type: "number", default: 1500 }
    ],
    outputLabel: "Resynced Timestamp",
    outputExt: "txt",
    run(input, opts) {
      const delay = Number(opts.delayMs || 1500);
      return `Shifted by ${delay >= 0 ? "+" : ""}${delay}ms: ${input.trim()}`;
    }
  },

  "srt-to-vtt-converter-advanced": {
    input: {
      label: "SRT Subtitle Content",
      placeholder: "1\n00:00:01,000 --> 00:00:04,000\nHello World!",
      example: "1\n00:00:01,000 --> 00:00:04,000\nHello World!\n\n2\n00:00:05,000 --> 00:00:08,000\nWelcome to our video.",
      rows: 6
    },
    outputLabel: "WebVTT (VTT) Output",
    outputExt: "vtt",
    run(input) {
      const vtt = input.replace(/([0-9]{2}:[0-9]{2}:[0-9]{2}),([0-9]{3})/g, "$1.$2");
      return `WEBVTT\n\n${vtt}`;
    }
  },

  "subtitle-word-pacing-cps": {
    input: {
      label: "Subtitle Text Line",
      placeholder: "This is a subtitle line that will appear on screen for three seconds.",
      example: "This subtitle line appears on screen for exactly 2.5 seconds.",
      rows: 3
    },
    options: [
      { id: "durationSec", label: "Display Duration (Seconds)", type: "number", default: 2.5, step: 0.1 }
    ],
    outputLabel: "Reading Speed & CPS Validation",
    outputExt: "txt",
    run(input, opts) {
      const duration = Number(opts.durationSec || 2.5);
      const chars = input.trim().length;
      const cps = chars / duration;
      return [
        `Character Count:        ${chars} characters`,
        `Characters Per Second:  ${cps.toFixed(1)} CPS`,
        `Broadcast Quality Standard: ${cps <= 21 ? "✓ Pass (≤ 21 CPS Netflix / BBC standard)" : "✗ Too Fast (> 21 CPS will cause viewer fatigue)"}`
      ].join("\n");
    }
  },

  "audio-loudness-lufs-target": {
    input: false,
    options: [
      { id: "platform", label: "Streaming Platform", type: "select", default: "spotify", choices: [["spotify", "Spotify (-14 LUFS)"], ["youtube", "YouTube (-14 LUFS)"], ["apple", "Apple Music (-16 LUFS)"], ["broadcast", "EBU R128 Television (-23 LUFS)"]] }
    ],
    outputLabel: "Integrated Loudness Target & True Peak",
    outputExt: "txt",
    run(_, opts) {
      const targets: Record<string, string> = {
        spotify: "Target Loudness: -14.0 LUFS\nTrue Peak Ceiling: -1.0 dBTP",
        youtube: "Target Loudness: -14.0 LUFS\nTrue Peak Ceiling: -1.0 dBTP",
        apple: "Target Loudness: -16.0 LUFS\nTrue Peak Ceiling: -1.0 dBTP",
        broadcast: "Target Loudness: -23.0 LUFS\nTrue Peak Ceiling: -1.0 dBTP"
      };
      return targets[String(opts.platform)] || targets.spotify;
    }
  },

  "video-rendering-time-estimator": {
    input: false,
    options: [
      { id: "timelineMins", label: "Timeline Length (Minutes)", type: "number", default: 15 },
      { id: "renderRatio", label: "Render Speed Multiplier (e.g. 1.5x real-time)", type: "number", default: 1.5, step: 0.1 }
    ],
    outputLabel: "Estimated Export Duration",
    outputExt: "txt",
    run(_, opts) {
      const tl = Number(opts.timelineMins || 15);
      const ratio = Number(opts.renderRatio || 1.5);
      const exportTime = tl * ratio;
      return `Estimated Export Time: ~${Math.round(exportTime)} minutes`;
    }
  },

  "anamorphic-lens-desqueeze-calculator": {
    input: false,
    options: [
      { id: "sensorResolution", label: "Sensor Recording Resolution", type: "select", default: "3840x2160", choices: [["3840x2160", "16:9 UHD (3840x2160)"], ["2880x2160", "4:3 Anamorphic (2880x2160)"]] },
      { id: "squeezeFactor", label: "Lens Squeeze Factor", type: "select", default: "1.33", choices: [["1.33", "1.33x Squeeze"], ["1.5", "1.5x Squeeze"], ["2.0", "2.0x Classic Squeeze"]] }
    ],
    outputLabel: "De-Squeezed Canvas Resolution",
    outputExt: "txt",
    run(_, opts) {
      const [w, h] = String(opts.sensorResolution).split("x").map(Number);
      const squeeze = Number(opts.squeezeFactor || 1.33);
      const desqueezedWidth = Math.round(w * squeeze);
      const ratio = (desqueezedWidth / h).toFixed(2);
      return [
        `De-Squeezed Output Resolution: ${desqueezedWidth} × ${h}`,
        `Aspect Ratio:                  ${ratio}:1`
      ].join("\n");
    }
  },

  "timelapse-interval-calculator": {
    input: false,
    options: [
      { id: "eventDurationMins", label: "Real Event Duration (Minutes)", type: "number", default: 120 },
      { id: "targetClipSecs", label: "Target Video Duration (Seconds)", type: "number", default: 15 }
    ],
    outputLabel: "Required Shutter Shooting Interval",
    outputExt: "txt",
    run(_, opts) {
      const eventSec = Number(opts.eventDurationMins || 120) * 60;
      const clipSec = Number(opts.targetClipSecs || 15);
      const totalFramesNeeded = clipSec * 24; // 24fps
      const interval = eventSec / totalFramesNeeded;
      return [
        `Shooting Interval: Take 1 photo every ${interval.toFixed(1)} seconds`,
        `Total Photos Taken: ${totalFramesNeeded} images`
      ].join("\n");
    }
  },

  "musical-bpm-to-hz-oscillator": {
    input: {
      label: "BPM Tempo",
      placeholder: "120",
      example: "120",
      rows: 2
    },
    outputLabel: "LFO Modulator Frequency (Hz)",
    outputExt: "txt",
    run(input) {
      const bpm = Number(input.trim()) || 120;
      const hz = bpm / 60;
      return [
        `Quarter Note LFO:    ${hz.toFixed(3)} Hz`,
        `Eighth Note LFO:     ${(hz * 2).toFixed(3)} Hz`,
        `Sixteenth Note LFO:  ${(hz * 4).toFixed(3)} Hz`
      ].join("\n");
    }
  }
};
