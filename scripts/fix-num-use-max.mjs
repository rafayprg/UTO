import fs from "node:fs";

const files = [
  "src/lib/ops/calc-business.ts",
  "src/lib/ops/calc-global-tax.ts",
  "src/lib/ops/calc-insurance.ts",
  "src/lib/ops/calc-marketing.ts",
  "src/lib/ops/calc-math-advanced.ts",
  "src/lib/ops/calc-physics.ts",
  "src/lib/ops/calc-realestate.ts",
  "src/lib/ops/calc-units-advanced.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  content = content.replace(
    "if (parsed < min || (!allowZero && parsed === 0))",
    "if (parsed < min || parsed > max || (!allowZero && parsed === 0))"
  );
  fs.writeFileSync(file, content, "utf-8");
  console.log("Fixed num usage in", file);
}
