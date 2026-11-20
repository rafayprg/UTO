// Generator for Batch 3: High-CPC Finance, Real Estate, Insurance, Business, Marketing, and Geometry calculators
import fs from "node:fs";
import path from "node:path";
import { US_STATE_TAXES } from "../src/data/us-state-taxes.ts";

const root = process.cwd();

// --- 1. FINANCE CATALOG (54 tools) ---
const financeRows = [];
for (const [, state] of Object.entries(US_STATE_TAXES)) {
  const slug = `${state.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-income-tax-calculator`;
  const title = `${state.name} State Income Tax Calculator`;
  const shortDesc = state.type === "none"
    ? `Estimate state income tax in ${state.name} with zero state individual income tax.`
    : state.type === "flat"
    ? `Calculate ${state.name} flat ${(state.rate * 100).toFixed(2)}% state income tax and net take-home pay.`
    : `Calculate progressive ${state.name} state income tax brackets up to ${(state.rate * 100).toFixed(1)}% and net pay.`;
  const keywords = [state.name.toLowerCase(), `${state.name.toLowerCase()} tax`, "state income tax", "take home pay"];
  financeRows.push([slug, title, shortDesc, keywords, slug, "State Income Tax Calculators"]);
}

financeRows.push(
  ["roth-vs-traditional-ira", "Roth vs Traditional IRA Calculator", "Compare upfront tax deductions versus tax-free retirement growth to choose your best IRA.", ["roth ira", "traditional ira", "retirement tax"], "roth-vs-traditional-ira", "Retirement & Investments"],
  ["capital-gains-tax-calculator", "Capital Gains Tax Calculator", "Estimate federal tax on short-term and long-term asset, stock, and crypto capital gains.", ["capital gains tax", "long term capital gains", "crypto tax"], "capital-gains-tax-calculator", "Retirement & Investments"],
  ["cd-interest-calculator", "Certificate of Deposit (CD) Calculator", "Calculate total interest earned and final balance on fixed-rate bank CD deposits.", ["cd calculator", "certificate of deposit", "bank interest"], "cd-interest-calculator", "Retirement & Investments"]
);

// --- 2. REAL ESTATE CATALOG (7 tools) ---
const realEstateRows = [
  ["fha-loan-calculator", "FHA Loan Calculator", "Estimate monthly FHA mortgage payments with 3.5% down payment and upfront/monthly MIP.", ["fha loan", "fha mortgage", "mip insurance"], "fha-loan-calculator", "Government & Specialized Mortgages"],
  ["va-loan-calculator", "VA Loan Calculator", "Calculate VA home loan monthly payments with 0% down payment and zero monthly PMI.", ["va loan", "veterans mortgage", "zero down loan"], "va-loan-calculator", "Government & Specialized Mortgages"],
  ["heloc-payment-calculator", "HELOC Payment Calculator", "Calculate monthly payments during the 10-year draw and 20-year repayment phases.", ["heloc calculator", "home equity line of credit", "equity loan"], "heloc-payment-calculator", "Home Equity & Financing"],
  ["commercial-cap-rate-calculator", "Commercial Real Estate Cap Rate Calculator", "Calculate capitalization rate from Net Operating Income (NOI) and property value.", ["cap rate calculator", "commercial real estate", "noi"], "commercial-cap-rate-calculator", "Investment & Valuation"],
  ["gross-rent-multiplier-calculator", "Gross Rent Multiplier (GRM) Calculator", "Evaluate rental property purchase price relative to gross annual rental income.", ["gross rent multiplier", "grm calculator", "rental property valuation"], "gross-rent-multiplier-calculator", "Investment & Valuation"],
  ["cash-on-cash-return-calculator", "Cash-on-Cash Return Calculator", "Determine annual pre-tax return on total out-of-pocket cash invested in rental properties.", ["cash on cash return", "real estate roi", "rental cash flow"], "cash-on-cash-return-calculator", "Investment & Valuation"],
  ["closing-costs-estimator", "Mortgage Closing Costs Estimator", "Estimate buyer closing costs, lender origination fees, appraisal, and title insurance.", ["closing costs estimator", "home purchase costs", "lender fees"], "closing-costs-estimator", "Home Equity & Financing"]
];

// --- 3. INSURANCE CATALOG (3 tools) ---
const insuranceRows = [
  ["term-life-insurance-calculator", "Term Life Insurance Needs Calculator", "Calculate how much term life insurance coverage your family needs using the DIME method.", ["term life insurance", "life insurance need", "dime method"], "term-life-insurance-calculator", "Life & Family Protection"],
  ["hsa-savings-calculator", "HSA Triple-Tax Advantage Savings Calculator", "Calculate annual tax deductions and retirement investment growth in a Health Savings Account.", ["hsa calculator", "health savings account", "triple tax advantage"], "hsa-savings-calculator", "Health & Disability"],
  ["disability-insurance-needs", "Disability Income Insurance Needs Calculator", "Calculate your monthly income gap and insurance protection needs if disabled from work.", ["disability insurance", "income protection", "long term disability"], "disability-insurance-needs", "Health & Disability"]
];

// --- 4. BUSINESS CATALOG (3 tools) ---
const businessRows = [
  ["s-corp-tax-savings", "S-Corp Tax Savings Calculator", "Calculate self-employment tax saved on shareholder distributions with an S-Corporation election.", ["s corp tax savings", "llc to s corp", "self employment tax"], "s-corp-tax-savings", "Corporate Tax & Structure"],
  ["inventory-turnover-calculator", "Inventory Turnover Ratio Calculator", "Measure how efficiently inventory is sold and calculate Days Sales of Inventory (DSI).", ["inventory turnover", "dsi calculator", "cogs ratio"], "inventory-turnover-calculator", "Operations & Supply Chain"],
  ["working-capital-ratio-calculator", "Working Capital & Current Ratio Calculator", "Evaluate business short-term liquidity by comparing current assets to current liabilities.", ["working capital ratio", "current ratio", "business liquidity"], "working-capital-ratio-calculator", "Corporate Tax & Structure"]
];

// --- 5. MARKETING CATALOG (3 tools) ---
const marketingRows = [
  ["cost-per-click-calculator", "Cost Per Click (CPC) Calculator", "Calculate cost per click from advertising budget and total clicks generated.", ["cpc calculator", "cost per click", "google ads cpc"], "cost-per-click-calculator", "Paid Advertising Metrics"],
  ["cost-per-acquisition-calculator", "Cost Per Acquisition (CPA) Calculator", "Determine the exact marketing spend required to acquire each paying customer.", ["cpa calculator", "cost per acquisition", "ad conversion cost"], "cost-per-acquisition-calculator", "Paid Advertising Metrics"],
  ["email-campaign-roi-calculator", "Email Marketing Campaign ROI Calculator", "Calculate return on investment and net profit for promotional email campaigns.", ["email marketing roi", "campaign roi", "newsletter conversion"], "email-campaign-roi-calculator", "Paid Advertising Metrics"]
];

// --- 6. GEOMETRY ROWS TO APPEND TO CALCULATOR ---
const geometryRows = [
  ["circle-calculator", "Circle Area & Circumference Calculator", "Calculate circle area, circumference, and diameter from radius with step-by-step formulas.", ["circle calculator", "circle area", "circumference"], "circle-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["cylinder-volume-calculator", "Cylinder Volume & Surface Area Calculator", "Find total volume, lateral surface area, and total surface area of a cylinder.", ["cylinder volume", "cylinder surface area", "cylinder calculator"], "cylinder-volume-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["sphere-volume-calculator", "Sphere Volume & Surface Area Calculator", "Calculate the volume and surface area of a sphere from radius.", ["sphere volume", "sphere surface area", "sphere calculator"], "sphere-volume-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["cone-volume-calculator", "Cone Volume & Slant Height Calculator", "Calculate volume, slant height, and surface area of a cone.", ["cone volume", "cone slant height", "cone surface area"], "cone-volume-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["rectangular-prism-calculator", "Rectangular Prism Box Calculator", "Find box volume, total surface area, and 3D space diagonal from dimensions.", ["rectangular prism", "box volume", "surface area of box"], "rectangular-prism-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["pythagorean-theorem-calculator", "Pythagorean Theorem Calculator", "Calculate the hypotenuse, perimeter, and area of right triangles using a² + b² = c².", ["pythagorean theorem", "hypotenuse calculator", "right triangle"], "pythagorean-theorem-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["triangle-heron-calculator", "Triangle Area Calculator (Heron's Formula)", "Calculate triangle area and perimeter from three side lengths without knowing the height.", ["heron formula", "triangle area", "three sides triangle"], "triangle-heron-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["trapezoid-calculator", "Trapezoid Area & Median Calculator", "Find the area and midsegment of a trapezoid from base lengths and height.", ["trapezoid calculator", "trapezoid area", "trapezoid median"], "trapezoid-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["ellipse-calculator", "Ellipse Area & Perimeter Calculator", "Calculate ellipse area and perimeter using Ramanujan's formula from semi-axes.", ["ellipse calculator", "ellipse area", "ellipse perimeter"], "ellipse-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["regular-hexagon-calculator", "Regular Hexagon Area Calculator", "Calculate area, perimeter, and apothem of a regular 6-sided hexagon from side length.", ["hexagon calculator", "hexagon area", "regular hexagon"], "regular-hexagon-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["matrix-2x2-determinant", "2x2 Matrix Determinant Calculator", "Calculate the determinant of a 2x2 matrix and check for matrix invertibility.", ["matrix determinant", "2x2 determinant", "linear algebra"], "matrix-2x2-determinant", "Geometry & Trigonometry", "calc", "calc-math"],
  ["vector-2d-calculator", "2D Vector Magnitude & Direction Calculator", "Calculate vector magnitude, direction angle in degrees, and unit vector components.", ["vector magnitude", "vector calculator", "unit vector"], "vector-2d-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["permutations-combinations-calculator", "Permutations & Combinations (nPr / nCr)", "Calculate factorial permutations (order matters) and combinations (order does not matter).", ["permutations combinations", "ncr calculator", "npr calculator"], "permutations-combinations-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["distance-2d-calculator", "2D Distance & Midpoint Calculator", "Calculate Euclidean distance, midpoint, and slope between two coordinate points.", ["distance formula", "midpoint calculator", "slope between two points"], "distance-2d-calculator", "Geometry & Trigonometry", "calc", "calc-math"],
  ["logarithm-calculator", "Logarithm & Natural Log (ln) Calculator", "Evaluate log base b and natural logarithm ln(x) for any positive real number.", ["logarithm calculator", "natural log", "log base 10"], "logarithm-calculator", "Geometry & Trigonometry", "calc", "calc-math"]
];

function generateCatalogFile(filename, exportName, rows, defaultEngine, defaultModule) {
  let content = `import type { CatalogEntry } from "./types";\n\n`;
  content += `export const ${exportName}: CatalogEntry[] = [\n`;
  for (const r of rows) {
    const slug = r[0];
    const title = r[1];
    const shortDesc = r[2];
    const keywords = JSON.stringify(r[3]);
    const op = r[4];
    const group = r[5];
    const engine = r[6] || defaultEngine;
    const modKey = r[7] || defaultModule;
    content += `  { slug: ${JSON.stringify(slug)}, title: ${JSON.stringify(title)}, shortDesc: ${JSON.stringify(shortDesc)}, keywords: ${keywords}, group: ${JSON.stringify(group)}, engine: ${JSON.stringify(engine)}, module: ${JSON.stringify(modKey)}, op: ${JSON.stringify(op)} },\n`;
  }
  content += `];\n`;
  fs.writeFileSync(path.join(root, "src/lib/catalog", filename), content, "utf-8");
  console.log(`Wrote ${filename} with ${rows.length} entries.`);
}

generateCatalogFile("finance.ts", "financeCatalog", financeRows, "calc", "calc-finance");
generateCatalogFile("real-estate.ts", "realEstateCatalog", realEstateRows, "calc", "calc-finance");
generateCatalogFile("insurance.ts", "insuranceCatalog", insuranceRows, "calc", "calc-finance");
generateCatalogFile("business.ts", "businessCatalog", businessRows, "calc", "calc-finance");
generateCatalogFile("marketing.ts", "marketingCatalog", marketingRows, "calc", "calc-finance");

// Append geometry rows to calculator.ts
const calcPath = path.join(root, "src/lib/catalog/calculator.ts");
let calcContent = fs.readFileSync(calcPath, "utf-8");
let geomSnippet = "\n// Geometry & Higher Math\n";
for (const r of geometryRows) {
  geomSnippet += `calculatorCatalog.push({ slug: ${JSON.stringify(r[0])}, title: ${JSON.stringify(r[1])}, shortDesc: ${JSON.stringify(r[2])}, keywords: ${JSON.stringify(r[3])}, group: ${JSON.stringify(r[5])}, engine: "calc", module: "calc-math", op: ${JSON.stringify(r[4])} });\n`;
}
if (!calcContent.includes("circle-calculator")) {
  calcContent += geomSnippet;
  fs.writeFileSync(calcPath, calcContent, "utf-8");
  console.log("Appended 15 geometry tools to calculator.ts");
}
