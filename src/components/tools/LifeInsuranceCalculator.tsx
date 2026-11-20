"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface DimeState {
  consumerDebt: number; // Credit cards, auto, student loans
  annualIncome: number;
  replacementYears: number;
  mortgageBalance: number;
  collegeFundsPerChild: number;
  numberOfChildren: number;
  existingSavings: number;
  currentLifeInsurance: number;
}

export default function LifeInsuranceCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<DimeState>({
    consumerDebt: 25000,
    annualIncome: 90000,
    replacementYears: 10,
    mortgageBalance: 320000,
    collegeFundsPerChild: 100000,
    numberOfChildren: 2,
    existingSavings: 45000,
    currentLifeInsurance: 50000,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // D - Debt
  const debtTotal = params.consumerDebt;
  // I - Income
  const incomeTotal = params.annualIncome * params.replacementYears;
  // M - Mortgage
  const mortgageTotal = params.mortgageBalance;
  // E - Education
  const educationTotal = params.collegeFundsPerChild * params.numberOfChildren;

  // Gross Needs
  const grossDimeNeeds = debtTotal + incomeTotal + mortgageTotal + educationTotal;

  // Existing assets to offset
  const existingAssets = params.existingSavings + params.currentLifeInsurance;

  // Recommended Term Life Insurance
  const netInsuranceCoverageNeeded = Math.max(0, grossDimeNeeds - existingAssets);

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Life Insurance Coverage Calculator (DIME Method)</h3>
        <button
          onClick={handleCopy}
          className="button secondary text-xs flex items-center gap-1.5 py-1 px-3"
          type="button"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
          {copied ? "Link Copied!" : "Share Link"}
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          <strong>D</strong> - Consumer Debt (Credit cards, auto, personal) ($)
          <input
            type="number"
            min="0"
            step="1000"
            value={params.consumerDebt}
            onChange={e => setParams({ consumerDebt: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <strong>I</strong> - Current Annual Gross Income ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.annualIncome}
            onChange={e => setParams({ annualIncome: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <strong>I</strong> - Years of Income Replacement Needed
          <input
            type="number"
            min="1"
            max="30"
            step="1"
            value={params.replacementYears}
            onChange={e => setParams({ replacementYears: Number(e.target.value) || 10 })}
          />
        </label>
        <label className="field">
          <strong>M</strong> - Remaining Mortgage Payoff Balance ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.mortgageBalance}
            onChange={e => setParams({ mortgageBalance: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <strong>E</strong> - College Fund Target per Child ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.collegeFundsPerChild}
            onChange={e => setParams({ collegeFundsPerChild: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <strong>E</strong> - Number of Dependent Children
          <input
            type="number"
            min="0"
            max="10"
            step="1"
            value={params.numberOfChildren}
            onChange={e => setParams({ numberOfChildren: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Existing Liquid Savings & Investments ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.existingSavings}
            onChange={e => setParams({ existingSavings: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Existing Employer / Group Life Insurance ($)
          <input
            type="number"
            min="0"
            step="5000"
            value={params.currentLifeInsurance}
            onChange={e => setParams({ currentLifeInsurance: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">Recommended Additional Term Life Insurance</p>
        <strong className="big-result text-3xl font-bold my-1 block text-blue-600 dark:text-blue-400">
          {formatUsd(netInsuranceCoverageNeeded)}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Total Family Obligations: {formatUsd(grossDimeNeeds)} minus Current Assets: {formatUsd(existingAssets)}
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Debt Obligations</span>
            <strong>{formatUsd(debtTotal)}</strong>
          </div>
          <div className="stat">
            <span>Income Replacement</span>
            <strong>{formatUsd(incomeTotal)}</strong>
          </div>
          <div className="stat">
            <span>Mortgage Payoff</span>
            <strong>{formatUsd(mortgageTotal)}</strong>
          </div>
          <div className="stat">
            <span>Education Funding</span>
            <strong>{formatUsd(educationTotal)}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        The industry-standard DIME methodology evaluates family obligations across Debt, Income, Mortgage, and Education minus existing assets. Zero insurance quotes or lead sales; runs 100% locally.
      </p>
    </div>
  );
}
