"use client";

import React, { useState } from "react";
import { Download, Copy, Check } from "lucide-react";

interface PolicyOptions {
  companyName: string;
  websiteUrl: string;
  contactEmail: string;
  effectiveDate: string;
  collectsAnalytics: boolean;
  collectsPayments: boolean;
  displaysAds: boolean;
  enableGdpr: boolean;
  enableCcpa: boolean;
}

export default function PrivacyPolicyGenerator() {
  const [options, setOptions] = useState<PolicyOptions>({
    companyName: "Acme Digital LLC",
    websiteUrl: "https://example.com",
    contactEmail: "privacy@example.com",
    effectiveDate: new Date().toISOString().split("T")[0],
    collectsAnalytics: true,
    collectsPayments: true,
    displaysAds: true,
    enableGdpr: true,
    enableCcpa: true,
  });

  const [activeTab, setActiveTab] = useState<"markdown" | "html">("markdown");
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    return `# Privacy Policy for ${options.companyName}

**Effective Date:** ${options.effectiveDate}  
**Website:** [${options.websiteUrl}](${options.websiteUrl})

At **${options.companyName}**, accessible from ${options.websiteUrl}, the privacy of our visitors is of paramount importance to us. This Privacy Policy document outlines the types of personal information that is collected and recorded by ${options.companyName} and how we use it.

---

## 1. Information We Collect
We collect information that you directly provide to us, including:
- Contact details such as your name and email address when you reach out or subscribe.
${options.collectsPayments ? "- Billing details and payment transaction records processed securely via third-party processors." : ""}
- Server log files, browser type, referring/exit pages, date/time stamps, and approximate geographic location.

---

## 2. Cookies and Tracking Technologies
We use cookies to store information about visitors' preferences and optimize user experience:
${options.collectsAnalytics ? "- **Analytics Cookies:** We use aggregated web analytics (e.g. Google Analytics) to understand website traffic patterns and improve performance." : ""}
${options.displaysAds ? "- **Advertising Partners:** Third-party vendors, including Google, use cookies to serve ads based on prior visits to our website." : ""}
You can choose to disable cookies through your individual browser options.

---

## 3. How We Use Your Information
We use the collected information for the following purposes:
- Operating and maintaining our website and online services.
- Providing customer support and responding to inquiries.
- Detecting, preventing, and addressing technical defects or fraudulent activity.
- Complying with legal obligations.

---

${options.enableGdpr ? `## 4. General Data Protection Regulation (GDPR) Rights
If you are a resident of the European Economic Area (EEA) or the United Kingdom, you have certain data protection rights:
- **Right of Access:** You may request copies of your personal data.
- **Right to Rectification:** You may request correction of inaccurate or incomplete data.
- **Right to Erasure ("Right to be Forgotten"):** You have the right to request deletion of your personal data under certain conditions.
- **Right to Restrict Processing:** You may request restrictions on how we process your personal data.
- **Right to Data Portability:** You may request transfer of your data to another organization.
To exercise any of these rights, please contact us at **${options.contactEmail}**.

---
` : ""}

${options.enableCcpa ? `## 5. California Consumer Privacy Act (CCPA / CPRA)
If you are a resident of California, you are entitled to the following rights:
- **Right to Know:** The categories and specific pieces of personal data collected over the past 12 months.
- **Right to Delete:** The right to request deletion of your personal information.
- **Right to Opt-Out of Sale or Sharing:** We do not sell or share your personal data for monetary consideration.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising your privacy rights.
Requests can be submitted directly to **${options.contactEmail}**.

---
` : ""}

## 6. Contact Information
If you have any questions or require more information about our Privacy Policy, please contact our privacy compliance team:
- **Email:** ${options.contactEmail}
- **Website:** ${options.websiteUrl}
`;
  };

  const generateHtml = () => {
    const md = generateMarkdown();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Policy - ${options.companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; }
    h1, h2 { color: #111; }
    hr { border: 0; border-top: 1px solid #ddd; margin: 30px 0; }
  </style>
</head>
<body>
${md
  .replace(/^# (.*$)/gim, "<h1>$1</h1>")
  .replace(/^## (.*$)/gim, "<h2>$1</h2>")
  .replace(/^\*\*([^*]+)\*\*/gim, "<strong>$1</strong>")
  .replace(/\n\n/g, "</p><p>")
  .replace(/^---/gim, "<hr>")}
</body>
</html>`;
  };

  const outputText = activeTab === "markdown" ? generateMarkdown() : generateHtml();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: activeTab === "markdown" ? "text/markdown" : "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privacy-policy.${activeTab === "markdown" ? "md" : "html"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-panel">
      <h3 className="text-lg font-semibold mb-4">GDPR & CCPA Privacy Policy Generator</h3>

      <div className="form-grid mb-4">
        <label className="field">
          Company or Website Entity Name
          <input
            type="text"
            value={options.companyName}
            onChange={e => setOptions({ ...options, companyName: e.target.value })}
          />
        </label>
        <label className="field">
          Full Website URL
          <input
            type="url"
            value={options.websiteUrl}
            onChange={e => setOptions({ ...options, websiteUrl: e.target.value })}
          />
        </label>
        <label className="field">
          Public Privacy Contact Email
          <input
            type="email"
            value={options.contactEmail}
            onChange={e => setOptions({ ...options, contactEmail: e.target.value })}
          />
        </label>
        <label className="field">
          Effective Date
          <input
            type="date"
            value={options.effectiveDate}
            onChange={e => setOptions({ ...options, effectiveDate: e.target.value })}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-3 bg-gray-50 dark:bg-slate-800 rounded border dark:border-slate-700 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.enableGdpr}
            onChange={e => setOptions({ ...options, enableGdpr: e.target.checked })}
          />
          Include EU/UK GDPR Clauses
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.enableCcpa}
            onChange={e => setOptions({ ...options, enableCcpa: e.target.checked })}
          />
          Include California CCPA / CPRA
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.collectsAnalytics}
            onChange={e => setOptions({ ...options, collectsAnalytics: e.target.checked })}
          />
          Google Analytics / Telemetry
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.displaysAds}
            onChange={e => setOptions({ ...options, displaysAds: e.target.checked })}
          />
          Third-Party Advertising / Cookies
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={options.collectsPayments}
            onChange={e => setOptions({ ...options, collectsPayments: e.target.checked })}
          />
          Payment Processing (Stripe/PayPal)
        </label>
      </div>

      <div className="flex items-center justify-between my-3 flex-wrap gap-2">
        <div className="segment-control" aria-label="Output format">
          <button
            aria-pressed={activeTab === "markdown"}
            onClick={() => setActiveTab("markdown")}
          >
            Markdown (.md)
          </button>
          <button
            aria-pressed={activeTab === "html"}
            onClick={() => setActiveTab("html")}
          >
            HTML (.html)
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
            type="button"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Policy"}
          </button>
          <button
            onClick={handleDownload}
            className="button text-xs flex items-center gap-1.5 py-1 px-3"
            type="button"
          >
            <Download size={14} /> Download File
          </button>
        </div>
      </div>

      <textarea
        className="w-full h-80 font-mono text-xs p-3 rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
        value={outputText}
        readOnly
      />

      <p className="hint text-xs opacity-75 mt-3">
        Exports standard compliance disclosures for GDPR, CCPA, cookies, and analytics. All text generated locally in browser; zero data stored.
      </p>
    </div>
  );
}
