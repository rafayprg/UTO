import type { CalcOp } from "./types";
import { FAMILIES, convert, factorText, field, fmt, num, select, unit } from "./calc-units-core.ts";
import { specialOps } from "./calc-units-special.ts";
import { advancedUnitsOps } from "./calc-units-advanced.ts";

const COMMON_VALUES = [1, 2, 5, 10, 20, 50, 100, 1000];
const TEMPERATURE_VALUES = [-40, -10, 0, 10, 20, 25, 30, 37, 100];

function linearFormula(family: string, from: string, to: string): string {
  const [a, b] = [unit(family, from), unit(family, to)];
  const k = a.factor / b.factor;
  const [times, divide] = [factorText(k), factorText(1 / k)];
  return divide.length < times.length ? `${b.symbol} = ${a.symbol} ÷ ${divide}` : `${b.symbol} = ${a.symbol} × ${times}`;
}

function temperatureFormula(from: string, to: string): string {
  const formulas: Record<string, string> = {
    "C-F": "°F = °C × 9/5 + 32", "F-C": "°C = (°F − 32) × 5/9", "C-K": "K = °C + 273.15",
    "K-C": "°C = K − 273.15", "F-K": "K = (°F − 32) × 5/9 + 273.15", "K-F": "°F = (K − 273.15) × 9/5 + 32",
  };
  return formulas[`${from}-${to}`] ?? "";
}

const formulaFor = (family: string, from: string, to: string) => (family === "temperature" ? temperatureFormula(from, to) : linearFormula(family, from, to));
const readValue = (family: string, value: string | undefined) => num(value, "the value", { min: family === "temperature" ? -Infinity : 0 });

/** A dedicated "A to B" page: one input, the answer, the reverse conversion and a quick-reference table. */
function pairOp(family: string, from: string, to: string, def: string): CalcOp {
  const [a, b] = [unit(family, from), unit(family, to)];
  const samples = family === "temperature" ? TEMPERATURE_VALUES : COMMON_VALUES;
  return {
    fields: [field("value", `${a.label} (${a.symbol})`, def)],
    note: FAMILIES[family].note,
    compute(v) {
      const value = readValue(family, v.value);
      return {
        results: [
          { label: `${fmt(value)} ${a.symbol} in ${b.label.toLowerCase()}`, value: `${fmt(convert(family, value, from, to))} ${b.symbol}`, primary: true },
          { label: `Reverse: ${fmt(value)} ${b.symbol} in ${a.label.toLowerCase()}`, value: `${fmt(convert(family, value, to, from))} ${a.symbol}` },
        ],
        formula: formulaFor(family, from, to),
        table: { head: [`${a.label} (${a.symbol})`, `${b.label} (${b.symbol})`], rows: samples.map(sample => [fmt(sample), fmt(convert(family, sample, from, to))]) },
      };
    },
  };
}

/** A whole-family converter: pick both units, see the value in every unit of the family. */
function familyOp(family: string, from: string, to: string, def: string): CalcOp {
  const { units, note } = FAMILIES[family];
  const choices = units.map((item): [string, string] => [item.id, `${item.label} (${item.symbol})`]);
  return {
    fields: [field("value", "Value", def), select("from", "From", from, choices), select("to", "To", to, choices)],
    note,
    compute(v) {
      const value = readValue(family, v.value);
      const [a, b] = [unit(family, v.from), unit(family, v.to)];
      return {
        results: [{ label: `${fmt(value)} ${a.symbol} in ${b.label.toLowerCase()}`, value: `${fmt(convert(family, value, a.id, b.id))} ${b.symbol}`, primary: true }],
        formula: a.id === b.id ? undefined : formulaFor(family, a.id, b.id),
        table: { head: ["Unit", "Value"], rows: units.map(item => [`${item.label} (${item.symbol})`, fmt(convert(family, value, a.id, item.id))]) },
      };
    },
  };
}

export const ops: Record<string, CalcOp> = {
  "km-to-mi": pairOp("length", "km", "mi", "10"),
  "mi-to-km": pairOp("length", "mi", "km", "5"),
  "m-to-ft": pairOp("length", "m", "ft", "1"),
  "ft-to-m": pairOp("length", "ft", "m", "10"),
  "cm-to-in": pairOp("length", "cm", "in", "30"),
  "in-to-cm": pairOp("length", "in", "cm", "12"),
  "mm-to-in": pairOp("length", "mm", "in", "25"),
  "yd-to-m": pairOp("length", "yd", "m", "100"),
  "kg-to-lb": pairOp("mass", "kg", "lb", "70"),
  "lb-to-kg": pairOp("mass", "lb", "kg", "150"),
  "g-to-oz": pairOp("mass", "g", "oz", "100"),
  "oz-to-g": pairOp("mass", "oz", "g", "8"),
  "st-to-kg": pairOp("mass", "st", "kg", "11"),
  "c-to-f": pairOp("temperature", "C", "F", "25"),
  "f-to-c": pairOp("temperature", "F", "C", "98.6"),
  "c-to-k": pairOp("temperature", "C", "K", "25"),
  "ft2-to-m2": pairOp("area", "ft2", "m2", "1000"),
  "m2-to-ft2": pairOp("area", "m2", "ft2", "100"),
  "acre-to-ha": pairOp("area", "acre", "ha", "10"),
  "ha-to-acre": pairOp("area", "ha", "acre", "5"),
  "l-to-gal": pairOp("volume", "L", "usgal", "20"),
  "gal-to-l": pairOp("volume", "usgal", "L", "5"),
  "ml-to-floz": pairOp("volume", "mL", "usfloz", "500"),
  "floz-to-ml": pairOp("volume", "usfloz", "mL", "16"),
  "mph-to-kmh": pairOp("speed", "mph", "kmh", "60"),
  "kmh-to-mph": pairOp("speed", "kmh", "mph", "100"),
  "knot-to-kmh": pairOp("speed", "knot", "kmh", "20"),
  "gb-to-gib": pairOp("data", "GB", "GiB", "500"),
  "mb-to-gb": pairOp("data", "MB", "GB", "2500"),
  "gb-to-mb": pairOp("data", "GB", "MB", "4.7"),
  "tb-to-tib": pairOp("data", "TB", "TiB", "2"),
  "mbps-to-mbs": pairOp("rate", "Mbps", "MBs", "100"),
  "psi-to-bar": pairOp("pressure", "psi", "bar", "32"),
  "bar-to-psi": pairOp("pressure", "bar", "psi", "2.2"),
  "kcal-to-kj": pairOp("energy", "kcal", "kJ", "2000"),
  "kj-to-kcal": pairOp("energy", "kJ", "kcal", "1000"),
  "hp-to-kw": pairOp("power", "hp", "kW", "150"),
  "kw-to-hp": pairOp("power", "kW", "hp", "100"),
  pressure: familyOp("pressure", "psi", "kPa", "30"),
  energy: familyOp("energy", "kWh", "kJ", "1"),
  power: familyOp("power", "kW", "hp", "10"),
  angle: familyOp("angle", "deg", "rad", "90"),
  "data-rate": familyOp("rate", "Mbps", "MBs", "300"),
  ...specialOps,
  ...advancedUnitsOps,
};
