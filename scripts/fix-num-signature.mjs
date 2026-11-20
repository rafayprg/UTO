import fs from "node:fs";

const files = [
  "src/lib/ops/calc-business.ts",
  "src/lib/ops/calc-global-tax.ts",
  "src/lib/ops/calc-insurance.ts",
  "src/lib/ops/calc-marketing.ts",
  "src/lib/ops/calc-math-advanced.ts",
  "src/lib/ops/calc-math-geometry.ts",
  "src/lib/ops/calc-physics.ts",
  "src/lib/ops/calc-realestate.ts",
  "src/lib/ops/calc-units-advanced.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  content = content.replace(
    "function num(value: string, label: string, { min = -Infinity, allowZero = true } = {}): number",
    "function num(value: string, label: string, { min = -Infinity, max = Infinity, allowZero = true } = {}): number"
  );
  fs.writeFileSync(file, content, "utf-8");
  console.log("Updated", file);
}
