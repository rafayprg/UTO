import type { CalcOp, CalcOutput } from "./types";
import { field, fmt, num, numberList, select, textField } from "./calc-math-core.ts";

const LIST_HINT = "Separate numbers with commas, spaces or new lines.";
const SAMPLE_CHOICES: Array<[string, string]> = [["sample", "Sample (divide by n − 1)"], ["population", "Population (divide by n)"]];

export const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function modes(values: number[]): number[] {
  const counts = values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<number, number>());
  const top = Math.max(...counts.values());
  if (top === 1) return [];
  return [...counts.entries()].filter(([, count]) => count === top).map(([value]) => value).sort((a, b) => a - b);
}

export function variance(values: number[], sample: boolean): number {
  if (sample && values.length < 2) throw new Error("A sample needs at least two numbers.");
  const m = mean(values);
  return values.reduce((total, value) => total + (value - m) ** 2, 0) / (values.length - (sample ? 1 : 0));
}

/** Standard normal cumulative distribution (Chebyshev erfc approximation, error below 1.2e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const poly = -x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))));
  const erfc = t * Math.exp(poly);
  return z >= 0 ? 1 - erfc / 2 : erfc / 2;
}

const GRADE_POINTS: Record<string, number> = { "A+": 4, A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, "D-": 0.7, F: 0 };

/** Parses "A 3, B+ 4" or "3.7 3; 3.0 4" into [points, credits] pairs. */
export function gradeEntries(text: string | undefined, maxPoints: number): Array<[number, number]> {
  const items = String(text ?? "").split(/[,;\n]+/).map(item => item.trim()).filter(Boolean);
  if (items.length === 0) throw new Error("Enter at least one grade and its credits, like “A 3”.");
  return items.map(item => {
    const [grade, credits, extra] = item.split(/\s+/);
    const points = GRADE_POINTS[grade.toUpperCase()] ?? Number(grade);
    const hours = Number(credits);
    if (extra !== undefined || credits === undefined) throw new Error(`Write each entry as a grade and its credits, like “B+ 4”. Check “${item}”.`);
    if (!Number.isFinite(points) || points < 0 || points > maxPoints) throw new Error(`“${grade}” is not a letter grade or a number from 0 to ${maxPoints}.`);
    if (!Number.isFinite(hours) || hours <= 0) throw new Error(`The credits in “${item}” must be a positive number.`);
    return [points, hours];
  });
}

function weightedGpa(entries: Array<[number, number]>) {
  const credits = entries.reduce((sum, [, c]) => sum + c, 0);
  const points = entries.reduce((sum, [p, c]) => sum + p * c, 0);
  return { gpa: points / credits, credits, points };
}

function spread(v: Record<string, string>, primary: "sd" | "variance"): CalcOutput {
  const values = numberList(v.values, "the data set");
  const sample = v.kind !== "population";
  const varValue = variance(values, sample);
  const sd = Math.sqrt(varValue);
  const results = [
    { label: `${sample ? "Sample" : "Population"} standard deviation`, value: fmt(sd), primary: primary === "sd" },
    { label: `${sample ? "Sample" : "Population"} variance`, value: fmt(varValue), primary: primary === "variance" },
    { label: "Mean", value: fmt(mean(values)) },
    { label: "Count", value: String(values.length) },
  ];
  return {
    results: primary === "sd" ? results : [results[1], results[0], results[2], results[3]],
    formula: sample ? "s² = Σ(x − x̄)² ÷ (n − 1); s = √s²" : "σ² = Σ(x − μ)² ÷ n; σ = √σ²",
  };
}

export const statsOps: Record<string, CalcOp> = {
  "mean-median-mode": {
    fields: [textField("values", "Numbers", "4, 8, 15, 16, 23, 42, 8", LIST_HINT)],
    compute(v) {
      const values = numberList(v.values, "the data set");
      const found = modes(values);
      return {
        results: [
          { label: "Mean (average)", value: fmt(mean(values)), primary: true },
          { label: "Median", value: fmt(median(values)) },
          { label: "Mode", value: found.length ? found.map(value => fmt(value)).join(", ") : "No mode (every value appears once)" },
          { label: "Range", value: fmt(Math.max(...values) - Math.min(...values)) },
          { label: "Sum", value: fmt(values.reduce((a, b) => a + b, 0)) },
          { label: "Count", value: String(values.length) },
        ],
        formula: "mean = Σx ÷ n; median = middle value of the sorted list",
      };
    },
  },
  "standard-deviation": {
    fields: [textField("values", "Numbers", "2, 4, 4, 4, 5, 5, 7, 9", LIST_HINT), select("kind", "Data type", "sample", SAMPLE_CHOICES)],
    compute: v => spread(v, "sd"),
  },
  variance: {
    fields: [textField("values", "Numbers", "12, 15, 11, 18, 20, 14", LIST_HINT), select("kind", "Data type", "sample", SAMPLE_CHOICES)],
    compute: v => spread(v, "variance"),
  },
  "z-score": {
    fields: [field("x", "Value (x)", "85", { step: "any" }), field("mean", "Mean (μ)", "70", { step: "any" }), field("sd", "Standard deviation (σ)", "10", { step: "any" })],
    note: "Percentiles assume a normal distribution.",
    compute(v) {
      const x = num(v.x, "the value");
      const m = num(v.mean, "the mean");
      const sd = num(v.sd, "the standard deviation", { above: 0 });
      const z = (x - m) / sd;
      const below = normalCdf(z);
      return {
        results: [
          { label: "Z-score", value: fmt(z, 6), primary: true },
          { label: "Percentile (area below x)", value: `${fmt(below * 100, 4)}%` },
          { label: "Area above x", value: `${fmt((1 - below) * 100, 4)}%` },
        ],
        formula: "z = (x − μ) ÷ σ",
      };
    },
  },
  "weighted-average": {
    fields: [textField("values", "Values", "90, 82, 75", LIST_HINT), textField("weights", "Weights (same order)", "50, 30, 20", "For example credits, percentages or quantities.")],
    compute(v) {
      const values = numberList(v.values, "the values");
      const weights = numberList(v.weights, "the weights");
      if (values.length !== weights.length) throw new Error(`You entered ${values.length} values but ${weights.length} weights. They must match.`);
      if (weights.some(w => w < 0)) throw new Error("Weights cannot be negative.");
      const total = weights.reduce((a, b) => a + b, 0);
      if (total === 0) throw new Error("The weights add up to zero.");
      return {
        results: [{ label: "Weighted average", value: fmt(values.reduce((sum, value, i) => sum + value * weights[i], 0) / total), primary: true }, { label: "Sum of weights", value: fmt(total) }, { label: "Simple average", value: fmt(mean(values)) }],
        formula: "weighted average = Σ(value × weight) ÷ Σ weight",
      };
    },
  },
  gpa: {
    fields: [textField("courses", "Courses: grade and credits", "A 3, B+ 4, A- 3, B 2", "Letter grades (A, A-, B+…) or points 0–4, each followed by its credits.")],
    note: "Uses the common 4.0 scale (A = 4.0, A− = 3.7, B+ = 3.3 … F = 0; A+ counts as 4.0). Schools differ, so check your school's scale.",
    compute(v) {
      const { gpa, credits, points } = weightedGpa(gradeEntries(v.courses, 4));
      return { results: [{ label: "GPA", value: gpa.toFixed(2), primary: true }, { label: "Total credits", value: fmt(credits) }, { label: "Quality points", value: fmt(points) }], formula: "GPA = Σ(grade points × credits) ÷ Σ credits" };
    },
  },
  cgpa: {
    fields: [textField("terms", "Terms: GPA and credits", "3.6 15, 3.2 16, 3.85 14", "Each term's GPA followed by its credits, separated by commas."), field("scale", "Grading scale maximum", "4", { step: "any", hint: "For example 4, 5 or 10." })],
    note: "Credit-weighted cumulative average. Some universities use their own rules (repeated courses, pass/fail), so check yours.",
    compute(v) {
      const scale = num(v.scale, "the scale", { above: 0, max: 100 });
      const { gpa, credits } = weightedGpa(gradeEntries(v.terms, scale));
      return { results: [{ label: "Cumulative GPA (CGPA)", value: gpa.toFixed(2), primary: true }, { label: "Total credits", value: fmt(credits) }, { label: "As a percentage of the scale", value: `${fmt(gpa / scale * 100, 4)}%` }], formula: "CGPA = Σ(term GPA × term credits) ÷ Σ credits" };
    },
  },
};
