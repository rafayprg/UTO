import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || (!allowZero && parsed === 0) || parsed > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return parsed;
}

export const geometryOps: Record<string, CalcOp> = {
  "circle-calculator": {
    fields: [
      { id: "radius", label: "Radius (r)", type: "number", default: "7", step: "0.1" }
    ],
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0, allowZero: false });
      const area = Math.PI * r * r;
      const circ = 2 * Math.PI * r;
      const diam = 2 * r;
      return {
        results: [
          { label: "Area", value: area.toFixed(4), primary: true },
          { label: "Circumference", value: circ.toFixed(4) },
          { label: "Diameter", value: diam.toFixed(4) }
        ],
        formula: "Area = π × r² | Circumference = 2 × π × r"
      };
    }
  },

  "cylinder-volume-calculator": {
    fields: [
      { id: "radius", label: "Base Radius (r)", type: "number", default: "5", step: "0.1" },
      { id: "height", label: "Height (h)", type: "number", default: "12", step: "0.1" }
    ],
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0, allowZero: false });
      const h = num(v.height, "Height", { min: 0, allowZero: false });
      const vol = Math.PI * r * r * h;
      const latArea = 2 * Math.PI * r * h;
      const totalArea = 2 * Math.PI * r * (r + h);
      return {
        results: [
          { label: "Volume", value: vol.toFixed(4), primary: true },
          { label: "Total Surface Area", value: totalArea.toFixed(4) },
          { label: "Lateral Surface Area", value: latArea.toFixed(4) }
        ],
        formula: "Volume = π × r² × h | Surface Area = 2πr(r + h)"
      };
    }
  },

  "sphere-volume-calculator": {
    fields: [
      { id: "radius", label: "Radius (r)", type: "number", default: "6", step: "0.1" }
    ],
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0, allowZero: false });
      const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
      const area = 4 * Math.PI * r * r;
      return {
        results: [
          { label: "Volume", value: vol.toFixed(4), primary: true },
          { label: "Surface Area", value: area.toFixed(4) }
        ],
        formula: "Volume = (4/3) × π × r³ | Surface Area = 4 × π × r²"
      };
    }
  },

  "cone-volume-calculator": {
    fields: [
      { id: "radius", label: "Base Radius (r)", type: "number", default: "4", step: "0.1" },
      { id: "height", label: "Height (h)", type: "number", default: "9", step: "0.1" }
    ],
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0, allowZero: false });
      const h = num(v.height, "Height", { min: 0, allowZero: false });
      const vol = (1 / 3) * Math.PI * r * r * h;
      const slant = Math.sqrt(r * r + h * h);
      const surfaceArea = Math.PI * r * (r + slant);
      return {
        results: [
          { label: "Volume", value: vol.toFixed(4), primary: true },
          { label: "Slant Height (s)", value: slant.toFixed(4) },
          { label: "Total Surface Area", value: surfaceArea.toFixed(4) }
        ],
        formula: "Volume = (1/3)πr²h | s = √(r² + h²)"
      };
    }
  },

  "rectangular-prism-calculator": {
    fields: [
      { id: "length", label: "Length (l)", type: "number", default: "10" },
      { id: "width", label: "Width (w)", type: "number", default: "5" },
      { id: "height", label: "Height (h)", type: "number", default: "4" }
    ],
    compute(v) {
      const l = num(v.length, "Length", { min: 0, allowZero: false });
      const w = num(v.width, "Width", { min: 0, allowZero: false });
      const h = num(v.height, "Height", { min: 0, allowZero: false });
      const vol = l * w * h;
      const sa = 2 * (l * w + l * h + w * h);
      const diag = Math.sqrt(l * l + w * w + h * h);
      return {
        results: [
          { label: "Volume", value: vol.toFixed(4), primary: true },
          { label: "Surface Area", value: sa.toFixed(4) },
          { label: "Space Diagonal", value: diag.toFixed(4) }
        ],
        formula: "Volume = l × w × h | Surface Area = 2(lw + lh + wh)"
      };
    }
  },

  "pythagorean-theorem-calculator": {
    fields: [
      { id: "a", label: "Side A", type: "number", default: "3" },
      { id: "b", label: "Side B", type: "number", default: "4" }
    ],
    compute(v) {
      const a = num(v.a, "Side A", { min: 0, allowZero: false });
      const b = num(v.b, "Side B", { min: 0, allowZero: false });
      const c = Math.sqrt(a * a + b * b);
      const area = 0.5 * a * b;
      return {
        results: [
          { label: "Hypotenuse (c)", value: c.toFixed(4), primary: true },
          { label: "Area", value: area.toFixed(4) },
          { label: "Perimeter", value: (a + b + c).toFixed(4) }
        ],
        formula: "c = √(a² + b²)"
      };
    }
  },

  "triangle-heron-calculator": {
    fields: [
      { id: "a", label: "Side A", type: "number", default: "5" },
      { id: "b", label: "Side B", type: "number", default: "6" },
      { id: "c", label: "Side C", type: "number", default: "7" }
    ],
    compute(v) {
      const a = num(v.a, "Side A", { min: 0, allowZero: false });
      const b = num(v.b, "Side B", { min: 0, allowZero: false });
      const c = num(v.c, "Side C", { min: 0, allowZero: false });
      if (a + b <= c || a + c <= b || b + c <= a) throw new Error("Triangle Inequality Theorem violated: sum of any 2 sides must be greater than the third side.");
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      return {
        results: [
          { label: "Area (Heron's Formula)", value: area.toFixed(4), primary: true },
          { label: "Perimeter", value: (a + b + c).toFixed(4) },
          { label: "Semi-perimeter (s)", value: s.toFixed(4) }
        ],
        formula: "Area = √[s(s-a)(s-b)(s-c)] where s = (a+b+c)/2"
      };
    }
  },

  "trapezoid-calculator": {
    fields: [
      { id: "baseA", label: "Base A (top)", type: "number", default: "8" },
      { id: "baseB", label: "Base B (bottom)", type: "number", default: "14" },
      { id: "height", label: "Height (h)", type: "number", default: "6" }
    ],
    compute(v) {
      const a = num(v.baseA, "Base A", { min: 0, allowZero: false });
      const b = num(v.baseB, "Base B", { min: 0, allowZero: false });
      const h = num(v.height, "Height", { min: 0, allowZero: false });
      const area = ((a + b) / 2) * h;
      return {
        results: [
          { label: "Area", value: area.toFixed(4), primary: true },
          { label: "Median / Midsegment", value: ((a + b) / 2).toFixed(4) }
        ],
        formula: "Area = [(a + b) / 2] × h"
      };
    }
  },

  "ellipse-calculator": {
    fields: [
      { id: "semiMajor", label: "Semi-Major Axis (a)", type: "number", default: "8" },
      { id: "semiMinor", label: "Semi-Minor Axis (b)", type: "number", default: "5" }
    ],
    compute(v) {
      const a = num(v.semiMajor, "Semi-Major Axis", { min: 0, allowZero: false });
      const b = num(v.semiMinor, "Semi-Minor Axis", { min: 0, allowZero: false });
      const area = Math.PI * a * b;
      // Ramanujan approximation for perimeter
      const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
      const perimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      return {
        results: [
          { label: "Area", value: area.toFixed(4), primary: true },
          { label: "Perimeter (Ramanujan approx)", value: perimeter.toFixed(4) }
        ],
        formula: "Area = π × a × b"
      };
    }
  },

  "regular-hexagon-calculator": {
    fields: [
      { id: "side", label: "Side Length (s)", type: "number", default: "6" }
    ],
    compute(v) {
      const s = num(v.side, "Side Length", { min: 0, allowZero: false });
      const area = ((3 * Math.sqrt(3)) / 2) * s * s;
      const perim = 6 * s;
      return {
        results: [
          { label: "Area", value: area.toFixed(4), primary: true },
          { label: "Perimeter", value: perim.toFixed(4) },
          { label: "Inradius (apothem)", value: ((s * Math.sqrt(3)) / 2).toFixed(4) }
        ],
        formula: "Area = (3√3 / 2) × s²"
      };
    }
  },

  "matrix-2x2-determinant": {
    fields: [
      { id: "a", label: "Element a11", type: "number", default: "4" },
      { id: "b", label: "Element a12", type: "number", default: "2" },
      { id: "c", label: "Element a21", type: "number", default: "3" },
      { id: "d", label: "Element a22", type: "number", default: "5" }
    ],
    compute(v) {
      const a = num(v.a, "a11");
      const b = num(v.b, "a12");
      const c = num(v.c, "a21");
      const d = num(v.d, "a22");
      const det = (a * d) - (b * c);
      return {
        results: [
          { label: "Determinant |A|", value: String(det), primary: true },
          { label: "Invertibility", value: det !== 0 ? "Invertible (Non-singular)" : "Singular (No inverse)" }
        ],
        formula: "det(A) = ad - bc"
      };
    }
  },

  "vector-2d-calculator": {
    fields: [
      { id: "x", label: "X Component", type: "number", default: "6" },
      { id: "y", label: "Y Component", type: "number", default: "8" }
    ],
    compute(v) {
      const x = num(v.x, "X");
      const y = num(v.y, "Y");
      const mag = Math.sqrt(x * x + y * y);
      const angleRad = Math.atan2(y, x);
      const angleDeg = (angleRad * 180) / Math.PI;
      const unitX = mag > 0 ? (x / mag).toFixed(4) : "0";
      const unitY = mag > 0 ? (y / mag).toFixed(4) : "0";
      return {
        results: [
          { label: "Magnitude |v|", value: mag.toFixed(4), primary: true },
          { label: "Direction Angle (θ)", value: `${angleDeg.toFixed(2)}°` },
          { label: "Unit Vector", value: `(${unitX}, ${unitY})` }
        ],
        formula: "|v| = √(x² + y²) | θ = atan2(y, x)"
      };
    }
  },

  "permutations-combinations-calculator": {
    fields: [
      { id: "n", label: "Total items (n)", type: "number", default: "8" },
      { id: "r", label: "Items chosen (r)", type: "number", default: "3" }
    ],
    compute(v) {
      const n = num(v.n, "n", { min: 0 });
      const r = num(v.r, "r", { min: 0 });
      if (r > n) throw new Error("r cannot be greater than n.");
      const fact = (k: number): number => k <= 1 ? 1 : k * fact(k - 1);
      const nPr = fact(n) / fact(n - r);
      const nCr = nPr / fact(r);
      return {
        results: [
          { label: "Combinations nCr (Order does NOT matter)", value: nCr.toLocaleString(), primary: true },
          { label: "Permutations nPr (Order DOES matter)", value: nPr.toLocaleString() }
        ],
        formula: "nCr = n! / [r!(n-r)!] | nPr = n! / (n-r)!"
      };
    }
  },

  "distance-2d-calculator": {
    fields: [
      { id: "x1", label: "Point 1: X₁", type: "number", default: "2" },
      { id: "y1", label: "Point 1: Y₁", type: "number", default: "3" },
      { id: "x2", label: "Point 2: X₂", type: "number", default: "7" },
      { id: "y2", label: "Point 2: Y₂", type: "number", default: "15" }
    ],
    compute(v) {
      const x1 = num(v.x1, "X1");
      const y1 = num(v.y1, "Y1");
      const x2 = num(v.x2, "X2");
      const y2 = num(v.y2, "Y2");
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const slope = dx !== 0 ? (dy / dx).toFixed(4) : "Undefined (Vertical)";
      return {
        results: [
          { label: "Distance (d)", value: dist.toFixed(4), primary: true },
          { label: "Midpoint", value: `(${midX}, ${midY})` },
          { label: "Slope (m)", value: slope }
        ],
        formula: "d = √[(x₂ - x₁)² + (y₂ - y₁)²]"
      };
    }
  },

  "natural-log-calculator": {
    fields: [
      { id: "x", label: "Value (x)", type: "number", default: "100" },
      { id: "base", label: "Logarithm Base (b)", type: "number", default: "10" }
    ],
    compute(v) {
      const x = num(v.x, "Value", { min: 0, allowZero: false });
      const b = num(v.base, "Base", { min: 0, allowZero: false });
      if (b === 1) throw new Error("Base cannot be 1.");
      const logVal = Math.log(x) / Math.log(b);
      const lnVal = Math.log(x);
      return {
        results: [
          { label: `log_${b}(${x})`, value: logVal.toFixed(6), primary: true },
          { label: `Natural Log ln(${x})`, value: lnVal.toFixed(6) }
        ],
        formula: "log_b(x) = ln(x) / ln(b)"
      };
    }
  }
};
