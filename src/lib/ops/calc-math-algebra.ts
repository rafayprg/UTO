import type { CalcOp } from "./types";
import { bigDisplay, field, fmt, gcdBig, num, select, textField } from "./calc-math-core.ts";

const MATRIX_HINT = "Rows separated by ; and numbers by spaces or commas. 2×2 to 4×4.";

export function parseMatrix(text: string | undefined): number[][] {
  const rows = String(text ?? "").split(/[;\n]+/).map(row => row.trim()).filter(Boolean)
    .map(row => row.split(/[\s,]+/).filter(Boolean).map(Number));
  const size = rows.length;
  if (size < 2 || size > 4) throw new Error("Enter a square matrix with 2, 3 or 4 rows, separated by semicolons.");
  if (rows.some(row => row.length !== size)) throw new Error(`Each row needs exactly ${size} numbers for a ${size}×${size} matrix.`);
  if (rows.some(row => row.some(value => !Number.isFinite(value)))) throw new Error("The matrix contains something that is not a number.");
  return rows;
}

/** Determinant by Gaussian elimination with partial pivoting. */
export function determinant(matrix: number[][]): number {
  const m = matrix.map(row => [...row]);
  let det = 1;
  for (let col = 0; col < m.length; col += 1) {
    const pivot = m.reduce((best, row, index) => (index >= col && Math.abs(row[col]) > Math.abs(m[best][col]) ? index : best), col);
    if (m[pivot][col] === 0) return 0;
    if (pivot !== col) { [m[pivot], m[col]] = [m[col], m[pivot]]; det = -det; }
    det *= m[col][col];
    for (let row = col + 1; row < m.length; row += 1) {
      const factor = m[row][col] / m[col][col];
      m[row] = m[row].map((value, k) => value - factor * m[col][k]);
    }
  }
  return det;
}

/** Inverse by Gauss–Jordan elimination; throws for a singular matrix. */
export function inverse(matrix: number[][]): number[][] {
  const size = matrix.length;
  const scale = Math.max(...matrix.flat().map(Math.abs), 1);
  if (Math.abs(determinant(matrix)) < 1e-12 * scale ** size) throw new Error("This matrix is singular (determinant 0), so it has no inverse.");
  const m = matrix.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < size; col += 1) {
    const pivot = m.reduce((best, row, index) => (index >= col && Math.abs(row[col]) > Math.abs(m[best][col]) ? index : best), col);
    [m[pivot], m[col]] = [m[col], m[pivot]];
    const lead = m[col][col];
    m[col] = m[col].map(value => value / lead);
    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = m[row][col];
      m[row] = m[row].map((value, k) => value - factor * m[col][k]);
    }
  }
  return m.map(row => row.slice(size));
}

const clean = (value: number) => (Math.abs(value) < 1e-12 ? 0 : value);
const complexText = (re: number, im: number) => `${fmt(clean(re))} ${im < 0 ? "−" : "+"} ${fmt(Math.abs(im))}i`;
const columnHead = (size: number) => Array.from({ length: size }, (_, i) => `Column ${i + 1}`);

/** Simplifies √n into a√b for whole numbers. */
export function simplifyRadical(n: number): [number, number] {
  let outside = 1;
  let inside = n;
  for (let f = 2; f * f <= inside; f += 1) {
    while (inside % (f * f) === 0) { outside *= f; inside /= f * f; }
  }
  return [outside, inside];
}

/** Counts significant figures in a written number (trailing zeros without a decimal point are treated as not significant). */
export function countSigFigs(text: string): number {
  const mantissa = text.trim().replace(/^[-+]/, "").split(/e/i)[0];
  if (!/^(\d+\.?\d*|\.\d+)$/.test(mantissa)) throw new Error("Enter a plain number such as 0.004560 or 1.20e5.");
  const digits = mantissa.replace(".", "").replace(/^0+/, "");
  if (digits === "") return 1;
  return mantissa.includes(".") ? digits.length : digits.replace(/0+$/, "").length;
}

function sciParts(value: number, digits: number) {
  const [mantissa, exponent] = value.toExponential(digits - 1).split("e");
  return { mantissa: String(Number(mantissa)), exponent: Number(exponent) };
}

export const algebraOps: Record<string, CalcOp> = {
  quadratic: {
    fields: [field("a", "a (x² coefficient)", "1", { step: "any" }), field("b", "b (x coefficient)", "-3", { step: "any" }), field("c", "c (constant)", "-10", { step: "any" })],
    compute(v) {
      const a = num(v.a, "a");
      const b = num(v.b, "b");
      const c = num(v.c, "c");
      if (a === 0) throw new Error("a cannot be 0 in a quadratic equation (that is a linear equation).");
      const disc = b * b - 4 * a * c;
      const vertex = `(${fmt(clean(-b / (2 * a)))}, ${fmt(clean(c - b * b / (4 * a)))})`;
      const roots = disc >= 0
        ? [{ label: "x₁", value: fmt(clean((-b + Math.sqrt(disc)) / (2 * a))), primary: true }, { label: "x₂", value: fmt(clean((-b - Math.sqrt(disc)) / (2 * a))), primary: true }]
        : [{ label: "x₁", value: complexText(-b / (2 * a), Math.sqrt(-disc) / (2 * a)), primary: true }, { label: "x₂", value: complexText(-b / (2 * a), -Math.sqrt(-disc) / (2 * a)), primary: true }];
      return {
        results: [...roots, { label: "Discriminant (b² − 4ac)", value: fmt(disc) }, { label: "Root type", value: disc > 0 ? "Two real roots" : disc === 0 ? "One repeated real root" : "Two complex roots" }, { label: "Vertex", value: vertex }],
        formula: "x = (−b ± √(b² − 4ac)) ÷ 2a",
      };
    },
  },
  "matrix-determinant": {
    fields: [textField("matrix", "Matrix", "2 -1 0; 1 3 2; 0 5 -4", MATRIX_HINT)],
    compute(v) {
      const m = parseMatrix(v.matrix);
      return { results: [{ label: `Determinant (${m.length}×${m.length})`, value: fmt(clean(determinant(m))), primary: true }], formula: m.length === 2 ? "det = ad − bc" : "Gaussian elimination: det = ± product of the pivots" };
    },
  },
  "matrix-inverse": {
    fields: [textField("matrix", "Matrix", "4 7; 2 6", MATRIX_HINT)],
    compute(v) {
      const m = parseMatrix(v.matrix);
      const inv = inverse(m);
      return {
        results: [{ label: "Determinant", value: fmt(clean(determinant(m))), primary: true }, { label: "Inverse (rows)", value: inv.map(row => row.map(value => fmt(clean(value), 6)).join("  ")).join("; ") }],
        formula: "Gauss–Jordan elimination on [A | I] gives [I | A⁻¹]",
        table: { head: columnHead(m.length), rows: inv.map(row => row.map(value => fmt(clean(value), 8))) },
      };
    },
  },
  logarithm: {
    fields: [field("x", "Number (x)", "1000", { step: "any" }), select("base", "Base", "10", [["10", "10 (common log)"], ["e", "e (natural log, ln)"], ["2", "2 (binary log)"], ["custom", "Custom base"]]), field("custom", "Custom base", "5", { step: "any", hint: "Used when the base is “Custom”." })],
    compute(v) {
      const x = num(v.x, "x", { above: 0 });
      const base = v.base === "e" ? Math.E : v.base === "custom" ? num(v.custom, "the base", { above: 0 }) : Number(v.base);
      if (base === 1) throw new Error("The base cannot be 1.");
      const label = v.base === "e" ? "ln" : `log base ${fmt(base)}`;
      return {
        results: [{ label: `${label} of ${fmt(x)}`, value: fmt(Math.log(x) / Math.log(base), 12), primary: true }, { label: "ln x", value: fmt(Math.log(x), 12) }, { label: "log₁₀ x", value: fmt(Math.log10(x), 12) }, { label: "log₂ x", value: fmt(Math.log2(x), 12) }],
        formula: "log_b(x) = ln x ÷ ln b",
      };
    },
  },
  exponent: {
    fields: [field("base", "Base", "2", { step: "any" }), field("power", "Exponent", "64", { step: "any" })],
    compute(v) {
      const base = num(v.base, "the base");
      const power = num(v.power, "the exponent");
      if (base < 0 && !Number.isInteger(power)) throw new Error("A negative base needs a whole-number exponent for a real result.");
      if (base === 0 && power < 0) throw new Error("0 raised to a negative power is undefined.");
      const exact = Number.isInteger(base) && Number.isInteger(power) && power >= 0 && power <= 10000 && Math.abs(base) <= 1e6 ? BigInt(base) ** BigInt(power) : null;
      const exactText = exact === null ? null : exact.toString();
      return {
        results: [
          { label: `${fmt(base)}^${fmt(power)}`, value: exact !== null ? bigDisplay(exact, 30) : fmt(base ** power), primary: true },
          { label: "Digits in the exact result", value: exactText ? String(exactText.replace("-", "").length) : "—" },
        ],
        formula: "bⁿ = b × b × … × b (n times)",
      };
    },
  },
  "square-root": {
    fields: [field("x", "Number", "72", { step: "any" })],
    compute(v) {
      const x = num(v.x, "the number", { min: 0 });
      const root = Math.sqrt(x);
      const radical = Number.isInteger(x) && x <= 1e12 ? simplifyRadical(x) : null;
      const simplified = radical === null ? "—" : radical[1] === 1 ? String(radical[0]) : `${radical[0] === 1 ? "" : radical[0]}√${radical[1]}`;
      return { results: [{ label: `√${fmt(x)}`, value: fmt(root, 12), primary: true }, { label: "Simplified radical", value: simplified }, { label: "Perfect square", value: Number.isInteger(root) ? "Yes" : "No" }], formula: "√x × √x = x" };
    },
  },
  "nth-root": {
    fields: [field("x", "Number (x)", "243", { step: "any" }), field("n", "Root (n)", "5", { step: "any" })],
    compute(v) {
      const x = num(v.x, "x");
      const n = num(v.n, "n");
      if (n === 0) throw new Error("The root cannot be 0.");
      const oddInteger = Number.isInteger(n) && Math.abs(n) % 2 === 1;
      if (x < 0 && !oddInteger) throw new Error("A negative number only has a real root when n is an odd whole number.");
      const root = x < 0 ? -(Math.abs(x) ** (1 / n)) : x ** (1 / n);
      const rounded = Math.round(root);
      const value = Math.abs(rounded ** n - x) < 1e-9 * Math.max(1, Math.abs(x)) ? rounded : root;
      return { results: [{ label: `${fmt(n)}th root of ${fmt(x)}`, value: fmt(value, 12), primary: true }, { label: "Check (rootⁿ)", value: fmt(value ** n, 10) }], formula: "ⁿ√x = x^(1/n)" };
    },
  },
  "scientific-notation": {
    fields: [textField("x", "Number", "0.000045678", "Decimal or E notation, like 4.5678e-5.")],
    compute(v) {
      const text = String(v.x ?? "").replace(/[,\s]/g, "").replace(/×10\^/i, "e");
      const x = Number(text);
      if (text === "" || !Number.isFinite(x)) throw new Error("Enter a number such as 123000, 0.0042 or 6.02e23.");
      if (x === 0) return { results: [{ label: "Scientific notation", value: "0 × 10^0", primary: true }, { label: "E notation", value: "0e0" }, { label: "Decimal", value: "0" }] };
      const { mantissa, exponent } = sciParts(x, 15);
      const eng = Math.floor(exponent / 3) * 3;
      return {
        results: [
          { label: "Scientific notation", value: `${mantissa} × 10^${exponent}`, primary: true },
          { label: "E notation", value: `${mantissa}e${exponent}` },
          { label: "Engineering notation", value: `${String(Number((x / 10 ** eng).toPrecision(15)))} × 10^${eng}` },
          { label: "Decimal", value: Math.abs(exponent) <= 20 ? x.toLocaleString("en-US", { maximumFractionDigits: 20, maximumSignificantDigits: 15 }) : "Too long to show as a decimal" },
        ],
        formula: "x = a × 10^n, with 1 ≤ |a| < 10",
      };
    },
  },
  ratio: {
    fields: [field("a", "A", "3", { step: "any" }), field("b", "B", "4", { step: "any" }), field("c", "C", "15", { step: "any", hint: "Solves A : B = C : D for D." })],
    compute(v) {
      const a = num(v.a, "A", { above: 0 });
      const b = num(v.b, "B", { above: 0 });
      const c = num(v.c, "C", { min: 0 });
      return {
        results: [{ label: "D (A : B = C : D)", value: fmt(c * b / a), primary: true }, { label: "A : B simplified", value: simplifyRatio(a, b) }, { label: "A ÷ B", value: fmt(a / b) }, { label: "A as a share of A + B", value: `${fmt(a / (a + b) * 100, 4)}%` }],
        formula: "D = C × B ÷ A",
      };
    },
  },
  "significant-figures": {
    fields: [textField("x", "Number", "0.0045678", "Decimal or E notation."), field("sig", "Round to significant figures", "3", { step: "1" })],
    compute(v) {
      const text = String(v.x ?? "").replace(/,/g, "").trim();
      const x = Number(text);
      if (text === "" || !Number.isFinite(x)) throw new Error("Enter a number such as 0.004560 or 1.20e5.");
      const sig = num(v.sig, "the significant figures", { min: 1, max: 15, integer: true });
      const rounded = x.toPrecision(sig);
      const { mantissa, exponent } = sciParts(Number(rounded), sig);
      return {
        results: [
          { label: `Rounded to ${sig} significant figures`, value: rounded.includes("e") ? `${Number(mantissa).toFixed(sig - 1)} × 10^${exponent}` : rounded, primary: true },
          { label: "Scientific notation", value: x === 0 ? "0" : `${Number(mantissa).toFixed(sig - 1)} × 10^${exponent}` },
          { label: "Significant figures in your number", value: String(countSigFigs(text)) },
        ],
        formula: "Keep the first n non-zero-leading digits, then round",
      };
    },
  },
};

function simplifyRatio(a: number, b: number): string {
  const decimals = Math.max(...[a, b].map(value => (String(value).split(".")[1] ?? "").length));
  if (decimals > 6) return `${fmt(a / b, 6)} : 1`;
  const scale = 10 ** decimals;
  const [x, y] = [BigInt(Math.round(a * scale)), BigInt(Math.round(b * scale))];
  const g = gcdBig(x, y);
  return `${x / g} : ${y / g}`;
}
