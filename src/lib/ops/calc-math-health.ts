import type { CalcField, CalcOp } from "./types";
import { field, fmt, num, select } from "./calc-math-core.ts";

export const HEALTH_NOTE = "Estimate only; not medical advice. Talk to a doctor or dietitian about your own health.";
const LB = 0.45359237;
const INCH = 2.54;

const SYSTEM = select("units", "Units", "metric", [["metric", "Metric (kg, cm)"], ["us", "US (lb, ft + in)"]]);
const SEX = select("sex", "Sex", "male", [["male", "Male"], ["female", "Female"]]);
const WEIGHT = field("weight", "Weight (kg or lb)", "70", { step: "0.1", hint: "kg for metric, lb for US." });
const HEIGHT: CalcField[] = [
  field("heightCm", "Height (cm) — metric", "175", { step: "0.1" }),
  field("heightFt", "Height (feet) — US", "5", { step: "1" }),
  field("heightIn", "Height (inches) — US", "9", { step: "0.1" }),
];
const AGE = field("age", "Age (years)", "30", { step: "1" });

const ACTIVITY: Array<[string, string]> = [
  ["1.2", "Sedentary (little or no exercise)"],
  ["1.375", "Lightly active (1–3 days a week)"],
  ["1.55", "Moderately active (3–5 days a week)"],
  ["1.725", "Very active (6–7 days a week)"],
  ["1.9", "Extra active (physical job or twice-daily training)"],
];

export function heightCm(v: Record<string, string>): number {
  const cm = v.units === "us"
    ? (num(v.heightFt, "the feet", { min: 0, max: 9 }) * 12 + num(v.heightIn || "0", "the inches", { min: 0, max: 11.99 })) * INCH
    : num(v.heightCm, "the height", { above: 0 });
  if (cm < 50 || cm > 275) throw new Error("Enter a height between 50 and 275 cm (about 1 ft 8 in to 9 ft).");
  return cm;
}

export function weightKg(v: Record<string, string>): number {
  const kg = num(v.weight, "the weight", { above: 0 }) * (v.units === "us" ? LB : 1);
  if (kg < 2 || kg > 650) throw new Error("Enter a weight between 2 and 650 kg (about 4 to 1,430 lb).");
  return kg;
}

export function mifflin(kg: number, cm: number, age: number, sex: string): number {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === "female" ? -161 : 5);
}

const age = (v: Record<string, string>) => num(v.age, "the age", { min: 15, max: 120, integer: true });
const both = (kg: number) => `${fmt(kg, 3)} kg (${fmt(kg / LB, 3)} lb)`;

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight (below 18.5)";
  if (bmi < 25) return "Healthy weight (18.5–24.9)";
  if (bmi < 30) return "Overweight (25–29.9)";
  return "Obesity (30 or more)";
}

/** US Navy body-fat formula, measurements in centimeters. */
export function navyBodyFat(sex: string, height: number, neck: number, waist: number, hip: number): number {
  if (sex === "female") {
    if (waist + hip - neck <= 0) throw new Error("Waist plus hip must be larger than the neck measurement.");
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
  }
  if (waist - neck <= 0) throw new Error("The waist must be larger than the neck measurement.");
  return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
}

export const healthOps: Record<string, CalcOp> = {
  bmi: {
    fields: [SYSTEM, WEIGHT, ...HEIGHT],
    note: `${HEALTH_NOTE} Adult categories use the WHO BMI ranges; BMI does not measure body fat directly and is not used the same way for children.`,
    compute(v) {
      const kg = weightKg(v);
      const m = heightCm(v) / 100;
      const bmi = kg / (m * m);
      return {
        results: [{ label: "BMI", value: fmt(bmi, 3), primary: true }, { label: "Category (adults)", value: bmiCategory(bmi) }, { label: "Weight range for BMI 18.5–24.9", value: `${fmt(18.5 * m * m, 3)}–${fmt(24.9 * m * m, 3)} kg (${fmt(18.5 * m * m / LB, 3)}–${fmt(24.9 * m * m / LB, 3)} lb)` }],
        formula: "BMI = weight (kg) ÷ height (m)²  (US: 703 × lb ÷ in²)",
      };
    },
  },
  bmr: {
    fields: [SYSTEM, SEX, AGE, WEIGHT, ...HEIGHT],
    note: HEALTH_NOTE,
    compute(v) {
      const bmr = mifflin(weightKg(v), heightCm(v), age(v), v.sex);
      return { results: [{ label: "Basal metabolic rate", value: `${fmt(Math.round(bmr), 6)} kcal/day`, primary: true }, { label: "In kilojoules", value: `${fmt(Math.round(bmr * 4.184), 6)} kJ/day` }], formula: v.sex === "female" ? "Mifflin–St Jeor: 10w + 6.25h − 5a − 161" : "Mifflin–St Jeor: 10w + 6.25h − 5a + 5" };
    },
  },
  tdee: {
    fields: [SYSTEM, SEX, AGE, WEIGHT, ...HEIGHT, select("activity", "Activity level", "1.55", ACTIVITY)],
    note: `${HEALTH_NOTE} Activity multipliers are common approximations.`,
    compute(v) {
      const bmr = mifflin(weightKg(v), heightCm(v), age(v), v.sex);
      const tdee = bmr * num(v.activity, "the activity level", { min: 1 });
      return {
        results: [{ label: "Total daily energy expenditure", value: `${fmt(Math.round(tdee), 6)} kcal/day`, primary: true }, { label: "BMR (Mifflin–St Jeor)", value: `${fmt(Math.round(bmr), 6)} kcal/day` }, { label: "Weekly total", value: `${fmt(Math.round(tdee * 7), 7)} kcal` }],
        formula: "TDEE = BMR × activity multiplier",
      };
    },
  },
  "body-fat": {
    fields: [
      select("units", "Units", "metric", [["metric", "Centimeters"], ["us", "Inches"]]),
      SEX,
      field("height", "Height", "178", { step: "0.1" }),
      field("neck", "Neck circumference", "38", { step: "0.1", hint: "Below the larynx." }),
      field("waist", "Waist circumference", "86", { step: "0.1", hint: "Men: at the navel. Women: at the narrowest point." }),
      field("hip", "Hip circumference (women only)", "96", { step: "0.1", hint: "At the widest point." }),
    ],
    note: `${HEALTH_NOTE} The US Navy tape-measure method is an approximation.`,
    compute(v) {
      const k = v.units === "us" ? INCH : 1;
      const [height, neck, waist, hip] = ["height", "neck", "waist", "hip"].map(id => num(v[id], `the ${id} measurement`, { above: 0 }) * k);
      if (height < 50 || height > 275) throw new Error("Check the height and the units.");
      const fat = navyBodyFat(v.sex, height, neck, waist, hip);
      if (fat <= 0 || fat >= 75) throw new Error("These measurements give an out-of-range result. Check them and the units.");
      return { results: [{ label: "Body fat (US Navy method)", value: `${fmt(fat, 3)}%`, primary: true }], formula: v.sex === "female" ? "495 ÷ (1.29579 − 0.35004·log(waist + hip − neck) + 0.221·log(height)) − 450" : "495 ÷ (1.0324 − 0.19077·log(waist − neck) + 0.15456·log(height)) − 450" };
    },
  },
  hydration: {
    fields: [select("units", "Units", "metric", [["metric", "Kilograms"], ["us", "Pounds"]]), field("weight", "Body weight", "70", { step: "0.1" })],
    note: `${HEALTH_NOTE} This is a rough guideline (30–35 mL of water per kg of body weight per day). Needs change with heat, exercise, pregnancy and health conditions, and food also provides water.`,
    compute(v) {
      const kg = weightKg(v);
      const [low, high] = [kg * 30, kg * 35];
      const floz = (ml: number) => ml / 29.5735295625;
      return {
        results: [{ label: "Rough daily water range", value: `${fmt(low / 1000, 3)}–${fmt(high / 1000, 3)} L`, primary: true }, { label: "In US fluid ounces", value: `${fmt(floz(low), 3)}–${fmt(floz(high), 3)} fl oz` }, { label: "In 8 oz cups", value: `${fmt(floz(low) / 8, 2)}–${fmt(floz(high) / 8, 2)}` }],
        formula: "water ≈ 30 to 35 mL × body weight (kg)",
      };
    },
  },
  "ideal-weight": {
    fields: [SYSTEM, SEX, ...HEIGHT],
    note: `${HEALTH_NOTE} These formulas were designed for adults about 5 ft (152 cm) or taller and give different answers; none is a target for everyone.`,
    compute(v) {
      const inchesOver = heightCm(v) / INCH - 60;
      const female = v.sex === "female";
      const formulas: Array<[string, number, number]> = [["Devine (1974)", female ? 45.5 : 50, 2.3], ["Robinson (1983)", female ? 49 : 52, female ? 1.7 : 1.9], ["Miller (1983)", female ? 53.1 : 56.2, female ? 1.36 : 1.41], ["Hamwi (1964)", female ? 45.5 : 48, female ? 2.2 : 2.7]];
      const results = formulas.map(([name, base, perInch]) => ({ label: name, value: both(base + perInch * inchesOver) }));
      return { results: [{ ...results[0], primary: true }, ...results.slice(1)], formula: "weight = base + kg per inch over 5 ft (base and slope depend on the formula)" };
    },
  },
};
