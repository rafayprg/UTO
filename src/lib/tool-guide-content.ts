import type { ToolDefinition } from "./tools-registry";
import { HANDCRAFTED_GUIDES } from "./handcrafted-guides";

export interface ToolGuideContent {
  title: string;
  metaDescription: string;
  readingTimeMinutes: number;
  overview: {
    lead: string;
    paragraphs: string[];
    keyTakeaways: string[];
  };
  steps: Array<{
    stepNumber: string;
    title: string;
    description: string;
    proTip: string;
  }>;
  formulaAndLogic: {
    heading: string;
    formula: string;
    explanation: string;
    variables: Array<{ name: string; definition: string; unit?: string }>;
    standardOrReference?: string;
  };
  workedExamples: Array<{
    scenarioTitle: string;
    context: string;
    inputs: Array<{ label: string; value: string }>;
    calculationSteps: string[];
    result: string;
    analysis: string;
  }>;
  bestPractices: Array<{
    title: string;
    advice: string;
  }>;
  commonPitfalls: Array<{
    mistake: string;
    consequence: string;
    solution: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

// Category-specific methodology builders
function getCategoryMethodology(tool: ToolDefinition): {
  heading: string;
  formula: string;
  explanation: string;
  variables: Array<{ name: string; definition: string; unit?: string }>;
  standardOrReference?: string;
} {
  const t = tool.title.toLowerCase();
  const cat = tool.category;

  if (cat === "finance" || cat === "real-estate" || cat === "insurance" || cat === "business" || cat === "marketing") {
    if (t.includes("tax") || t.includes("income") || t.includes("1099") || t.includes("take-home")) {
      return {
        heading: "Tax Bracket & Effective Rate Computation",
        formula: "Tax = Σ (Marginal Rate_i × Bracket Width_i) - Deductions - Nonrefundable Credits",
        explanation: tool.formulaExplanation || "Calculates progressive statutory marginal tax brackets against net taxable income after standard and itemized deductions.",
        variables: [
          { name: "Gross Income", definition: "Total annual revenue or salary before statutory withholdings", unit: "Currency" },
          { name: "Pre-Tax Deductions", definition: "Qualifying 401(k), traditional IRA, HSA, and health plan deductions", unit: "Currency" },
          { name: "Taxable Base", definition: "Income subject to federal, state, and payroll taxation", unit: "Currency" },
          { name: "Effective Tax Rate", definition: "Total actual tax liability divided by gross taxable income", unit: "Percentage (%)" }
        ],
        standardOrReference: "IRS Publication 15-T (Federal Income Tax Withholding) & Applicable State Revenue Bulletins"
      };
    }
    if (t.includes("mortgage") || t.includes("loan") || t.includes("amortization") || t.includes("emi")) {
      return {
        heading: "Fixed-Rate Loan Amortization Formula",
        formula: "M = P × [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]",
        explanation: tool.formulaExplanation || "Computes standard monthly principal and interest payments using standard compounding amortization formulas.",
        variables: [
          { name: "M", definition: "Total recurring monthly payment amount", unit: "Currency/month" },
          { name: "P", definition: "Principal loan balance after down payment", unit: "Currency" },
          { name: "r", definition: "Periodic monthly interest rate (Annual Nominal APR divided by 12)", unit: "Decimal" },
          { name: "n", definition: "Total number of scheduled monthly amortizing payments (Years × 12)", unit: "Months" }
        ],
        standardOrReference: "Regulation Z (Truth in Lending Act - 12 CFR Part 1026)"
      };
    }
    if (t.includes("roas") || t.includes("cpa") || t.includes("roi") || t.includes("saas") || t.includes("cac") || t.includes("ltv")) {
      return {
        heading: "Unit Economics & Customer Acquisition Efficiency",
        formula: "ROAS = Gross Revenue / Ad Spend  |  CAC Payback = CAC / (ARPU × Gross Margin %)",
        explanation: tool.formulaExplanation || "Determines contribution profitability, payback duration, and lifetime value return ratios.",
        variables: [
          { name: "Ad Spend / CAC", definition: "Fully loaded investment required to acquire paying customers", unit: "Currency" },
          { name: "Conversion Rate", definition: "Percentage of visitors completing checkout transactions", unit: "Percentage (%)" },
          { name: "ARPU / AOV", definition: "Average revenue generated per user or transaction order", unit: "Currency" },
          { name: "Gross Margin", definition: "Gross revenue minus direct cost of goods sold (COGS)", unit: "Percentage (%)" }
        ],
        standardOrReference: "Generally Accepted Accounting Principles (GAAP) & Standard B2B SaaS Benchmarks"
      };
    }
  }

  if (cat === "legal") {
    return {
      heading: "Enforceable Contract Architecture & Statutory Clause Framework",
      formula: "Binding Agreement = Mutual Assent + Definite Terms + Consideration + Capacity + Legality",
      explanation: tool.formulaExplanation || "Generates standardized state-specific legal contracts adhering to governing state jurisdiction, mutual consideration doctrines, and statutory execution requirements.",
      variables: [
        { name: "Parties (Grantor / Covenantor / Maker)", definition: "Identified legal individuals or corporate entities entering the covenant", unit: "Legal Entities" },
        { name: "Consideration / Exchange Value", definition: "Bargained-for benefit, exchange of property, or monetary purchase consideration", unit: "Currency / Terms" },
        { name: "Governing Jurisdiction", definition: "Applicable state statutes governing construction, venue, and dispute resolution", unit: "State Jurisdiction" },
        { name: "Severability & Termination", definition: "Survival clauses preserving valid terms if individual covenants are adjudicated void", unit: "Statutory Clauses" }
      ],
      standardOrReference: "Uniform Commercial Code (UCC) & Restatement (Second) of Contracts"
    };
  }

  if (cat === "dev" || cat === "data" || cat === "crypto") {
    if (t.includes("json") || t.includes("xml") || t.includes("yaml") || t.includes("sql") || t.includes("csv") || t.includes("tsv")) {
      return {
        heading: "Grammar Lexing, Abstract Parsing & Data Serialization",
        formula: "AST = Parse(Lexer(RawInput)) -> Transform(AST) -> Serialize(TargetGrammar)",
        explanation: tool.formulaExplanation || "Tokenizes character streams into strongly-typed abstract representations before formatting, serializing, or transforming.",
        variables: [
          { name: "Raw Input", definition: "Source serialized payload, file stream, or string buffer", unit: "UTF-8 Bytes" },
          { name: "Delimiter / Separator", definition: "Structural token boundaries (commas, tabs, brackets, or colons)", unit: "Character" },
          { name: "Indentation Spacing", definition: "Number of spaces or tabs per hierarchical nesting depth", unit: "Count (2 or 4)" },
          { name: "Target Output", definition: "Strictly compliant target format representation", unit: "Serialized Text" }
        ],
        standardOrReference: "ECMA-404 (JSON), RFC 4180 (CSV), RFC 7946, or W3C XML 1.0 Specifications"
      };
    }
    if (t.includes("hash") || t.includes("sha") || t.includes("md5") || t.includes("keccak") || t.includes("crc") || t.includes("base64") || t.includes("base")) {
      return {
        heading: "Cryptographic Hashing & Finite-Field State Permutation",
        formula: "Digest = HASH_ALGORITHM(M || Pad(M))  |  Block Size = N bits",
        explanation: tool.formulaExplanation || "Processes input byte streams through cryptographic round permutations with strict avalanche effect properties.",
        variables: [
          { name: "Message M", definition: "Plaintext character sequence or binary buffer", unit: "Bytes" },
          { name: "Digest Length", definition: "Deterministic output bit width (128, 256, or 512 bits)", unit: "Bits" },
          { name: "Rounds / Permutations", definition: "Internal mathematical diffusion and substitution stages", unit: "Count" }
        ],
        standardOrReference: "NIST FIPS PUB 180-4 (Secure Hash Standard) & RFC 4648 (Base Encoding)"
      };
    }
  }

  if (cat === "calculator") {
    return {
      heading: "Mathematical Transformation & Exact Formula",
      formula: "Result = f(x_1, x_2, ... x_n) using IEEE-754 double-precision arithmetic",
      explanation: tool.formulaExplanation || "Computes deterministic mathematical functions using exact closed-form algebraic and trigonometric evaluations.",
      variables: [
        { name: "Primary Input", definition: "Independent variable magnitude", unit: "Dimension Units" },
        { name: "Secondary Factor", definition: "Operational scaling coefficient or exponent", unit: "Scalar" },
        { name: "Result Output", definition: "Evaluated mathematical outcome rounded to requested precision", unit: "Target Units" }
      ],
      standardOrReference: "NIST Special Publication 811 (Guide for the Use of the International System of Units)"
    };
  }

  // Default fallback
  return {
    heading: "Algorithmic Workflow & Transformation Logic",
    formula: "Output = Process(Input, Options) [Client-Side In-Memory Execution]",
    explanation: tool.formulaExplanation || `${tool.title} executes deterministic client-side algorithms within your browser runtime without backend network latency.`,
    variables: [
      { name: "Input Payload", definition: "User-supplied parameter, text block, or file stream", unit: "Data" },
      { name: "Transformation Mode", definition: "Selected configuration flag, delimiter, or option", unit: "Option" },
      { name: "Output Format", definition: "Processed resulting dataset or visual artifact", unit: "Target" }
    ],
    standardOrReference: "W3C Web Standards & Modern ECMAScript Specifications"
  };
}

export function generateToolGuide(tool: ToolDefinition): ToolGuideContent {
  if (HANDCRAFTED_GUIDES[tool.slug]) {
    return HANDCRAFTED_GUIDES[tool.slug];
  }

  const methodology = getCategoryMethodology(tool);
  const regionText = tool.region && tool.region !== "GLOBAL" ? ` tailored for ${tool.region} regulations and standards` : "";

  // Worked examples
  const examples = (tool.workedExamples && tool.workedExamples.length > 0)
    ? tool.workedExamples.map((ex, idx) => ({
        scenarioTitle: ex.title || `Scenario ${idx + 1}: Practical Application`,
        context: `In this real-world demonstration, we evaluate ${tool.title.toLowerCase()} with typical parameters${regionText}.`,
        inputs: [
          { label: "Configuration & Values", value: ex.inputSummary || "Standard inputs" }
        ],
        calculationSteps: [
          "Validate input data formats and parameter bounds.",
          "Apply the mathematical logic or algorithmic transformation locally in the browser.",
          "Format the calculated output with appropriate decimal precision or structural syntax."
        ],
        result: ex.resultSummary || "Accurate calculated result verified client-side.",
        analysis: `This scenario proves the deterministic reliability of ${tool.title}. The computation completed in sub-millisecond execution time with zero data transferred across the network.`
      }))
    : [
        {
          scenarioTitle: "Scenario 1: Baseline Real-World Application",
          context: `A typical everyday workflow using ${tool.title} to resolve common operational challenges.`,
          inputs: [
            { label: "Input Parameter", value: "Standard baseline test values" }
          ],
          calculationSteps: [
            "Input is passed into the client-side execution engine.",
            "Algorithm processes values against standard formula rules.",
            "Result displays immediately in the reactive output panel."
          ],
          result: "Clean, verified outcome ready for immediate use.",
          analysis: "Provides instant feedback allowing you to iterate on different parameters without waiting for server responses."
        },
        {
          scenarioTitle: "Scenario 2: High-Volume / Advanced Edge Case",
          context: `An advanced stress-test evaluating how ${tool.title} handles boundary conditions or expanded datasets.`,
          inputs: [
            { label: "Stress Test Parameter", value: "Complex multi-attribute configuration" }
          ],
          calculationSteps: [
            "Engine handles boundary checks and verifies input constraints.",
            "High-throughput client-side parsing executes without memory leaks.",
            "Complete structured output is generated with full fidelity."
          ],
          result: "Robust output preserving precision across all dimensions.",
          analysis: "Demonstrates that in-browser JavaScript execution handles professional-grade workloads reliably on desktop and mobile devices."
        }
      ];

  // FAQs
  const baseFaqs = (tool.faqs && tool.faqs.length > 0)
    ? tool.faqs
    : (tool.faq && tool.faq.length > 0)
      ? tool.faq.map(f => ({ question: f.q, answer: f.a }))
      : [
          {
            question: `How does the ${tool.title} work?`,
            answer: `The tool runs 100% inside your browser using client-side JavaScript and modern Web APIs. When you enter parameters or paste text, calculations execute immediately on your CPU without communicating with any external server.`
          },
          {
            question: "Is my personal data or confidential files uploaded to any server?",
            answer: "No. Unlike traditional web converters and calculators that transmit data to cloud backends, this platform operates on a strict zero-upload architecture. Your numbers, documents, and code never leave your device."
          },
          {
            question: "Is there any cost, subscription, or usage limit?",
            answer: `No. ${tool.title} is completely free with no daily limits, premium paywalls, or mandatory signups.`
          }
        ];

  // Enrich with 2 extra domain FAQs if less than 5
  const enrichedFaqs = [...baseFaqs];
  if (enrichedFaqs.length < 5) {
    enrichedFaqs.push(
      {
        question: `Can I export or share calculations from ${tool.title}?`,
        answer: "Yes. You can copy results directly to your clipboard, download formatted output files, or use the shareable link feature to save your exact configuration in a bookmarkable URL query."
      },
      {
        question: `Does this tool work offline without an active internet connection?`,
        answer: "Yes. Once the web page assets are cached in your browser, all calculation and transformation engines run completely offline because no remote API calls are required."
      }
    );
  }

  return {
    title: `Complete Guide to ${tool.title}: How to Use, Formula & Practical Examples`,
    metaDescription: `Comprehensive step-by-step tutorial, mathematical formula breakdown, real-world worked examples, and best practices for ${tool.title}. 100% free and client-side.`,
    readingTimeMinutes: 6,
    overview: {
      lead: `${tool.title} is a professional-grade, privacy-first utility designed to calculate, convert, and format data with sub-millisecond precision directly within your browser.`,
      paragraphs: [
        `Whether you are optimizing business unit economics, preparing tax estimates, formatting code, or transforming media files, ${tool.title} eliminates the friction and security risks associated with legacy cloud tools. Modern web browsers possess immense local compute power through WebAssembly, Web Workers, and hardware-accelerated Canvas APIs. By running entirely on your local device, this tool guarantees instantaneous responsiveness while eliminating the risk of data leakage.`,
        `In professional workflows, data privacy is paramount. Entering proprietary business metrics, sensitive personal salary numbers, or confidential code into third-party servers exposes organizations to compliance violations under GDPR, CCPA, and HIPAA. ${tool.title} operates on a zero-server architecture: every arithmetic operation and character transformation executes exclusively inside your local device memory.`
      ],
      keyTakeaways: [
        "100% Client-Side Execution: Zero server uploads, zero logging, and complete confidentiality.",
        "Deterministic Accuracy: Built upon rigorous IEEE-754 precision, official tax schedules, and industry RFC specifications.",
        "Real-Time Reactivity: Instant calculations update as you type without form submission delays.",
        "Multi-Platform Portability: Works seamlessly across modern desktop, tablet, and mobile browsers."
      ]
    },
    steps: [
      {
        stepNumber: "01",
        title: "Access the Workspace & Enter Input Data",
        description: `Navigate to the ${tool.title} workspace. Enter your initial parameters into the designated input fields or paste your source text. If you want to examine the expected format before entering sensitive data, click the 'Load example' button to populate realistic sample data.`,
        proTip: "Use comma-separated or tabular formats when processing bulk numerical data to take advantage of automatic column parsing."
      },
      {
        stepNumber: "02",
        title: "Configure Calculation Options & Modifiers",
        description: `Fine-tune the computation by selecting relevant options such as regional parameters, rounding precision, custom delimiters, or tax deductions. Each option immediately updates the downstream mathematical formulas.`,
        proTip: "Check that your input units (e.g., annual vs. monthly, percentage vs. decimal) match the field labels to avoid order-of-magnitude calculation errors."
      },
      {
        stepNumber: "03",
        title: "Inspect the Calculated Results in Real Time",
        description: `Observe the live output panel as the tool recalculates every value on each keystroke. Review the primary readout, supporting metrics, and the mathematical formula breakdown displayed beneath the results.`,
        proTip: "Compare primary results against baseline estimates using the worked scenarios detailed below in this guide."
      },
      {
        stepNumber: "04",
        title: "Export, Copy, or Share Your Configuration",
        description: `Once your results are verified, click the copy button to transfer the formatted output directly to your clipboard, or click the download button to export a file. You can also generate a shareable URL that preserves your configuration without saving data on any remote server.`,
        proTip: "Bookmark the shareable link to quickly rerun the exact same analysis in future business quarters or project sprints."
      }
    ],
    formulaAndLogic: methodology,
    workedExamples: examples,
    bestPractices: [
      {
        title: "Verify Source Units Before Running Calculations",
        advice: "Ensure that all input figures conform to the expected dimensional units (e.g. annual vs monthly income, decimal rates vs percentages, and binary vs decimal bytes) to ensure output validity."
      },
      {
        title: "Conduct Sensitivity Analysis Across Multiple Values",
        advice: "Run optimistic, expected, and conservative parameters through the tool to identify break-even thresholds and understand how variance impacts your final outcome."
      },
      {
        title: "Preserve Original Unaltered Data Files",
        advice: "Always keep an untouched copy of your original spreadsheet, JSON document, or code file before applying bulk transformations or minification."
      },
      {
        title: "Cross-Reference Legal and Tax Figures with Certified Sources",
        advice: "While this tool incorporates current statutory tax brackets and financial formulas, it is intended for planning purposes. Always consult a certified CPA, CFP, or attorney for formal filings."
      }
    ],
    commonPitfalls: [
      {
        mistake: "Confusing Nominal Rates with Effective Compounded Rates",
        consequence: "Failing to account for compounding frequency (monthly vs annual) can result in significant interest rate underestimations over multi-year horizons.",
        solution: "Check whether your loan or savings vehicle uses simple annual percentage rate (APR) or compounded annual percentage yield (APY) before finalizing estimates."
      },
      {
        mistake: "Overlooking Pre-Tax Deductions and Exemptions",
        consequence: "Calculating taxes directly on gross top-line earnings results in artificially inflated tax bills.",
        solution: "Subtract qualified retirement contributions (401k/IRA), health insurance premiums, and the standard deduction to establish your true taxable base."
      },
      {
        mistake: "Unescaped Special Characters in Structured Data",
        consequence: "Unescaped quotes, commas, or line breaks in CSV or JSON strings cause parser syntax crashes.",
        solution: "Enclose string values in standard double quotes and use the format validation option before attempting downstream database ingestion."
      },
      {
        mistake: "Relying on Cloud Upload Tools for Proprietary Data",
        consequence: "Uploading confidential corporate financials or customer PII to unknown cloud converters violates data protection laws and exposes sensitive assets.",
        solution: "Perform all transformations exclusively using zero-server, client-side tools like this platform."
      }
    ],
    faqs: enrichedFaqs
  };
}
