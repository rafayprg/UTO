import type { CalcField } from "./types";

// Unit tables and number helpers for the converters. Self-contained: no runtime imports.
// Factors are exact definitions where one exists (international foot = 0.3048 m, pound = 0.45359237 kg,
// US gallon = 3.785411784 L, standard gravity = 9.80665 m/s², thermochemical calorie = 4.184 J).

export interface Unit { id: string; label: string; symbol: string; factor: number }
export interface Family { name: string; base: string; units: Unit[]; note?: string }

const u = (id: string, label: string, symbol: string, factor: number): Unit => ({ id, label, symbol, factor });

const FOOT = 0.3048;
const POUND = 0.45359237;
const GRAVITY = 9.80665;
const FOOT_POUND_FORCE = FOOT * POUND * GRAVITY;
const BTU_IT = 1055.05585262;

export const FAMILIES: Record<string, Family> = {
  length: { name: "Length", base: "m", units: [u("km", "Kilometers", "km", 1000), u("m", "Meters", "m", 1), u("cm", "Centimeters", "cm", 0.01), u("mm", "Millimeters", "mm", 0.001), u("mi", "Miles", "mi", 1609.344), u("yd", "Yards", "yd", 0.9144), u("ft", "Feet", "ft", FOOT), u("in", "Inches", "in", 0.0254), u("nmi", "Nautical miles", "nmi", 1852)] },
  mass: { name: "Weight", base: "kg", units: [u("t", "Metric tonnes", "t", 1000), u("kg", "Kilograms", "kg", 1), u("g", "Grams", "g", 0.001), u("lb", "Pounds", "lb", POUND), u("oz", "Ounces", "oz", POUND / 16), u("st", "Stones", "st", POUND * 14)] },
  temperature: { name: "Temperature", base: "K", units: [u("C", "Celsius", "°C", 1), u("F", "Fahrenheit", "°F", 1), u("K", "Kelvin", "K", 1)] },
  area: { name: "Area", base: "m²", units: [u("m2", "Square meters", "m²", 1), u("ft2", "Square feet", "ft²", FOOT * FOOT), u("acre", "Acres", "ac", 4046.8564224), u("ha", "Hectares", "ha", 10000), u("km2", "Square kilometers", "km²", 1e6)] },
  volume: { name: "Volume", base: "L", note: "Gallons and fluid ounces are US customary units (not Imperial).", units: [u("L", "Liters", "L", 1), u("mL", "Milliliters", "mL", 0.001), u("usgal", "US gallons", "gal", 3.785411784), u("usfloz", "US fluid ounces", "fl oz", 3.785411784 / 128)] },
  speed: { name: "Speed", base: "m/s", units: [u("kmh", "Kilometers per hour", "km/h", 1 / 3.6), u("mph", "Miles per hour", "mph", 0.44704), u("knot", "Knots", "kn", 1852 / 3600), u("ms", "Meters per second", "m/s", 1)] },
  data: { name: "Data storage", base: "B", note: "KB, MB, GB and TB are decimal (powers of 1,000). KiB, MiB, GiB and TiB are binary (powers of 1,024).", units: [u("KB", "Kilobytes", "KB", 1e3), u("MB", "Megabytes", "MB", 1e6), u("GB", "Gigabytes", "GB", 1e9), u("TB", "Terabytes", "TB", 1e12), u("MiB", "Mebibytes", "MiB", 2 ** 20), u("GiB", "Gibibytes", "GiB", 2 ** 30), u("TiB", "Tebibytes", "TiB", 2 ** 40)] },
  pressure: { name: "Pressure", base: "Pa", note: "mmHg and inHg use the conventional values (1 mmHg = 133.322387415 Pa).", units: [u("Pa", "Pascals", "Pa", 1), u("kPa", "Kilopascals", "kPa", 1000), u("MPa", "Megapascals", "MPa", 1e6), u("bar", "Bar", "bar", 1e5), u("mbar", "Millibar (hPa)", "mbar", 100), u("psi", "Pounds per square inch", "psi", POUND * GRAVITY / 0.0254 ** 2), u("atm", "Standard atmospheres", "atm", 101325), u("mmHg", "Millimeters of mercury", "mmHg", 133.322387415), u("inHg", "Inches of mercury", "inHg", 133.322387415 * 25.4), u("torr", "Torr", "Torr", 101325 / 760)] },
  energy: { name: "Energy", base: "J", note: "Calories are thermochemical (1 cal = 4.184 J); food “Calories” are kilocalories. BTU is the International Table BTU.", units: [u("J", "Joules", "J", 1), u("kJ", "Kilojoules", "kJ", 1000), u("cal", "Calories", "cal", 4.184), u("kcal", "Kilocalories", "kcal", 4184), u("Wh", "Watt-hours", "Wh", 3600), u("kWh", "Kilowatt-hours", "kWh", 3.6e6), u("BTU", "British thermal units", "BTU", BTU_IT), u("ftlbf", "Foot-pounds", "ft·lbf", FOOT_POUND_FORCE), u("eV", "Electronvolts", "eV", 1.602176634e-19)] },
  power: { name: "Power", base: "W", note: "Horsepower (hp) is mechanical horsepower (550 ft·lbf/s); metric horsepower (PS) is 735.49875 W.", units: [u("W", "Watts", "W", 1), u("kW", "Kilowatts", "kW", 1000), u("MW", "Megawatts", "MW", 1e6), u("hp", "Horsepower", "hp", 550 * FOOT_POUND_FORCE), u("PS", "Metric horsepower", "PS", 735.49875), u("BTUh", "BTU per hour", "BTU/h", BTU_IT / 3600), u("ftlbfs", "Foot-pounds per second", "ft·lbf/s", FOOT_POUND_FORCE)] },
  angle: { name: "Angle", base: "°", units: [u("deg", "Degrees", "°", 1), u("rad", "Radians", "rad", 180 / Math.PI), u("grad", "Gradians", "gon", 0.9), u("arcmin", "Arcminutes", "′", 1 / 60), u("arcsec", "Arcseconds", "″", 1 / 3600), u("turn", "Turns", "turn", 360), u("mrad", "Milliradians", "mrad", 0.18 / Math.PI)] },
  rate: { name: "Data transfer rate", base: "bit/s", note: "Network speeds are usually quoted in bits per second (Mbps); file sizes in bytes. 1 byte = 8 bits.", units: [u("bps", "Bits per second", "bit/s", 1), u("kbps", "Kilobits per second", "kbps", 1e3), u("Mbps", "Megabits per second", "Mbps", 1e6), u("Gbps", "Gigabits per second", "Gbps", 1e9), u("kBs", "Kilobytes per second", "kB/s", 8e3), u("MBs", "Megabytes per second", "MB/s", 8e6), u("GBs", "Gigabytes per second", "GB/s", 8e9), u("MiBs", "Mebibytes per second", "MiB/s", 8 * 2 ** 20)] },
};

export function unit(family: string, id: string): Unit {
  const found = FAMILIES[family]?.units.find(item => item.id === id);
  if (!found) throw new Error("Choose units from the list.");
  return found;
}

const toKelvin = (value: number, id: string) => (id === "K" ? value : id === "C" ? value + 273.15 : (value - 32) * 5 / 9 + 273.15);
const fromKelvin = (kelvin: number, id: string) => (id === "K" ? kelvin : id === "C" ? kelvin - 273.15 : (kelvin - 273.15) * 9 / 5 + 32);

export function convert(family: string, value: number, from: string, to: string): number {
  if (family === "temperature") {
    const kelvin = toKelvin(value, from);
    if (kelvin < -1e-9) throw new Error("That temperature is below absolute zero (0 K, −273.15 °C, −459.67 °F).");
    return fromKelvin(Math.max(0, kelvin), to);
  }
  const result = value * unit(family, from).factor / unit(family, to).factor;
  if (!Number.isFinite(result)) throw new Error("That value is too large to convert.");
  return result;
}

export function num(value: string | undefined, label: string, { min = -Infinity } = {}): number {
  const text = String(value ?? "").replace(/[,\s]/g, "");
  const parsed = Number(text);
  if (text === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min) throw new Error(min === 0 ? `Enter ${label} as 0 or more.` : `${label} must be at least ${min}.`);
  return parsed;
}

/** Up to 10 significant digits; scientific notation for very large or tiny values. */
export function fmt(value: number, digits = 10): string {
  if (!Number.isFinite(value)) throw new Error("That result is outside the range a browser can calculate.");
  if (Math.abs(value) < 1e-12) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-6) {
    const [mantissa, exponent] = value.toExponential(digits - 1).split("e");
    return `${String(Number(mantissa))} × 10^${Number(exponent)}`;
  }
  return Number(value.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 20 });
}

/** Shortest exact-looking text for a conversion factor. */
export const factorText = (value: number) => String(Number(value.toPrecision(12)));

export const field = (id: string, label: string, def: string, extra: Partial<CalcField> = {}): CalcField => ({ id, label, type: "number", default: def, step: "any", ...extra });
export const select = (id: string, label: string, def: string, choices: Array<[string, string]>, hint?: string): CalcField => ({ id, label, type: "select", default: def, choices, ...(hint ? { hint } : {}) });
