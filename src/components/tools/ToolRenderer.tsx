"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode, type ComponentType } from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import PlannedTool from "./engines/PlannedTool";

type ToolProps = { preset?: ToolDefinition["preset"]; tool: ToolDefinition };

const loading = () => (
  <div className="workspace-skeleton" role="status">
    <div />
    <div />
    <div />
    <p>Opening your browser workspace…</p>
  </div>
);

const components: Record<string, ComponentType<ToolProps>> = {
  // Wave 1 Flagship Tools
  "background-remover": dynamic(() => import("./BackgroundRemover"), { ssr: false, loading }),
  "heic-converter": dynamic(() => import("./HeicConverter"), { ssr: false, loading }),
  "zip-tool": dynamic(() => import("./ZipTool"), { ssr: false, loading }),
  "pdf-merger": dynamic(() => import("./PdfMerger"), { ssr: false, loading }),
  "json-formatter": dynamic(() => import("./JsonFormatter"), { ssr: false, loading }),
  "qr-generator": dynamic(() => import("./QrGenerator"), { ssr: false, loading }),
  "word-counter": dynamic(() => import("./WordCounter"), { ssr: false, loading }),
  "youtube-toolkit": dynamic(() => import("./YoutubeToolkit"), { ssr: false, loading }),
  "percentage-calculator": dynamic(() => import("./PercentageCalculator"), { ssr: false, loading }),
  "unit-converter": dynamic(() => import("./UnitConverter"), { ssr: false, loading }),

  // Tier-1 High-CPC Tools
  "tax-1099-calculator": dynamic(() => import("./Tax1099Calculator"), { ssr: false, loading }),
  "mortgage-calculator": dynamic(() => import("./MortgageCalculator"), { ssr: false, loading }),
  "rent-vs-buy": dynamic(() => import("./RentVsBuyCalculator"), { ssr: false, loading }),
  "life-insurance-calculator": dynamic(() => import("./LifeInsuranceCalculator"), { ssr: false, loading }),
  "stripe-fee-calculator": dynamic(() => import("./StripeFeeCalculator"), { ssr: false, loading }),
  "amazon-fba-calculator": dynamic(() => import("./AmazonFbaCalculator"), { ssr: false, loading }),
  "saas-metrics-calculator": dynamic(() => import("./SaasMetricsCalculator"), { ssr: false, loading }),
  "roas-cpa-calculator": dynamic(() => import("./RoasCpaCalculator"), { ssr: false, loading }),
  "privacy-policy-generator": dynamic(() => import("./PrivacyPolicyGenerator"), { ssr: false, loading }),
  "invoice-pdf-generator": dynamic(() => import("./InvoicePdfGenerator"), { ssr: false, loading }),
  "video-trimmer": dynamic(() => import("./VideoTrimmer"), { ssr: false, loading }),
  "wcag-contrast-checker": dynamic(() => import("./WcagContrastChecker"), { ssr: false, loading }),
  "local-pdf-redactor": dynamic(() => import("./LocalPdfRedactor"), { ssr: false, loading }),

  // Tier-1 Regional & Specialist Calculators
  "uk-take-home-pay": dynamic(() => import("./Tier1Calculators").then(m => m.UkTakeHomePayCalculator), { ssr: false, loading }),
  "canada-gst-hst-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.CanadaTaxCalculator), { ssr: false, loading }),
  "401k-retirement-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.Retirement401kCalculator), { ssr: false, loading }),
  "debt-payoff-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.DebtPayoffCalculator), { ssr: false, loading }),
  "rental-roi-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.RentalRoiCalculator), { ssr: false, loading }),
  "auto-refinance-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.AutoRefinanceCalculator), { ssr: false, loading }),
  "adsense-rpm-calculator": dynamic(() => import("./Tier1Calculators").then(m => m.AdSenseRpmCalculator), { ssr: false, loading }),
  "freelance-nda-generator": dynamic(() => import("./Tier1Calculators").then(m => m.FreelanceNdaGenerator), { ssr: false, loading }),

  // Programmatic Scale Engines
  "state-tax-paycheck-engine": dynamic(() => import("./programmatic/StateTaxPaycheckEngine"), { ssr: false, loading }),
  "platform-fee-engine": dynamic(() => import("./programmatic/PlatformFeeEngine"), { ssr: false, loading }),
  "tier1-country-finance-engine": dynamic(() => import("./programmatic/Tier1CountryFinanceEngine"), { ssr: false, loading }),
  "unit-pair-converter-engine": dynamic(() => import("./programmatic/UnitPairConverterEngine"), { ssr: false, loading }),
  "format-pair-converter-engine": dynamic(() => import("./programmatic/FormatPairConverterEngine"), { ssr: false, loading }),
  "city-tax-paycheck-engine": dynamic(() => import("./programmatic/CityTaxPaycheckEngine"), { ssr: false, loading }),
  "investment-crypto-engine": dynamic(() => import("./programmatic/InvestmentCryptoEngine"), { ssr: false, loading }),
  "growth-ecommerce-engine": dynamic(() => import("./programmatic/GrowthEcommerceEngine"), { ssr: false, loading }),
  "contractor-billing-engine": dynamic(() => import("./programmatic/ContractorBillingEngine"), { ssr: false, loading }),
  "fha-loan-engine": dynamic(() => import("./programmatic/FhaLoanEngine"), { ssr: false, loading }),
  "state-insurance-engine": dynamic(() => import("./programmatic/StateInsuranceEngine"), { ssr: false, loading }),
  "metro-real-estate-engine": dynamic(() => import("./programmatic/MetroRealEstateEngine"), { ssr: false, loading }),
  "state-legal-document-engine": dynamic(() => import("./programmatic/StateLegalDocumentEngine"), { ssr: false, loading }),

  // Shared Engines
  "text-engine": dynamic(() => import("./engines/TextEngine"), { ssr: false, loading }),
  "calc-engine": dynamic(() => import("./engines/CalcEngine"), { ssr: false, loading }),
  "image-engine": dynamic(() => import("./engines/FileEngine").then(mod => mod.ImageEngine), { ssr: false, loading }),
  "pdf-engine": dynamic(() => import("./engines/FileEngine").then(mod => mod.PdfEngine), { ssr: false, loading }),
  "planned-tool": PlannedTool,
};

class ToolBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty" role="alert">
        <h2>The workspace could not load</h2>
        <p>Check your connection for the initial tool download, then reload. Your files have not been uploaded.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

// Engines drawn with a dark Tailwind palette. They are shown inside a wrapper
// that flips the palette to match the light site theme (see app/engines.css).
const DARK_PALETTE_ENGINES = new Set([
  "city-tax-paycheck-engine",
  "investment-crypto-engine",
  "growth-ecommerce-engine",
  "contractor-billing-engine",
  "fha-loan-engine",
  "state-insurance-engine",
  "metro-real-estate-engine",
  "state-legal-document-engine",
]);

export function ToolRenderer({ tool }: { tool: ToolDefinition }) {
  const Tool = components[tool.componentKey] || PlannedTool;
  const workspace = (
    <ToolBoundary key={tool.slug}>
      <Tool preset={tool.preset} tool={tool} />
    </ToolBoundary>
  );
  return DARK_PALETTE_ENGINES.has(tool.componentKey) ? <div className="lt-invert">{workspace}</div> : workspace;
}
