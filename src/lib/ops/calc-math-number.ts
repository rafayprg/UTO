import type { CalcOp } from "./types";
import { absBig, bigDisplay, bigInt, field, fmt, gcdBig, num, select, textField } from "./calc-math-core.ts";

const MR_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n];
/** Miller–Rabin with the first 13 prime bases is deterministic below this bound. */
const MR_LIMIT = 3317044064679887385961981n;

export function modPow(base: bigint, exponent: bigint, mod: bigint): bigint {
  let result = 1n;
  let b = base % mod;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = result * b % mod;
    b = b * b % mod;
    e >>= 1n;
  }
  return result;
}

export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of MR_BASES) if (n % p === 0n) return n === p;
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) { d >>= 1n; s += 1; }
  return MR_BASES.every(a => {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) return true;
    for (let i = 1; i < s; i += 1) {
      x = x * x % n;
      if (x === n - 1n) return true;
    }
    return false;
  });
}

function rho(n: bigint): bigint {
  if (n % 2n === 0n) return 2n;
  for (let c = 1n; c < 50n; c += 1n) {
    const step = (value: bigint) => (value * value + c) % n;
    const diff = (a: bigint, b: bigint) => (a > b ? a - b : b - a);
    let [x, y, d] = [2n, 2n, 1n];
    let [savedX, savedY] = [x, y];
    while (d === 1n) {
      [savedX, savedY] = [x, y];
      let product = 1n;
      for (let i = 0; i < 64; i += 1) {
        x = step(x);
        y = step(step(y));
        product = product * diff(x, y) % n;
      }
      d = gcdBig(product, n);
    }
    if (d === n) {
      [x, y, d] = [savedX, savedY, 1n];
      while (d === 1n) {
        x = step(x);
        y = step(step(y));
        d = gcdBig(diff(x, y), n);
      }
    }
    if (d !== n) return d;
  }
  throw new Error("Could not factor this number. Try a smaller one.");
}

/** Prime factors in ascending order (with repeats). */
export function factorize(value: bigint): bigint[] {
  const factors: bigint[] = [];
  let n = value;
  for (let p = 2n; p < 10000n && p * p <= n; p += p === 2n ? 1n : 2n) {
    while (n % p === 0n) { factors.push(p); n /= p; }
  }
  const stack = n > 1n ? [n] : [];
  while (stack.length) {
    const next = stack.pop() as bigint;
    if (isPrime(next)) { factors.push(next); continue; }
    const d = rho(next);
    stack.push(d, next / d);
  }
  return factors.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function groupFactors(factors: bigint[]): Array<[bigint, number]> {
  return factors.reduce<Array<[bigint, number]>>((groups, p) => {
    const last = groups[groups.length - 1];
    return last && last[0] === p ? [...groups.slice(0, -1), [p, last[1] + 1]] : [...groups, [p, 1]];
  }, []);
}

export interface Fraction { n: bigint; d: bigint }

export function reduce(n: bigint, d: bigint): Fraction {
  if (d === 0n) throw new Error("A fraction cannot have a denominator of zero.");
  const g = gcdBig(n, d) || 1n;
  const sign = d < 0n ? -1n : 1n;
  return { n: sign * n / g, d: sign * d / g };
}

/** Parses "3/4", "-1 1/2" (mixed), "5" or "0.75". */
export function parseFraction(text: string | undefined, label: string): Fraction {
  const clean = String(text ?? "").trim().replace(/\s+/g, " ");
  const mixed = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(clean);
  if (mixed) {
    const whole = BigInt(mixed[2]);
    const d = BigInt(mixed[4]);
    const value = reduce(whole * d + BigInt(mixed[3]), d);
    return mixed[1] ? { n: -value.n, d: value.d } : value;
  }
  const simple = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(clean);
  if (simple) return reduce(BigInt(simple[1]), BigInt(simple[2]));
  const decimal = /^(-?)(\d*)\.?(\d*)$/.exec(clean);
  if (decimal && (decimal[2] || decimal[3]) && clean.length <= 20) {
    const scale = 10n ** BigInt(decimal[3].length);
    const n = BigInt((decimal[2] || "0") + decimal[3]);
    return reduce(decimal[1] ? -n : n, scale);
  }
  throw new Error(`Enter ${label} as a fraction like 3/4, a mixed number like 1 1/2, or a decimal.`);
}

export function mixedText({ n, d }: Fraction): string {
  if (d === 1n) return n.toString();
  const whole = absBig(n) / d;
  const rest = absBig(n) % d;
  const sign = n < 0n ? "−" : "";
  return whole === 0n ? `${sign}${rest}/${d}` : `${sign}${whole} ${rest}/${d}`;
}

const fractionText = ({ n, d }: Fraction) => (d === 1n ? n.toString() : `${n}/${d}`).replace("-", "−");

function factorialBig(n: number): bigint {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i += 1n) result *= i;
  return result;
}

function fallingFactorial(n: number, r: number): bigint {
  let result = 1n;
  for (let i = 0; i < r; i += 1) result *= BigInt(n - i);
  return result;
}

const chunk = (digits: string, size: number) => Array.from({ length: Math.ceil(digits.length / size) }, (_, i) => [digits.slice(i * size, i * size + size)]);

export const numberOps: Record<string, CalcOp> = {
  "prime-check": {
    fields: [textField("n", "Whole number", "104729", "Up to 24 digits.")],
    compute(v) {
      const n = bigInt(v.n, "the number", 25);
      if (n < 0n) throw new Error("Enter a number that is 0 or greater.");
      if (n >= MR_LIMIT) throw new Error("Numbers up to 3.3 × 10^24 are supported.");
      const prime = isPrime(n);
      let next = n + 1n;
      while (!isPrime(next)) next += 1n;
      let previous = n - 1n;
      while (previous >= 2n && !isPrime(previous)) previous -= 1n;
      const smallest = !prime && n >= 4n ? smallFactor(n) : null;
      return {
        results: [
          { label: bigDisplay(n), value: prime ? "Prime" : n < 2n ? "Neither prime nor composite" : "Composite (not prime)", primary: true },
          { label: "Smallest prime factor", value: prime || n < 2n ? "—" : smallest === null ? "Larger than 100,000" : bigDisplay(smallest) },
          { label: "Next prime", value: bigDisplay(next) },
          { label: "Previous prime", value: previous >= 2n ? bigDisplay(previous) : "None" },
        ],
        formula: "Deterministic Miller–Rabin test with the first 13 prime bases",
      };
    },
  },
  "prime-factorization": {
    fields: [textField("n", "Whole number (2 or more)", "360360", "Up to 20 digits.")],
    compute(v) {
      const n = bigInt(v.n, "the number", 20);
      if (n < 2n) throw new Error("Enter a whole number of 2 or more.");
      const groups = groupFactors(factorize(n));
      const divisors = groups.reduce((total, [, power]) => total * BigInt(power + 1), 1n);
      return {
        results: [
          { label: "Prime factorization", value: groups.map(([p, k]) => (k > 1 ? `${p}^${k}` : String(p))).join(" × "), primary: true },
          { label: "Distinct prime factors", value: groups.map(([p]) => String(p)).join(", ") },
          { label: "Number of divisors", value: bigDisplay(divisors) },
        ],
        table: { head: ["Prime", "Power"], rows: groups.map(([p, k]) => [String(p), String(k)]) },
      };
    },
  },
  gcd: {
    fields: [textField("values", "Whole numbers", "84, 126, 210", "Two or more, separated by commas or spaces.")],
    compute(v) {
      const values = bigList(v.values);
      const result = values.reduce((g, value) => gcdBig(g, value), 0n);
      return { results: [{ label: "Greatest common divisor (GCD)", value: bigDisplay(result), primary: true }, { label: "Numbers", value: values.map(String).join(", ") }], formula: "Euclid's algorithm: gcd(a, b) = gcd(b, a mod b)" };
    },
  },
  lcm: {
    fields: [textField("values", "Whole numbers", "4, 6, 15", "Two or more, separated by commas or spaces.")],
    compute(v) {
      const values = bigList(v.values);
      if (values.some(value => value === 0n)) throw new Error("The LCM is not defined when one of the numbers is 0.");
      const result = values.reduce((l, value) => absBig(l * value) / gcdBig(l, value), 1n);
      return { results: [{ label: "Least common multiple (LCM)", value: bigDisplay(result), primary: true }, { label: "GCD of the same numbers", value: bigDisplay(values.reduce((g, value) => gcdBig(g, value), 0n)) }], formula: "lcm(a, b) = |a × b| ÷ gcd(a, b)" };
    },
  },
  fraction: {
    fields: [
      textField("a", "First fraction", "3/4", "Like 3/4, 1 1/2 or 0.25."),
      select("op", "Operation", "+", [["+", "Add (+)"], ["-", "Subtract (−)"], ["*", "Multiply (×)"], ["/", "Divide (÷)"]]),
      textField("b", "Second fraction", "5/6"),
    ],
    compute(v) {
      const a = parseFraction(v.a, "the first fraction");
      const b = parseFraction(v.b, "the second fraction");
      if (v.op === "/" && b.n === 0n) throw new Error("You cannot divide by zero.");
      const result = v.op === "+" ? reduce(a.n * b.d + b.n * a.d, a.d * b.d)
        : v.op === "-" ? reduce(a.n * b.d - b.n * a.d, a.d * b.d)
        : v.op === "*" ? reduce(a.n * b.n, a.d * b.d)
        : reduce(a.n * b.d, a.d * b.n);
      return {
        results: [
          { label: "Result (simplified)", value: fractionText(result), primary: true },
          { label: "Mixed number", value: mixedText(result) },
          { label: "Decimal", value: fmt(Number(result.n) / Number(result.d)) },
        ],
        formula: "a/b + c/d = (ad + bc) ÷ bd, then divide by the GCD",
      };
    },
  },
  factorial: {
    fields: [field("n", "n (0 to 1000)", "25", { step: "1" })],
    compute(v) {
      const n = num(v.n, "n", { min: 0, max: 1000, integer: true });
      const value = factorialBig(n);
      const digits = value.toString();
      return {
        results: [{ label: `${n}!`, value: bigDisplay(value), primary: true }, { label: "Number of digits", value: digits.length.toLocaleString("en-US") }, { label: "Trailing zeros", value: String(digits.length - digits.replace(/0+$/, "").length) }],
        formula: "n! = 1 × 2 × 3 × … × n (exact integer arithmetic)",
        table: digits.length > 40 ? { head: ["Exact value (in rows of 60 digits)"], rows: chunk(digits, 60) } : undefined,
      };
    },
  },
  "permutation-combination": {
    fields: [field("n", "Total items (n)", "10", { step: "1" }), field("r", "Items chosen (r)", "3", { step: "1" })],
    compute(v) {
      const n = num(v.n, "n", { min: 0, max: 1000, integer: true });
      const r = num(v.r, "r", { min: 0, max: 1000, integer: true });
      if (r > n) throw new Error("r cannot be larger than n (without repetition).");
      const perm = fallingFactorial(n, r);
      const comb = perm / factorialBig(r);
      const multiset = r === 0 ? 1n : n === 0 ? 0n : fallingFactorial(n + r - 1, r) / factorialBig(r);
      return {
        results: [
          { label: "Combinations C(n, r)", value: bigDisplay(comb), primary: true },
          { label: "Permutations P(n, r)", value: bigDisplay(perm) },
          { label: "Permutations with repetition (n^r)", value: bigDisplay(BigInt(n) ** BigInt(r)) },
          { label: "Combinations with repetition", value: bigDisplay(multiset) },
        ],
        formula: "P(n, r) = n! ÷ (n − r)!; C(n, r) = n! ÷ (r! (n − r)!)",
      };
    },
  },
};

function smallFactor(n: bigint): bigint | null {
  for (let p = 2n; p <= 100000n && p * p <= n; p += p === 2n ? 1n : 2n) if (n % p === 0n) return p;
  return null;
}

function bigList(text: string | undefined): bigint[] {
  const parts = String(text ?? "").split(/[\s,;]+/).filter(Boolean);
  if (parts.length < 2) throw new Error("Enter at least two whole numbers.");
  return parts.map(part => bigInt(part, `"${part}"`, 30));
}
