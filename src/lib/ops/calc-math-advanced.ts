import type { CalcOp } from "./types";

function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number {
  const parsed = Number(String(value).replace(/,/g, "").trim());
  if (value.trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || parsed > max || (!allowZero && parsed === 0)) throw new Error(`${label} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  return parsed;
}

export const advancedMathOps: Record<string, CalcOp> = {
  "square-pyramid-calculator": {
    fields: [
      { id: "baseEdge", label: "Base Edge Length (a)", type: "number", default: "6" },
      { id: "height", label: "Pyramid Height (h)", type: "number", default: "8" }
    ],
    note: "Calculates volume, slant height, and total surface area of a regular square pyramid.",
    compute(v) {
      const a = num(v.baseEdge, "Base Edge", { min: 0.001 });
      const h = num(v.height, "Height", { min: 0.001 });
      const volume = (a * a * h) / 3;
      const slantHeight = Math.sqrt((h * h) + ((a / 2) * (a / 2)));
      const baseArea = a * a;
      const lateralArea = 2 * a * slantHeight;
      const totalSurfaceArea = baseArea + lateralArea;
      return {
        results: [
          { label: "Volume (V)", value: `${volume.toFixed(3)} cubic units`, primary: true },
          { label: "Slant Height (s)", value: `${slantHeight.toFixed(3)} units` },
          { label: "Total Surface Area (A)", value: `${totalSurfaceArea.toFixed(3)} sq units` },
          { label: "Lateral Surface Area", value: `${lateralArea.toFixed(3)} sq units` }
        ],
        formula: "V = (a² × h) / 3 | s = √(h² + (a/2)²)"
      };
    }
  },

  "triangular-prism-calculator": {
    fields: [
      { id: "baseSideA", label: "Triangle Side a", type: "number", default: "3" },
      { id: "baseSideB", label: "Triangle Side b", type: "number", default: "4" },
      { id: "baseSideC", label: "Triangle Side c", type: "number", default: "5" },
      { id: "prismHeight", label: "Prism Length / Height (h)", type: "number", default: "10" }
    ],
    note: "Calculates volume and total surface area of a right triangular prism using Heron's formula.",
    compute(v) {
      const a = num(v.baseSideA, "Side a", { min: 0.001 });
      const b = num(v.baseSideB, "Side b", { min: 0.001 });
      const c = num(v.baseSideC, "Side c", { min: 0.001 });
      const h = num(v.prismHeight, "Height", { min: 0.001 });
      if (a + b <= c || a + c <= b || b + c <= a) throw new Error("Triangle inequality violated. The sum of any two sides must exceed the third.");
      const s = (a + b + c) / 2;
      const baseArea = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const volume = baseArea * h;
      const lateralArea = (a + b + c) * h;
      const totalSurfaceArea = (2 * baseArea) + lateralArea;
      return {
        results: [
          { label: "Volume (V)", value: `${volume.toFixed(3)} cubic units`, primary: true },
          { label: "Total Surface Area", value: `${totalSurfaceArea.toFixed(3)} sq units` },
          { label: "Base Triangle Area", value: `${baseArea.toFixed(3)} sq units` }
        ],
        formula: "V = Base Area × h | Total Area = 2 × Base Area + Perimeter × h"
      };
    }
  },

  "torus-calculator": {
    fields: [
      { id: "majorRadius", label: "Major Radius (R: Center of tube to center of torus)", type: "number", default: "7" },
      { id: "minorRadius", label: "Minor Radius (r: Tube cross-section radius)", type: "number", default: "2" }
    ],
    note: "Calculates 3D volume and surface area of a ring torus (donut shape).",
    compute(v) {
      const R = num(v.majorRadius, "Major Radius R", { min: 0.001 });
      const r = num(v.minorRadius, "Minor Radius r", { min: 0.001 });
      if (r >= R) throw new Error("Major radius R must be strictly greater than minor radius r for a ring torus.");
      const volume = 2 * (Math.PI * Math.PI) * R * (r * r);
      const surfaceArea = 4 * (Math.PI * Math.PI) * R * r;
      return {
        results: [
          { label: "Torus Volume (V)", value: `${volume.toFixed(3)} cubic units`, primary: true },
          { label: "Surface Area (A)", value: `${surfaceArea.toFixed(3)} sq units` }
        ],
        formula: "V = 2π² R r² | A = 4π² R r"
      };
    }
  },

  "regular-octagon-calculator": {
    fields: [
      { id: "sideLength", label: "Octagon Side Length (a)", type: "number", default: "5" }
    ],
    note: "Calculates area, perimeter, and circumradius of a regular 8-sided polygon.",
    compute(v) {
      const a = num(v.sideLength, "Side Length", { min: 0.001 });
      const area = 2 * (1 + Math.SQRT2) * (a * a);
      const perimeter = 8 * a;
      const apothem = a * (1 + Math.SQRT2) / 2;
      return {
        results: [
          { label: "Octagon Area", value: `${area.toFixed(3)} sq units`, primary: true },
          { label: "Perimeter", value: `${perimeter.toFixed(3)} units` },
          { label: "Apothem (Inradius)", value: `${apothem.toFixed(3)} units` }
        ],
        formula: "A = 2(1 + √2)a² | Perimeter = 8a"
      };
    }
  },

  "circular-sector-calculator": {
    fields: [
      { id: "radius", label: "Circle Radius (r)", type: "number", default: "6" },
      { id: "centralAngleDegrees", label: "Central Angle (θ in degrees)", type: "number", default: "60" }
    ],
    note: "Calculates circular arc length, sector slice area, and chord length.",
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0.001 });
      const thetaDeg = num(v.centralAngleDegrees, "Angle", { min: 0.001, max: 360 });
      const thetaRad = thetaDeg * (Math.PI / 180);
      const arcLength = r * thetaRad;
      const sectorArea = 0.5 * (r * r) * thetaRad;
      const chordLength = 2 * r * Math.sin(thetaRad / 2);
      return {
        results: [
          { label: "Sector Area", value: `${sectorArea.toFixed(3)} sq units`, primary: true },
          { label: "Arc Length (s)", value: `${arcLength.toFixed(3)} units` },
          { label: "Chord Length (c)", value: `${chordLength.toFixed(3)} units` }
        ],
        formula: "s = r × θ | Area = ½ r² θ"
      };
    }
  },

  "parallelogram-calculator": {
    fields: [
      { id: "base", label: "Base Length (b)", type: "number", default: "8" },
      { id: "side", label: "Side Length (a)", type: "number", default: "5" },
      { id: "height", label: "Perpendicular Height (h)", type: "number", default: "4" }
    ],
    note: "Calculates area and perimeter of a parallelogram.",
    compute(v) {
      const b = num(v.base, "Base", { min: 0.001 });
      const a = num(v.side, "Side", { min: 0.001 });
      const h = num(v.height, "Height", { min: 0.001 });
      if (h > a) throw new Error("Perpendicular height cannot exceed side length.");
      const area = b * h;
      const perimeter = 2 * (a + b);
      return {
        results: [
          { label: "Parallelogram Area", value: `${area.toFixed(3)} sq units`, primary: true },
          { label: "Perimeter", value: `${perimeter.toFixed(3)} units` }
        ],
        formula: "Area = Base × Height | Perimeter = 2(a + b)"
      };
    }
  },

  "rhombus-calculator": {
    fields: [
      { id: "diagonal1", label: "Diagonal 1 (d₁)", type: "number", default: "10" },
      { id: "diagonal2", label: "Diagonal 2 (d₂)", type: "number", default: "8" }
    ],
    note: "Calculates area, side length, and perimeter of a rhombus from its perpendicular diagonals.",
    compute(v) {
      const d1 = num(v.diagonal1, "Diagonal 1", { min: 0.001 });
      const d2 = num(v.diagonal2, "Diagonal 2", { min: 0.001 });
      const area = (d1 * d2) / 2;
      const side = Math.sqrt(((d1 / 2) * (d1 / 2)) + ((d2 / 2) * (d2 / 2)));
      const perimeter = 4 * side;
      return {
        results: [
          { label: "Rhombus Area", value: `${area.toFixed(3)} sq units`, primary: true },
          { label: "Side Length (a)", value: `${side.toFixed(3)} units` },
          { label: "Perimeter", value: `${perimeter.toFixed(3)} units` }
        ],
        formula: "Area = (d₁ × d₂) / 2 | Side = √[(d₁/2)² + (d₂/2)²]"
      };
    }
  },

  "annulus-ring-calculator": {
    fields: [
      { id: "outerRadius", label: "Outer Radius (R)", type: "number", default: "9" },
      { id: "innerRadius", label: "Inner Radius (r)", type: "number", default: "4" }
    ],
    note: "Calculates surface area and ring thickness of a circular annulus.",
    compute(v) {
      const R = num(v.outerRadius, "Outer Radius", { min: 0.001 });
      const r = num(v.innerRadius, "Inner Radius", { min: 0.001 });
      if (r >= R) throw new Error("Outer radius R must be greater than inner radius r.");
      const area = Math.PI * ((R * R) - (r * r));
      const width = R - r;
      return {
        results: [
          { label: "Ring Surface Area", value: `${area.toFixed(3)} sq units`, primary: true },
          { label: "Ring Thickness / Width", value: `${width.toFixed(3)} units` }
        ],
        formula: "Area = π(R² - r²)"
      };
    }
  },

  "cone-frustum-calculator": {
    fields: [
      { id: "bottomRadius", label: "Bottom Base Radius (R)", type: "number", default: "6" },
      { id: "topRadius", label: "Top Base Radius (r)", type: "number", default: "3" },
      { id: "height", label: "Frustum Height (h)", type: "number", default: "8" }
    ],
    note: "Calculates volume and slant height of a truncated cone (cone frustum).",
    compute(v) {
      const R = num(v.bottomRadius, "Bottom Radius", { min: 0.001 });
      const r = num(v.topRadius, "Top Radius", { min: 0.001 });
      const h = num(v.height, "Height", { min: 0.001 });
      const volume = (Math.PI * h / 3) * ((R * R) + (r * r) + (R * r));
      const slantHeight = Math.sqrt((h * h) + ((R - r) * (R - r)));
      const lateralArea = Math.PI * (R + r) * slantHeight;
      return {
        results: [
          { label: "Frustum Volume (V)", value: `${volume.toFixed(3)} cubic units`, primary: true },
          { label: "Slant Height (s)", value: `${slantHeight.toFixed(3)} units` },
          { label: "Lateral Surface Area", value: `${lateralArea.toFixed(3)} sq units` }
        ],
        formula: "V = (πh / 3) × (R² + r² + Rr)"
      };
    }
  },

  "ellipsoid-volume-calculator": {
    fields: [
      { id: "axisA", label: "Semi-axis a", type: "number", default: "6" },
      { id: "axisB", label: "Semi-axis b", type: "number", default: "4" },
      { id: "axisC", label: "Semi-axis c", type: "number", default: "3" }
    ],
    note: "Calculates 3D volume of an ellipsoid (3D stretched sphere).",
    compute(v) {
      const a = num(v.axisA, "Axis a", { min: 0.001 });
      const b = num(v.axisB, "Axis b", { min: 0.001 });
      const c = num(v.axisC, "Axis c", { min: 0.001 });
      const volume = (4 / 3) * Math.PI * a * b * c;
      return {
        results: [
          { label: "Ellipsoid Volume", value: `${volume.toFixed(3)} cubic units`, primary: true }
        ],
        formula: "V = (4/3) π a b c"
      };
    }
  },

  "hexagonal-prism-calculator": {
    fields: [
      { id: "baseSide", label: "Regular Hexagon Side (a)", type: "number", default: "4" },
      { id: "height", label: "Prism Height (h)", type: "number", default: "12" }
    ],
    note: "Calculates volume and total surface area of a 6-sided regular hexagonal prism.",
    compute(v) {
      const a = num(v.baseSide, "Base Side", { min: 0.001 });
      const h = num(v.height, "Height", { min: 0.001 });
      const baseArea = (3 * Math.sqrt(3) / 2) * (a * a);
      const volume = baseArea * h;
      const lateralArea = 6 * a * h;
      const totalSurfaceArea = (2 * baseArea) + lateralArea;
      return {
        results: [
          { label: "Hexagonal Prism Volume", value: `${volume.toFixed(3)} cubic units`, primary: true },
          { label: "Total Surface Area", value: `${totalSurfaceArea.toFixed(3)} sq units` },
          { label: "Base Hexagon Area", value: `${baseArea.toFixed(3)} sq units` }
        ],
        formula: "V = (3√3 / 2) a² × h"
      };
    }
  },

  "capsule-volume-calculator": {
    fields: [
      { id: "radius", label: "Hemisphere Radius (r)", type: "number", default: "3" },
      { id: "cylinderLength", label: "Cylinder Section Length (a)", type: "number", default: "8" }
    ],
    note: "Calculates volume and surface area of a capsule (cylinder capped with two hemispheres).",
    compute(v) {
      const r = num(v.radius, "Radius", { min: 0.001 });
      const a = num(v.cylinderLength, "Length", { min: 0.001 });
      const sphereVolume = (4 / 3) * Math.PI * (r * r * r);
      const cylinderVolume = Math.PI * (r * r) * a;
      const totalVolume = sphereVolume + cylinderVolume;
      const totalSurfaceArea = (4 * Math.PI * (r * r)) + (2 * Math.PI * r * a);
      return {
        results: [
          { label: "Capsule Volume (V)", value: `${totalVolume.toFixed(3)} cubic units`, primary: true },
          { label: "Total Surface Area", value: `${totalSurfaceArea.toFixed(3)} sq units` }
        ],
        formula: "V = πr²((4/3)r + a) | A = 2πr(2r + a)"
      };
    }
  },

  "sample-variance-stdev-calculator": {
    fields: [
      { id: "dataPoints", label: "Numbers (comma or space separated)", type: "text", default: "12, 15, 18, 22, 25, 30, 35, 42" }
    ],
    note: "Calculates sample and population variance, standard deviation, and mean.",
    compute(v) {
      const nums = v.dataPoints.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length < 2 || nums.some(isNaN)) throw new Error("Enter at least two valid numbers.");
      const n = nums.length;
      const mean = nums.reduce((a, b) => a + b, 0) / n;
      const sumSq = nums.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0);
      const sampleVar = sumSq / (n - 1);
      const popVar = sumSq / n;
      const sampleSd = Math.sqrt(sampleVar);
      const popSd = Math.sqrt(popVar);
      return {
        results: [
          { label: "Sample Standard Deviation (s)", value: sampleSd.toFixed(4), primary: true },
          { label: "Sample Variance (s²)", value: sampleVar.toFixed(4) },
          { label: "Population Standard Deviation (σ)", value: popSd.toFixed(4) },
          { label: "Arithmetic Mean (μ)", value: mean.toFixed(4) },
          { label: "Sample Count (N)", value: `${n} numbers` }
        ],
        formula: "s = √[ Σ(x - x̄)² / (n - 1) ]"
      };
    }
  },

  "z-score-pvalue-calculator": {
    fields: [
      { id: "rawValue", label: "Raw Score (x)", type: "number", default: "82" },
      { id: "mean", label: "Population Mean (μ)", type: "number", default: "70" },
      { id: "stdDev", label: "Standard Deviation (σ)", type: "number", default: "8" }
    ],
    note: "Calculates standard Z-Score and cumulative normal distribution probability percentile.",
    compute(v) {
      const x = num(v.rawValue, "Raw Score");
      const mu = num(v.mean, "Mean");
      const sigma = num(v.stdDev, "Standard Deviation", { min: 0.00000001, allowZero: false });
      const z = (x - mu) / sigma;
      // Error function approximation for standard normal CDF
      const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
      const d = 0.3989422804014327 * Math.exp(-z * z / 2);
      let prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      if (z > 0) prob = 1.0 - prob;
      return {
        results: [
          { label: "Z-Score (Standardized)", value: `${z >= 0 ? "+" : ""}${z.toFixed(3)}`, primary: true },
          { label: "Percentile Rank", value: `${(prob * 100).toFixed(2)}th percentile` },
          { label: "Probability P(X < x)", value: `${prob.toFixed(4)}` },
          { label: "Probability P(X > x)", value: `${(1 - prob).toFixed(4)}` }
        ],
        formula: "Z = (x - μ) / σ"
      };
    }
  },

  "margin-of-error-calculator": {
    fields: [
      { id: "sampleSize", label: "Survey Sample Size (n)", type: "number", default: "1000" },
      { id: "percentage", label: "Sample Proportion (%) (50% is most conservative)", type: "number", default: "50", step: "1" },
      { id: "confidenceLevel", label: "Confidence Level", type: "select", default: "95", choices: [["90", "90% Confidence (Z = 1.645)"], ["95", "95% Confidence (Z = 1.960)"], ["99", "99% Confidence (Z = 2.576)"]] }
    ],
    note: "Calculates survey margin of error (MOE) for polling and market research.",
    compute(v) {
      const n = num(v.sampleSize, "Sample Size", { min: 1 });
      const p = num(v.percentage, "Proportion", { min: 0, max: 100 }) / 100;
      let z = 1.96;
      if (v.confidenceLevel === "90") z = 1.645;
      else if (v.confidenceLevel === "99") z = 2.576;
      const se = Math.sqrt((p * (1 - p)) / n);
      const moe = z * se * 100;
      return {
        results: [
          { label: "Margin of Error (MOE)", value: `±${moe.toFixed(2)}%`, primary: true },
          { label: "Standard Error (SE)", value: `${(se * 100).toFixed(3)}%` }
        ],
        formula: "MOE = Z × √[p(1 - p) / n]"
      };
    }
  },

  "pearson-correlation-calculator": {
    fields: [
      { id: "xValues", label: "X Variable Values (Comma separated)", type: "text", default: "10, 15, 20, 25, 30, 35, 40" },
      { id: "yValues", label: "Y Variable Values (Comma separated)", type: "text", default: "22, 28, 35, 42, 50, 58, 65" }
    ],
    note: "Calculates Pearson correlation coefficient r and coefficient of determination R².",
    compute(v) {
      const xs = v.xValues.split(/[\s,]+/).filter(Boolean).map(Number);
      const ys = v.yValues.split(/[\s,]+/).filter(Boolean).map(Number);
      if (xs.length !== ys.length || xs.length < 2) throw new Error("X and Y must have the exact same number of entries (at least 2).");
      const n = xs.length;
      const meanX = xs.reduce((a, b) => a + b, 0) / n;
      const meanY = ys.reduce((a, b) => a + b, 0) / n;
      let numSum = 0;
      let denX = 0;
      let denY = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        numSum += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }
      if (denX === 0 || denY === 0) throw new Error("Zero variance detected in input data.");
      const r = numSum / Math.sqrt(denX * denY);
      const r2 = r * r;
      return {
        results: [
          { label: "Pearson Correlation (r)", value: `${r.toFixed(4)}`, primary: true },
          { label: "R² (Variance Explained)", value: `${(r2 * 100).toFixed(2)}%` },
          { label: "Correlation Strength", value: Math.abs(r) > 0.8 ? "Strong Linear Correlation" : Math.abs(r) > 0.5 ? "Moderate Correlation" : "Weak or No Linear Correlation" }
        ],
        formula: "r = Σ(dx dy) / √[ Σ(dx²) Σ(dy²) ]"
      };
    }
  },

  "linear-regression-calculator": {
    fields: [
      { id: "xValues", label: "X Coordinates (comma separated)", type: "text", default: "1, 2, 3, 4, 5, 6" },
      { id: "yValues", label: "Y Coordinates (comma separated)", type: "text", default: "2.5, 4.0, 5.8, 8.1, 10.2, 12.0" }
    ],
    note: "Finds the best-fit linear regression equation y = mx + b using ordinary least squares.",
    compute(v) {
      const xs = v.xValues.split(/[\s,]+/).filter(Boolean).map(Number);
      const ys = v.yValues.split(/[\s,]+/).filter(Boolean).map(Number);
      if (xs.length !== ys.length || xs.length < 2) throw new Error("X and Y must have identical counts (at least 2).");
      const n = xs.length;
      const sumX = xs.reduce((a, b) => a + b, 0);
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = xs.reduce((acc, x, i) => acc + (x * ys[i]), 0);
      const sumX2 = xs.reduce((acc, x) => acc + (x * x), 0);
      const slope = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX * sumX));
      const intercept = (sumY - (slope * sumX)) / n;
      return {
        results: [
          { label: "Regression Equation", value: `y = ${slope.toFixed(4)}x ${intercept >= 0 ? "+" : "-"} ${Math.abs(intercept).toFixed(4)}`, primary: true },
          { label: "Slope (m)", value: slope.toFixed(4) },
          { label: "Y-Intercept (b)", value: intercept.toFixed(4) }
        ],
        formula: "y = mx + b | m = [nΣxy - ΣxΣy] / [nΣx² - (Σx)²]"
      };
    }
  },

  "percentile-quartiles-calculator": {
    fields: [
      { id: "numbers", label: "Data Set (Comma or space separated)", type: "text", default: "15, 22, 26, 29, 32, 38, 41, 45, 50, 58, 64" }
    ],
    note: "Calculates Median, First Quartile (Q1), Third Quartile (Q3), and Interquartile Range (IQR).",
    compute(v) {
      const arr = v.numbers.split(/[\s,]+/).filter(Boolean).map(Number).sort((a, b) => a - b);
      if (arr.length < 3) throw new Error("Enter at least 3 numbers.");
      const n = arr.length;
      const getP = (p: number) => {
        const idx = p * (n - 1);
        const lower = Math.floor(idx);
        const upper = Math.ceil(idx);
        return arr[lower] + (arr[upper] - arr[lower]) * (idx - lower);
      };
      const q1 = getP(0.25);
      const median = getP(0.50);
      const q3 = getP(0.75);
      const iqr = q3 - q1;
      return {
        results: [
          { label: "Median (Q2)", value: median.toFixed(2), primary: true },
          { label: "First Quartile (Q1)", value: q1.toFixed(2) },
          { label: "Third Quartile (Q3)", value: q3.toFixed(2) },
          { label: "Interquartile Range (IQR)", value: iqr.toFixed(2) },
          { label: "Min / Max Range", value: `${arr[0]} to ${arr[n - 1]}` }
        ],
        formula: "IQR = Q3 - Q1"
      };
    }
  },

  "arithmetic-series-calculator": {
    fields: [
      { id: "firstTerm", label: "First Term (a₁)", type: "number", default: "3" },
      { id: "commonDifference", label: "Common Difference (d)", type: "number", default: "4" },
      { id: "numberOfTerms", label: "Number of Terms (n)", type: "number", default: "20" }
    ],
    note: "Calculates the n-th term and sum of an arithmetic progression series.",
    compute(v) {
      const a1 = num(v.firstTerm, "First Term");
      const d = num(v.commonDifference, "Difference");
      const n = num(v.numberOfTerms, "Number of Terms", { min: 1 });
      const nthTerm = a1 + ((n - 1) * d);
      const sum = (n / 2) * (a1 + nthTerm);
      return {
        results: [
          { label: "Sum of Series (S_n)", value: `${sum.toLocaleString()}`, primary: true },
          { label: "n-th Term (a_n)", value: `${nthTerm.toLocaleString()}` }
        ],
        formula: "a_n = a₁ + (n - 1)d | S_n = (n/2)(a₁ + a_n)"
      };
    }
  },

  "geometric-series-calculator": {
    fields: [
      { id: "firstTerm", label: "First Term (a₁)", type: "number", default: "2" },
      { id: "commonRatio", label: "Common Ratio (r)", type: "number", default: "0.5" },
      { id: "numberOfTerms", label: "Number of Terms (n)", type: "number", default: "10" }
    ],
    note: "Calculates finite sum and infinite sum (for |r| < 1) of a geometric progression.",
    compute(v) {
      const a1 = num(v.firstTerm, "First Term");
      const r = num(v.commonRatio, "Ratio");
      const n = num(v.numberOfTerms, "Terms", { min: 1 });
      const nthTerm = a1 * Math.pow(r, n - 1);
      const finiteSum = r === 1 ? a1 * n : a1 * ((1 - Math.pow(r, n)) / (1 - r));
      const infiniteSum = Math.abs(r) < 1 ? a1 / (1 - r) : "Diverges (|r| ≥ 1)";
      return {
        results: [
          { label: "Finite Sum (S_n)", value: `${finiteSum.toFixed(4)}`, primary: true },
          { label: "Infinite Sum (S_∞)", value: typeof infiniteSum === "number" ? infiniteSum.toFixed(4) : infiniteSum },
          { label: "n-th Term (a_n)", value: `${nthTerm.toFixed(4)}` }
        ],
        formula: "S_n = a₁(1 - rⁿ) / (1 - r) | S_∞ = a₁ / (1 - r)"
      };
    }
  },

  "confidence-interval-calculator": {
    fields: [
      { id: "sampleMean", label: "Sample Mean (x̄)", type: "number", default: "105.4" },
      { id: "sampleSd", label: "Standard Deviation (s)", type: "number", default: "12.8" },
      { id: "sampleSize", label: "Sample Size (n)", type: "number", default: "64" },
      { id: "confidence", label: "Confidence Level", type: "select", default: "95", choices: [["90", "90% (Z = 1.645)"], ["95", "95% (Z = 1.960)"], ["99", "99% (Z = 2.576)"]] }
    ],
    note: "Calculates confidence interval range for an estimated population mean.",
    compute(v) {
      const mean = num(v.sampleMean, "Mean");
      const sd = num(v.sampleSd, "Standard Deviation", { min: 0.001 });
      const n = num(v.sampleSize, "Sample Size", { min: 2 });
      let z = 1.96;
      if (v.confidence === "90") z = 1.645;
      else if (v.confidence === "99") z = 2.576;
      const se = sd / Math.sqrt(n);
      const margin = z * se;
      const lower = mean - margin;
      const upper = mean + margin;
      return {
        results: [
          { label: "Confidence Interval Range", value: `[${lower.toFixed(3)}, ${upper.toFixed(3)}]`, primary: true },
          { label: "Margin of Error (E)", value: `±${margin.toFixed(3)}` },
          { label: "Standard Error (SE)", value: `${se.toFixed(4)}` }
        ],
        formula: "CI = x̄ ± Z × (s / √n)"
      };
    }
  },

  "binomial-distribution-calculator": {
    fields: [
      { id: "trials", label: "Number of Trials (n)", type: "number", default: "10" },
      { id: "successes", label: "Number of Successes (k)", type: "number", default: "4" },
      { id: "probability", label: "Probability of Success on Single Trial (p)", type: "number", default: "0.5", step: "0.01" }
    ],
    note: "Calculates exact binomial distribution probability P(X = k).",
    compute(v) {
      const n = Math.round(num(v.trials, "Trials", { min: 1, max: 100 }));
      const k = Math.round(num(v.successes, "Successes", { min: 0, max: n }));
      const p = num(v.probability, "Probability", { min: 0, max: 1 });
      const nCr = (total: number, pick: number): number => {
        let res = 1;
        for (let i = 1; i <= pick; i++) {
          res = (res * (total - i + 1)) / i;
        }
        return res;
      };
      const combinations = nCr(n, k);
      const exactProb = combinations * Math.pow(p, k) * Math.pow(1 - p, n - k);
      return {
        results: [
          { label: "Exact Probability P(X = k)", value: `${(exactProb * 100).toFixed(3)}% (${exactProb.toFixed(5)})`, primary: true },
          { label: "Combinations nCr", value: `${combinations.toLocaleString()} ways` },
          { label: "Expected Value (Mean = np)", value: `${(n * p).toFixed(2)}` }
        ],
        formula: "P(X = k) = (n choose k) × pᵏ × (1 - p)ⁿ⁻ᵏ"
      };
    }
  },

  "poisson-distribution-calculator": {
    fields: [
      { id: "lambdaRate", label: "Average Event Rate (λ: events per interval)", type: "number", default: "3.5" },
      { id: "occurrences", label: "Number of Occurrences (k)", type: "number", default: "2" }
    ],
    note: "Calculates Poisson probability of observing exactly k occurrences given average rate λ.",
    compute(v) {
      const lam = num(v.lambdaRate, "Lambda", { min: 0.001 });
      const k = Math.round(num(v.occurrences, "Occurrences", { min: 0 }));
      let factorial = 1;
      for (let i = 2; i <= k; i++) factorial *= i;
      const prob = (Math.pow(lam, k) * Math.exp(-lam)) / factorial;
      return {
        results: [
          { label: "Probability P(X = k)", value: `${(prob * 100).toFixed(3)}% (${prob.toFixed(5)})`, primary: true },
          { label: "Variance", value: `${lam.toFixed(2)}` }
        ],
        formula: "P(X = k) = (λᵏ × e⁻λ) / k!"
      };
    }
  },

  "matrix-3x3-determinant-calculator": {
    fields: [
      { id: "r1", label: "Row 1 (3 numbers comma separated)", type: "text", default: "2, 1, 3" },
      { id: "r2", label: "Row 2 (3 numbers comma separated)", type: "text", default: "1, 0, 2" },
      { id: "r3", label: "Row 3 (3 numbers comma separated)", type: "text", default: "4, 3, 1" }
    ],
    note: "Calculates the determinant of a 3x3 matrix using Laplace cofactor expansion.",
    compute(v) {
      const parseRow = (str: string) => str.split(/[\s,]+/).filter(Boolean).map(Number);
      const r1 = parseRow(v.r1);
      const r2 = parseRow(v.r2);
      const r3 = parseRow(v.r3);
      if (r1.length !== 3 || r2.length !== 3 || r3.length !== 3) throw new Error("Each row must contain exactly 3 numbers.");
      const [a, b, c] = r1;
      const [d, e, f] = r2;
      const [g, h, i] = r3;
      const det = (a * (e * i - f * h)) - (b * (d * i - f * g)) + (c * (d * h - e * g));
      return {
        results: [
          { label: "Matrix Determinant det(A)", value: `${det.toFixed(4)}`, primary: true },
          { label: "Invertibility", value: Math.abs(det) > 1e-9 ? "Invertible (Non-singular)" : "Singular (No Inverse exists)" }
        ],
        formula: "det(A) = a(ei - fh) - b(di - fg) + c(dh - eg)"
      };
    }
  },

  "chi-square-test-calculator": {
    fields: [
      { id: "observed", label: "Observed Frequencies (Comma separated)", type: "text", default: "28, 36, 16, 20" },
      { id: "expected", label: "Expected Frequencies (Comma separated)", type: "text", default: "25, 25, 25, 25" }
    ],
    note: "Calculates Chi-Square Goodness-of-Fit test statistic χ².",
    compute(v) {
      const obs = v.observed.split(/[\s,]+/).filter(Boolean).map(Number);
      const exp = v.expected.split(/[\s,]+/).filter(Boolean).map(Number);
      if (obs.length !== exp.length || obs.length < 2) throw new Error("Observed and Expected lists must have the same length (at least 2).");
      let chiSquare = 0;
      for (let i = 0; i < obs.length; i++) {
        if (exp[i] <= 0) throw new Error("Expected values must be greater than zero.");
        chiSquare += Math.pow(obs[i] - exp[i], 2) / exp[i];
      }
      const df = obs.length - 1;
      return {
        results: [
          { label: "Chi-Square Statistic (χ²)", value: `${chiSquare.toFixed(4)}`, primary: true },
          { label: "Degrees of Freedom (df)", value: `${df}` }
        ],
        formula: "χ² = Σ [ (O - E)² / E ]"
      };
    }
  }
};
