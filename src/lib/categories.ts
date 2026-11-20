export const categories = {
  finance: "Tax, Salary & Banking Calculators",
  "real-estate": "Real Estate & Mortgage Estimators",
  insurance: "Insurance & Loan Savings",
  business: "B2B SaaS, E-Commerce & Business ROI",
  marketing: "Advertising & Marketing ROI",
  legal: "Legal, Compliance & Privacy Generators",
  pdf: "PDF & Document Suite",
  image: "Image, Graphics & CSS Design",
  media: "Video, Audio & Media",
  dev: "Developer, Code & Data Transform",
  crypto: "Crypto, Encoding & Network",
  youtube: "YouTube Automation & Creator",
  text: "SEO, Writing & Text Utilities",
  calculator: "Finance, Math & Unit Calculators",
  data: "Spreadsheet, CSV & In-Browser SQL",
} as const;

export type ToolCategory = keyof typeof categories;
export type Tier1Category =
  | "finance"
  | "real-estate"
  | "insurance"
  | "business"
  | "marketing"
  | "legal"
  | "pdf"
  | "image"
  | "dev";
