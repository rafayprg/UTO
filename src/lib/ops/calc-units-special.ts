import type { CalcOp } from "./types";
import { field, fmt, num, select } from "./calc-units-core.ts";

const MILE_KM = 1.609344;
const US_GALLON_L = 3.785411784;
const UK_GALLON_L = 4.54609;
const US_FLOZ_ML = US_GALLON_L * 1000 / 128;

// Fuel economy: everything goes through km per liter. L/100 km is the inverse of distance per volume.
const FUEL: Array<{ id: string; label: string; toKmL: (x: number) => number; fromKmL: (x: number) => number }> = [
  { id: "mpgUS", label: "Miles per US gallon (mpg US)", toKmL: x => x * MILE_KM / US_GALLON_L, fromKmL: x => x * US_GALLON_L / MILE_KM },
  { id: "mpgUK", label: "Miles per Imperial gallon (mpg UK)", toKmL: x => x * MILE_KM / UK_GALLON_L, fromKmL: x => x * UK_GALLON_L / MILE_KM },
  { id: "L100", label: "Liters per 100 km (L/100 km)", toKmL: x => 100 / x, fromKmL: x => 100 / x },
  { id: "kmL", label: "Kilometers per liter (km/L)", toKmL: x => x, fromKmL: x => x },
];

const COOKING: Array<[id: string, label: string, ml: number]> = [
  ["cup", "US cups", US_FLOZ_ML * 8],
  ["tbsp", "US tablespoons", US_FLOZ_ML / 2],
  ["tsp", "US teaspoons", US_FLOZ_ML / 6],
  ["floz", "US fluid ounces", US_FLOZ_ML],
  ["ml", "Milliliters", 1],
  ["l", "Liters", 1000],
  ["metriccup", "Metric cups (250 mL)", 250],
  ["ukfloz", "Imperial fluid ounces", UK_GALLON_L * 1000 / 160],
  ["gwater", "Grams of water", 1],
];

const SIZE_UNITS: Array<[string, string, number]> = [["MB", "MB (megabytes)", 1e6], ["GB", "GB (gigabytes)", 1e9], ["TB", "TB (terabytes)", 1e12], ["MiB", "MiB (mebibytes)", 2 ** 20], ["GiB", "GiB (gibibytes)", 2 ** 30]];
const SPEED_UNITS: Array<[string, string, number]> = [["Mbps", "Mbps (megabits/s)", 1e6], ["Gbps", "Gbps (gigabits/s)", 1e9], ["kbps", "kbps (kilobits/s)", 1e3], ["MBs", "MB/s (megabytes/s)", 8e6]];

const ROMAN: Array<[number, string]> = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const ROMAN_PATTERN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) throw new Error("Enter a whole number from 1 to 3999.");
  let rest = value;
  return ROMAN.reduce((text, [amount, symbol]) => {
    const count = Math.floor(rest / amount);
    rest -= count * amount;
    return text + symbol.repeat(count);
  }, "");
}

export function fromRoman(text: string): number {
  const clean = text.trim().toUpperCase();
  if (!clean || !ROMAN_PATTERN.test(clean)) throw new Error("Enter a standard Roman numeral from I to MMMCMXCIX (1–3999), like XLII.");
  let total = 0;
  let index = 0;
  for (const [amount, symbol] of ROMAN) {
    while (clean.startsWith(symbol, index)) { total += amount; index += symbol.length; }
  }
  return total;
}

/** "1 h 2 min 3.5 s" style duration. */
export function durationText(seconds: number): string {
  if (!Number.isFinite(seconds)) throw new Error("That download time is too long to calculate.");
  if (seconds < 1) return `${fmt(seconds, 3)} s`;
  const parts: Array<[number, string]> = [[86400, "d"], [3600, "h"], [60, "min"]];
  let rest = Math.round(seconds);
  const text = parts.reduce<string[]>((list, [size, label]) => {
    const count = Math.floor(rest / size);
    rest -= count * size;
    return count > 0 || list.length > 0 ? [...list, `${count} ${label}`] : list;
  }, []);
  return [...text, `${rest} s`].join(" ");
}

const pick = <T extends [string, ...unknown[]]>(list: T[], id: string | undefined): T => {
  const found = list.find(item => item[0] === id);
  if (!found) throw new Error("Choose a unit from the list.");
  return found;
};

export const specialOps: Record<string, CalcOp> = {
  "fuel-economy": {
    fields: [field("value", "Fuel economy", "30"), select("from", "Unit", "mpgUS", FUEL.map((item): [string, string] => [item.id, item.label]))],
    note: "mpg and km/L measure distance per fuel (higher is better); L/100 km measures fuel per distance (lower is better), so it is the inverse.",
    compute(v) {
      const value = num(v.value, "the fuel economy", { min: 0 });
      if (value === 0) throw new Error("Fuel economy must be greater than 0.");
      const from = FUEL.find(item => item.id === v.from);
      if (!from) throw new Error("Choose a unit from the list.");
      const kmL = from.toKmL(value);
      const rows = FUEL.map(item => [item.label, fmt(item.fromKmL(kmL), 6)]);
      const others = FUEL.filter(item => item.id !== from.id).map(item => ({ label: item.label, value: fmt(item.fromKmL(kmL), 6) }));
      return { results: [{ ...others[0], primary: true }, ...others.slice(1)], formula: "L/100 km = 235.214583 ÷ mpg (US); 282.480936 ÷ mpg (UK)", table: { head: ["Unit", "Value"], rows } };
    },
  },
  cooking: {
    fields: [
      field("value", "Amount", "1"),
      select("from", "From", "cup", COOKING.map(([id, label]): [string, string] => [id, label])),
      select("to", "To", "ml", COOKING.map(([id, label]): [string, string] => [id, label])),
    ],
    note: "Volume conversions are exact for US customary units. Grams are shown for water only (1 mL of water ≈ 1 g); flour, sugar, butter and other ingredients have different densities.",
    compute(v) {
      const value = num(v.value, "the amount", { min: 0 });
      const [, fromLabel, fromMl] = pick(COOKING, v.from);
      const [, toLabel, toMl] = pick(COOKING, v.to);
      const ml = value * fromMl;
      return {
        results: [{ label: `${fmt(value)} ${fromLabel.toLowerCase()} in ${toLabel.toLowerCase()}`, value: fmt(ml / toMl, 6), primary: true }],
        formula: "1 US cup = 16 tbsp = 48 tsp = 8 US fl oz = 236.5882365 mL",
        table: { head: ["Unit", "Amount"], rows: COOKING.map(([, label, factor]) => [label, fmt(ml / factor, 6)]) },
      };
    },
  },
  "download-time": {
    fields: [
      field("size", "File size", "4.7"),
      select("sizeUnit", "Size unit", "GB", SIZE_UNITS.map(([id, label]): [string, string] => [id, label])),
      field("speed", "Connection speed", "100"),
      select("speedUnit", "Speed unit", "Mbps", SPEED_UNITS.map(([id, label]): [string, string] => [id, label])),
      field("overhead", "Protocol overhead (%)", "0", { hint: "Optional allowance for real-world slowdowns, e.g. 10." }),
    ],
    note: "Real downloads are often slower than the advertised speed because of network conditions, server limits and protocol overhead.",
    compute(v) {
      const size = num(v.size, "the file size", { min: 0 });
      const speed = num(v.speed, "the connection speed", { min: 0 });
      if (speed === 0) throw new Error("The connection speed must be greater than 0.");
      const overhead = num(v.overhead || "0", "the overhead", { min: 0 });
      if (overhead >= 100) throw new Error("The overhead must be below 100%.");
      const bits = size * pick(SIZE_UNITS, v.sizeUnit)[2] * 8;
      const rate = speed * pick(SPEED_UNITS, v.speedUnit)[2] * (1 - overhead / 100);
      const seconds = bits / rate;
      return {
        results: [{ label: "Estimated download time", value: durationText(seconds), primary: true }, { label: "In seconds", value: fmt(seconds, 6) }, { label: "Effective speed", value: `${fmt(rate / 8e6, 6)} MB/s` }],
        formula: "time = file size in bits ÷ speed in bits per second (1 byte = 8 bits)",
      };
    },
  },
  "number-to-roman": {
    fields: [field("value", "Number (1–3999)", "2026", { step: "1" })],
    compute(v) {
      const value = num(v.value, "the number");
      const roman = toRoman(value);
      return { results: [{ label: `${value} in Roman numerals`, value: roman, primary: true }, { label: "Symbols used", value: String(roman.length) }], formula: "M=1000, D=500, C=100, L=50, X=10, V=5, I=1; subtractive pairs CM, CD, XC, XL, IX, IV" };
    },
  },
  "roman-to-number": {
    fields: [{ id: "value", label: "Roman numeral", type: "text", default: "MCMXCIV", hint: "Standard form, I to MMMCMXCIX." }],
    compute(v) {
      const value = fromRoman(String(v.value ?? ""));
      return { results: [{ label: `${String(v.value).trim().toUpperCase()} as a number`, value: String(value), primary: true }], formula: "Add symbol values left to right; a smaller symbol before a larger one is subtracted" };
    },
  },
  "cm-to-ft-in": {
    fields: [field("value", "Height or length (cm)", "175")],
    compute(v) {
      const cm = num(v.value, "the length", { min: 0 });
      const totalInches = cm / 2.54;
      let feet = Math.floor(totalInches / 12);
      let inches = Math.round((totalInches - feet * 12) * 10) / 10;
      if (inches >= 12) { feet += 1; inches -= 12; }
      return {
        results: [{ label: `${fmt(cm)} cm in feet and inches`, value: `${feet} ft ${fmt(inches, 3)} in`, primary: true }, { label: "Total inches", value: `${fmt(totalInches, 6)} in` }, { label: "Decimal feet", value: `${fmt(totalInches / 12, 6)} ft` }],
        formula: "inches = cm ÷ 2.54; feet = inches ÷ 12",
        table: { head: ["Centimeters", "Feet and inches"], rows: [150, 160, 165, 170, 175, 180, 185, 190].map(value => { const inch = value / 2.54; return [String(value), `${Math.floor(inch / 12)} ft ${fmt(inch % 12, 3)} in`]; }) },
      };
    },
  },
};
