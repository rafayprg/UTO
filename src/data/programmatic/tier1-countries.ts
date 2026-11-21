export interface CountryTaxData {
  countryCode: "GB" | "CA" | "AU" | "NZ";
  countryName: string;
  currencySymbol: string;
  currencyCode: string;
  vatGstName: string; // VAT / GST / HST
  defaultVatRate: number; // in %
  subRegions?: Array<{
    name: string;
    code: string;
    slug: string;
    vatRate: number; // Combined provincial/state tax
    provincialTaxType?: string;
  }>;
  brackets: Array<{ threshold: number; rate: number; label: string }>;
  socialSecurityName: string; // NI / CPP-EI / Superannuation / ACC
  socialSecurityRate: number; // in %
}

export const TIER1_COUNTRIES: Record<string, CountryTaxData> = {
  uk: {
    countryCode: "GB",
    countryName: "United Kingdom",
    currencySymbol: "£",
    currencyCode: "GBP",
    vatGstName: "VAT",
    defaultVatRate: 20.0,
    brackets: [
      { threshold: 0, rate: 0.0, label: "Personal Allowance" },
      { threshold: 12570, rate: 0.20, label: "Basic Rate" },
      { threshold: 50270, rate: 0.40, label: "Higher Rate" },
      { threshold: 125140, rate: 0.45, label: "Additional Rate" },
    ],
    socialSecurityName: "National Insurance (Class 1)",
    socialSecurityRate: 8.0,
  },
  canada: {
    countryCode: "CA",
    countryName: "Canada",
    currencySymbol: "C$",
    currencyCode: "CAD",
    vatGstName: "GST / HST / PST",
    defaultVatRate: 5.0,
    subRegions: [
      { name: "Ontario", code: "ON", slug: "ontario", vatRate: 13.0, provincialTaxType: "HST" },
      { name: "British Columbia", code: "BC", slug: "british-columbia", vatRate: 12.0, provincialTaxType: "GST + PST" },
      { name: "Alberta", code: "AB", slug: "alberta", vatRate: 5.0, provincialTaxType: "GST only" },
      { name: "Quebec", code: "QC", slug: "quebec", vatRate: 14.975, provincialTaxType: "GST + QST" },
      { name: "Manitoba", code: "MB", slug: "manitoba", vatRate: 12.0, provincialTaxType: "GST + PST" },
      { name: "Saskatchewan", code: "SK", slug: "saskatchewan", vatRate: 11.0, provincialTaxType: "GST + PST" },
      { name: "Nova Scotia", code: "NS", slug: "nova-scotia", vatRate: 15.0, provincialTaxType: "HST" },
      { name: "New Brunswick", code: "NB", slug: "new-brunswick", vatRate: 15.0, provincialTaxType: "HST" },
      { name: "Newfoundland and Labrador", code: "NL", slug: "newfoundland", vatRate: 15.0, provincialTaxType: "HST" },
      { name: "Prince Edward Island", code: "PE", slug: "prince-edward-island", vatRate: 15.0, provincialTaxType: "HST" },
      { name: "Northwest Territories", code: "NT", slug: "northwest-territories", vatRate: 5.0, provincialTaxType: "GST only" },
      { name: "Yukon", code: "YT", slug: "yukon", vatRate: 5.0, provincialTaxType: "GST only" },
      { name: "Nunavut", code: "NU", slug: "nunavut", vatRate: 5.0, provincialTaxType: "GST only" },
    ],
    brackets: [
      { threshold: 0, rate: 0.15, label: "Federal Tier 1" },
      { threshold: 55867, rate: 0.205, label: "Federal Tier 2" },
      { threshold: 111733, rate: 0.26, label: "Federal Tier 3" },
      { threshold: 173205, rate: 0.29, label: "Federal Tier 4" },
      { threshold: 246752, rate: 0.33, label: "Federal Tier 5" },
    ],
    socialSecurityName: "CPP + EI Contributions",
    socialSecurityRate: 7.63,
  },
  australia: {
    countryCode: "AU",
    countryName: "Australia",
    currencySymbol: "A$",
    currencyCode: "AUD",
    vatGstName: "GST",
    defaultVatRate: 10.0,
    subRegions: [
      { name: "New South Wales", code: "NSW", slug: "nsw", vatRate: 10.0 },
      { name: "Victoria", code: "VIC", slug: "victoria", vatRate: 10.0 },
      { name: "Queensland", code: "QLD", slug: "queensland", vatRate: 10.0 },
      { name: "Western Australia", code: "WA", slug: "western-australia", vatRate: 10.0 },
      { name: "South Australia", code: "SA", slug: "south-australia", vatRate: 10.0 },
      { name: "Tasmania", code: "TAS", slug: "tasmania", vatRate: 10.0 },
      { name: "Australian Capital Territory", code: "ACT", slug: "act", vatRate: 10.0 },
      { name: "Northern Territory", code: "NT", slug: "northern-territory", vatRate: 10.0 },
    ],
    brackets: [
      { threshold: 0, rate: 0.0, label: "Tax-Free Threshold" },
      { threshold: 18200, rate: 0.16, label: "Stage 3 Low Bracket" },
      { threshold: 45000, rate: 0.30, label: "Stage 3 Middle Bracket" },
      { threshold: 135000, rate: 0.37, label: "Stage 3 Upper Bracket" },
      { threshold: 190000, rate: 0.45, label: "Top Marginal Rate" },
    ],
    socialSecurityName: "Superannuation Guarantee",
    socialSecurityRate: 11.5,
  },
  newzealand: {
    countryCode: "NZ",
    countryName: "New Zealand",
    currencySymbol: "NZ$",
    currencyCode: "NZD",
    vatGstName: "GST",
    defaultVatRate: 15.0,
    brackets: [
      { threshold: 0, rate: 0.105, label: "Up to $15,600" },
      { threshold: 15600, rate: 0.175, label: "$15,601 – $53,500" },
      { threshold: 53500, rate: 0.30, label: "$53,501 – $78,100" },
      { threshold: 78100, rate: 0.33, label: "$78,101 – $180,000" },
      { threshold: 180000, rate: 0.39, label: "Above $180,000" },
    ],
    socialSecurityName: "ACC Earner's Levy + KiwiSaver",
    socialSecurityRate: 4.6,
  },
};
