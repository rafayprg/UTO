"use client";

import React, { useState } from "react";
import { useUrlToolState } from "@/hooks/useUrlToolState";
import { Share2, Check } from "lucide-react";

interface RentVsBuyState {
  homePrice: number;
  downPaymentPercent: number;
  mortgageRate: number;
  homeAppreciation: number;
  monthlyRent: number;
  rentInflation: number;
  investmentReturn: number;
  yearsToStay: number;
}

export default function RentVsBuyCalculator() {
  const [params, setParams, copyShareableLink] = useUrlToolState<RentVsBuyState>({
    homePrice: 450000,
    downPaymentPercent: 20,
    mortgageRate: 6.75,
    homeAppreciation: 3.5,
    monthlyRent: 2400,
    rentInflation: 3.0,
    investmentReturn: 7.0,
    yearsToStay: 10,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyShareableLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downPayment = params.homePrice * (params.downPaymentPercent / 100);
  const loanAmount = params.homePrice - downPayment;
  const monthlyRate = params.mortgageRate / 100 / 12;
  const totalMonths = 30 * 12;

  const monthlyMortgage =
    loanAmount > 0 && monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanAmount / totalMonths;

  // Comparison over N years
  let rentWealth = downPayment; // Investing the down payment
  let currentHomeValue = params.homePrice;
  let remainingLoan = loanAmount;
  let currentMonthlyRent = params.monthlyRent;
  let breakEvenYear = -1;

  const yearlyComparison: Array<{
    year: number;
    buyNetWealth: number;
    rentNetWealth: number;
    homeValue: number;
    annualRent: number;
  }> = [];

  for (let yr = 1; yr <= 30; yr += 1) {
    // 1. Homeowner: appreciates, principal paid down, pays taxes/maintenance (2.5% of value annually)
    currentHomeValue *= 1 + params.homeAppreciation / 100;
    const annualMaintenanceAndTax = currentHomeValue * 0.025;
    for (let m = 0; m < 12; m += 1) {
      const interest = remainingLoan * monthlyRate;
      const principal = Math.min(remainingLoan, monthlyMortgage - interest);
      remainingLoan = Math.max(0, remainingLoan - principal);
    }
    // Selling costs 6%
    const buyNetWealth = currentHomeValue * 0.94 - remainingLoan;

    // 2. Renter: rent inflates, invests difference + down payment in stock index
    rentWealth *= 1 + params.investmentReturn / 100;
    const annualRent = currentMonthlyRent * 12;
    currentMonthlyRent *= 1 + params.rentInflation / 100;

    const annualOwnerOutflow = monthlyMortgage * 12 + annualMaintenanceAndTax;
    const savingsDifference = annualOwnerOutflow - annualRent;
    if (savingsDifference > 0) {
      // Renter saves difference and invests it
      rentWealth += savingsDifference;
    }

    if (breakEvenYear === -1 && buyNetWealth > rentWealth) {
      breakEvenYear = yr;
    }

    if (yr <= params.yearsToStay) {
      yearlyComparison.push({
        year: yr,
        buyNetWealth,
        rentNetWealth: rentWealth,
        homeValue: currentHomeValue,
        annualRent,
      });
    }
  }

  const selectedYear = yearlyComparison[params.yearsToStay - 1] || yearlyComparison[yearlyComparison.length - 1];
  const netAdvantage = selectedYear ? selectedYear.buyNetWealth - selectedYear.rentNetWealth : 0;
  const buyingWins = netAdvantage > 0;

  const formatUsd = (num: number) => `$${Math.round(num).toLocaleString()}`;

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Rent vs. Buy Financial Break-Even Calculator</h3>
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
          Target Home Price ($)
          <input
            type="number"
            min="50000"
            step="10000"
            value={params.homePrice}
            onChange={e => setParams({ homePrice: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Down Payment (%)
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={params.downPaymentPercent}
            onChange={e => setParams({ downPaymentPercent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Mortgage Interest Rate (% APR)
          <input
            type="number"
            min="1"
            max="20"
            step="0.1"
            value={params.mortgageRate}
            onChange={e => setParams({ mortgageRate: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Current Comparable Rent ($/month)
          <input
            type="number"
            min="500"
            step="100"
            value={params.monthlyRent}
            onChange={e => setParams({ monthlyRent: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Expected Home Price Appreciation (%/year)
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            value={params.homeAppreciation}
            onChange={e => setParams({ homeAppreciation: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Expected Rent Inflation (%/year)
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            value={params.rentInflation}
            onChange={e => setParams({ rentInflation: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Investment Return on Saved Capital (%/year)
          <input
            type="number"
            min="0"
            max="20"
            step="0.5"
            value={params.investmentReturn}
            onChange={e => setParams({ investmentReturn: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          Planning Horizon (Years to Stay)
          <input
            type="number"
            min="1"
            max="30"
            step="1"
            value={params.yearsToStay}
            onChange={e => setParams({ yearsToStay: Number(e.target.value) || 10 })}
          />
        </label>
      </div>

      <div className="result-panel my-6" aria-live="polite">
        <p className="m-0 text-sm opacity-80">
          Financial Outcome at Year {params.yearsToStay}
        </p>
        <strong className={`big-result text-3xl font-bold my-1 block ${buyingWins ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
          {buyingWins ? `Buying Wins by ${formatUsd(netAdvantage)}` : `Renting Wins by ${formatUsd(Math.abs(netAdvantage))}`}
        </strong>
        <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
          Financial Break-Even Horizon:{" "}
          <strong>
            {breakEvenYear > 0 ? `Year ${breakEvenYear}` : "Over 30 years (Renting stays ahead)"}
          </strong>
        </p>

        <div className="stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat primary-stat">
            <span>Buyer Net Wealth</span>
            <strong>{formatUsd(selectedYear?.buyNetWealth || 0)}</strong>
          </div>
          <div className="stat">
            <span>Renter Net Wealth</span>
            <strong>{formatUsd(selectedYear?.rentNetWealth || 0)}</strong>
          </div>
          <div className="stat">
            <span>Projected Home Value</span>
            <strong>{formatUsd(selectedYear?.homeValue || 0)}</strong>
          </div>
          <div className="stat">
            <span>Down Payment Capital</span>
            <strong>{formatUsd(downPayment)}</strong>
          </div>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Models 6% seller closing costs, 2.5% property taxes and maintenance reserves, compounding home appreciation, rent inflation, and stock market opportunity cost. All numbers computed in-browser.
      </p>
    </div>
  );
}
