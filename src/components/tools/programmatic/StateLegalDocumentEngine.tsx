"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  FileText,
  Copy,
  Check,
  RotateCcw,
  Printer,
  Shield,
  Scale,
  Award,
  CheckCircle2,
} from "lucide-react";
import type { ToolDefinition } from "@/lib/tools-registry";
import { US_LEGAL_DATA, type StateLegalData } from "@/data/programmatic/us-legal";

interface StateLegalDocumentEngineProps {
  tool: ToolDefinition;
}

export default function StateLegalDocumentEngine({ tool }: StateLegalDocumentEngineProps) {
  // Extract state data
  const stateData: StateLegalData = useMemo(() => {
    const matched = US_LEGAL_DATA.find((s) => tool.slug.startsWith(s.slug));
    return matched || US_LEGAL_DATA[0];
  }, [tool.slug]);

  // Determine legal document type
  const docType = useMemo(() => {
    if (tool.slug.includes("bill-of-sale")) return "bill-of-sale";
    if (tool.slug.includes("non-disclosure-agreement") || tool.slug.includes("nda")) return "nda";
    if (tool.slug.includes("llc-operating-agreement")) return "llc";
    return "promissory-note";
  }, [tool.slug]);

  // Common Date
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Form States - Bill of Sale
  const [sellerName, setSellerName] = useState<string>("Johnathan Miller");
  const [sellerAddress, setSellerAddress] = useState<string>(`100 Main St, ${stateData.name}`);
  const [buyerName, setBuyerName] = useState<string>("Sarah Jenkins");
  const [buyerAddress, setBuyerAddress] = useState<string>(`250 Elm Ave, ${stateData.name}`);
  const [itemDescription, setItemDescription] = useState<string>("2021 Toyota RAV4 XLE (Silver)");
  const [itemIdentifier, setItemIdentifier] = useState<string>("4T3BFREV8MU129845");
  const [salePrice, setSalePrice] = useState<number>(21500);
  const [includeAsIs, setIncludeAsIs] = useState<boolean>(true);
  const [includeNotary, setIncludeNotary] = useState<boolean>(stateData.notaryRequired);

  // Form States - NDA
  const [disclosingParty, setDisclosingParty] = useState<string>(`${stateData.name} Ventures LLC`);
  const [receivingParty, setReceivingParty] = useState<string>("Apex Consulting Partners Inc.");
  const [ndaPurpose, setNdaPurpose] = useState<string>("Evaluating a prospective commercial partnership, technology license, and proprietary software architecture");
  const [termYears, setTermYears] = useState<number>(2);

  // Form States - LLC Operating Agreement
  const [llcName, setLlcName] = useState<string>(`Keystone Innovations ${stateData.code} LLC`);
  const [llcAddress, setLlcAddress] = useState<string>(`500 Enterprise Way, ${stateData.name}`);
  const [member1Name, setMember1Name] = useState<string>("Alexander Hayes");
  const [member1Percent, setMember1Percent] = useState<number>(60);
  const [member2Name, setMember2Name] = useState<string>("Elena Rostova");
  const [member2Percent, setMember2Percent] = useState<number>(40);
  const [isMemberManaged, setIsMemberManaged] = useState<boolean>(true);

  // Form States - Promissory Note
  const [lenderName, setLenderName] = useState<string>("Vanguard Capital Funding LLC");
  const [borrowerName, setBorrowerName] = useState<string>("Marcus Aurelius Sterling");
  const [principalAmount, setPrincipalAmount] = useState<number>(15000);
  const [interestRate, setInterestRate] = useState<number>(stateData.statutoryInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState<number>(24);
  const [lateFee, setLateFee] = useState<number>(50);

  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Generate Document Body
  const documentText = useMemo(() => {
    if (docType === "bill-of-sale") {
      return [
        `================================================================================`,
        `                       STATE OF ${stateData.name.toUpperCase()} BILL OF SALE`,
        `================================================================================`,
        `Effective Execution Date: ${today}`,
        `Governing State Jurisdiction: State of ${stateData.name}`,
        ``,
        `1. THE PARTIES:`,
        `   This Legal Bill of Sale is entered into on ${today}, between:`,
        `   • SELLER: ${sellerName}, residing at ${sellerAddress}.`,
        `   • BUYER:  ${buyerName}, residing at ${buyerAddress}.`,
        ``,
        `2. DESCRIPTION OF PROPERTY:`,
        `   Seller covenants and agrees to convey, assign, and transfer to Buyer:`,
        `   • Item / Vehicle Description: ${itemDescription}`,
        `   • Identification / VIN / Serial Number: ${itemIdentifier}`,
        ``,
        `3. PURCHASE CONSIDERATION:`,
        `   • Total Sale Price Paid: $${salePrice.toLocaleString()} USD`,
        `   Seller acknowledges receipt of full and complete payment from Buyer.`,
        ``,
        includeAsIs ? [
          `4. AS-IS DISCLAIMER OF WARRANTIES:`,
          `   ${stateData.asIsDisclaimer}`,
          `   The property is transferred in its present condition. Seller explicitly disclaims`,
          `   all warranties, express or implied, including merchantability or fitness for a`,
          `   particular purpose. Buyer assumes all risks concerning repair, maintenance, and defects.`
        ].join("\n") : "",
        ``,
        `5. SELLER'S TITLE WARRANTY & INDEMNIFICATION:`,
        `   Seller warrants and represents that Seller is the lawful owner of the property,`,
        `   having full authority to sell and convey the same, and that the property is free`,
        `   and clear of all legal liens, encumbrances, security claims, and tax liabilities.`,
        ``,
        `6. GOVERNING LAW:`,
        `   ${stateData.governingLawClause}`,
        ``,
        `7. EXECUTION SIGNATURES:`,
        ``,
        `   Seller Signature: _______________________      Date: ______________`,
        `   Printed Name: ${sellerName}`,
        ``,
        `   Buyer Signature:  _______________________      Date: ______________`,
        `   Printed Name: ${buyerName}`,
        ``,
        includeNotary ? [
          `--------------------------------------------------------------------------------`,
          `                    STATE OF ${stateData.name.toUpperCase()} NOTARY ACKNOWLEDGMENT`,
          `--------------------------------------------------------------------------------`,
          `County of _______________________, State of ${stateData.name}`,
          `On this _____ day of _______________, 20____, before me, the undersigned notary`,
          `public, personally appeared ${sellerName} and ${buyerName}, known to me to be the`,
          `persons whose names are subscribed to the within instrument, and acknowledged that`,
          `they executed the same for the purposes therein contained.`,
          ``,
          `Notary Public Signature: ___________________________ [SEAL]`,
          `My Commission Expires:   ___________________________`
        ].join("\n") : ""
      ].filter(Boolean).join("\n");
    }

    if (docType === "nda") {
      return [
        `================================================================================`,
        `         STATE OF ${stateData.name.toUpperCase()} MUTUAL NON-DISCLOSURE AGREEMENT`,
        `================================================================================`,
        `Effective Execution Date: ${today}`,
        `Governing State Jurisdiction: State of ${stateData.name}`,
        ``,
        `1. PARTIES:`,
        `   This Non-Disclosure Agreement ("Agreement") is executed on ${today}, by and between:`,
        `   • DISCLOSING COVENANTOR: ${disclosingParty}`,
        `   • RECEIVING COVENANTOR:  ${receivingParty}`,
        ``,
        `2. PURPOSE OF DISCLOSURE:`,
        `   The parties desire to engage in confidential discussions solely concerning:`,
        `   "${ndaPurpose}".`,
        ``,
        `3. DEFINITION OF CONFIDENTIAL INFORMATION:`,
        `   "Confidential Information" includes, without limitation, all technical data, trade`,
        `   secrets, source code, business architectures, financial projections, customer rosters,`,
        `   and proprietary commercial assets disclosed directly or indirectly in writing or orally.`,
        ``,
        `4. STATUTORY COMPLIANCE & STATE PROTECTIONS:`,
        `   ${stateData.statutoryNotice}`,
        ``,
        `5. OBLIGATIONS OF RECEIVING PARTY:`,
        `   Receiving Party covenants to maintain strict confidentiality, exercising at least`,
        `   the standard of reasonable enterprise care. Receiving Party shall not copy, reverse-`,
        `   engineer, or disclose Confidential Information except to bona fide legal advisors.`,
        ``,
        `6. DURATION & TERM:`,
        `   This Agreement shall remain in effect for ${termYears} years from the Effective Date,`,
        `   provided that trade secret protection under ${stateData.name} statutory law survives`,
        `   indefinitely until information lawfully enters the public domain.`,
        ``,
        `7. INJUNCTIVE RELIEF:`,
        `   Any unauthorized disclosure causes irreparable commercial harm. Disclosing Party`,
        `   is entitled to seek emergency preliminary and permanent injunctive relief without bond.`,
        ``,
        `8. GOVERNING LAW & JURISDICTION:`,
        `   ${stateData.governingLawClause}`,
        ``,
        `9. EXECUTED BY AUTHORIZED REPRESENTATIVES:`,
        ``,
        `   By: _________________________________          By: _________________________________`,
        `   For: ${disclosingParty}                         For: ${receivingParty}`,
        `   Date: ${today}                                  Date: ${today}`
      ].join("\n");
    }

    if (docType === "llc") {
      return [
        `================================================================================`,
        `        STATE OF ${stateData.name.toUpperCase()} LLC OPERATING AGREEMENT`,
        `================================================================================`,
        `Company Name: ${llcName}`,
        `Filing Authority: ${stateData.stateFilingAgency}`,
        `Effective Date: ${today}`,
        ``,
        `1. FORMATION & STATUTORY AUTHORITY:`,
        `   This Operating Agreement governs the operation and governance of ${llcName},`,
        `   organized pursuant to the Limited Liability Company statutes of the State of ${stateData.name}.`,
        `   Principal Executive Office: ${llcAddress}.`,
        ``,
        `2. MANAGEMENT STRUCTURE:`,
        `   The Company shall be ${isMemberManaged ? "MEMBER-MANAGED" : "MANAGER-MANAGED"}. All ordinary`,
        `   business decisions shall be decided by majority vote based on Member Ownership Units.`,
        ``,
        `3. CAPITALIZATION & OWNERSHIP UNITS:`,
        `   • Member 1: ${member1Name} — ${member1Percent}% Ownership Interest`,
        `   • Member 2: ${member2Name} — ${member2Percent}% Ownership Interest`,
        `   Total Membership Units: 100%`,
        ``,
        `4. DISTRIBUTIONS & PROFIT/LOSS ALLOCATION:`,
        `   All net business profits, capital gains, and taxable losses shall be distributed to`,
        `   Members strictly in proportion to their respective Membership Percentage Interests,`,
        `   complying with Internal Revenue Code Section 704(b).`,
        ``,
        `5. TRANSFER RESTRICTIONS & RIGHT OF FIRST REFUSAL:`,
        `   No Member may sell, assign, pledge, or transfer ownership units without first offering`,
        `   an exclusive 30-day Right of First Refusal to existing Members at fair market value.`,
        ``,
        `6. DISSOLUTION & WINDING UP:`,
        `   The Company shall dissolve only upon unanimous written consent of all Members or entry`,
        `   of a decree of judicial dissolution under ${stateData.name} statutes.`,
        ``,
        `7. GOVERNING LAW & SEVERABILITY:`,
        `   ${stateData.governingLawClause}`,
        ``,
        `IN WITNESS WHEREOF, the undersigned Members have executed this Operating Agreement:`,
        ``,
        `Member 1 Signature: _________________________    Date: ${today}`,
        `Printed Name: ${member1Name} (${member1Percent}%)`,
        ``,
        `Member 2 Signature: _________________________    Date: ${today}`,
        `Printed Name: ${member2Name} (${member2Percent}%)`
      ].join("\n");
    }

    // Default: Promissory Note
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = principalAmount * (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -loanTermMonths)));
    const totalRepaid = monthlyPayment * loanTermMonths;

    return [
      `================================================================================`,
      `              STATE OF ${stateData.name.toUpperCase()} PROMISSORY NOTE`,
      `================================================================================`,
      `Principal Sum: $${principalAmount.toLocaleString()} USD`,
      `Annual Nominal Interest Rate: ${interestRate}% (Statutory Limit: ${stateData.statutoryInterestRate}%)`,
      `Execution Date: ${today}`,
      `Governing Jurisdiction: State of ${stateData.name}`,
      ``,
      `1. PROMISE TO PAY:`,
      `   FOR VALUE RECEIVED, ${borrowerName} ("Borrower"), promises to pay to the order of`,
      `   ${lenderName} ("Lender"), the principal sum of $${principalAmount.toLocaleString()} USD,`,
      `   together with interest on the unpaid principal balance at the rate of ${interestRate}% per annum.`,
      ``,
      `2. REPAYMENT TERMS:`,
      `   Borrower shall pay ${loanTermMonths} consecutive monthly installments of:`,
      `   • Estimated Monthly Payment: $${monthlyPayment.toFixed(2)} / month`,
      `   • Total Principal + Interest Repaid: $${totalRepaid.toFixed(2)}`,
      `   • Final Maturity Date: ${loanTermMonths} months from ${today}.`,
      ``,
      `3. LATE CHARGE & PENALTY:`,
      `   If any scheduled payment is not received within 10 business days of its due date,`,
      `   Borrower agrees to pay Lender a late charge of $${lateFee.toFixed(2)} USD.`,
      ``,
      `4. PREPAYMENT PRIVILEGE:`,
      `   Borrower reserves the right to prepay the remaining principal balance in whole or`,
      `   in part at any time without penalty or unearned interest charges.`,
      ``,
      `5. ACCELERATION ON DEFAULT:`,
      `   If Borrower fails to cure any payment default within 30 days of written notice,`,
      `   Lender may declare the entire outstanding principal and accrued interest immediately due.`,
      ``,
      `6. STATUTORY COMPLIANCE & USURY SAVINGS CLAUSE:`,
      `   All interest charged hereunder shall comply with ${stateData.name} statutory usury limits.`,
      `   If any interest rate is determined to exceed legal limits, the excess shall apply to principal.`,
      ``,
      `7. GOVERNING LAW:`,
      `   ${stateData.governingLawClause}`,
      ``,
      `BORROWER SIGNATURE:`,
      ``,
      `Signature: ___________________________________     Date: ${today}`,
      `Borrower Name: ${borrowerName}`
    ].join("\n");
  }, [
    docType,
    stateData,
    today,
    sellerName,
    sellerAddress,
    buyerName,
    buyerAddress,
    itemDescription,
    itemIdentifier,
    salePrice,
    includeAsIs,
    includeNotary,
    disclosingParty,
    receivingParty,
    ndaPurpose,
    termYears,
    llcName,
    llcAddress,
    member1Name,
    member1Percent,
    member2Name,
    member2Percent,
    isMemberManaged,
    lenderName,
    borrowerName,
    principalAmount,
    interestRate,
    loanTermMonths,
    lateFee,
  ]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(documentText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [documentText]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleReset = useCallback(() => {
    setSellerName("Johnathan Miller");
    setBuyerName("Sarah Jenkins");
    setSalePrice(21500);
    setPrincipalAmount(15000);
    setInterestRate(stateData.statutoryInterestRate);
  }, [stateData.statutoryInterestRate]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6 font-sans antialiased text-slate-100">
      {/* Top HUD Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
                Jurisdiction: State of {stateData.name} ({stateData.code})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Client-Side Private
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {tool.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? "Copied Agreement!" : "Copy Legal Agreement"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Agreement Parameters
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Bill of Sale Specific Inputs */}
          {docType === "bill-of-sale" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Seller Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Seller Address
                  </label>
                  <input
                    type="text"
                    value={sellerAddress}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Buyer Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Buyer Address
                  </label>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item / Vehicle Description
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    VIN / Serial #
                  </label>
                  <input
                    type="text"
                    value={itemIdentifier}
                    onChange={(e) => setItemIdentifier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sale Price ($)
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeAsIs}
                    onChange={(e) => setIncludeAsIs(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Include Statutory &apos;AS IS&apos; Disclaimer ({stateData.code} Commercial Code)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeNotary}
                    onChange={(e) => setIncludeNotary(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Include Notary Public Acknowledgment Block</span>
                </label>
              </div>
            </div>
          )}

          {/* NDA Specific Inputs */}
          {docType === "nda" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Disclosing Party (Company or Individual)
                </label>
                <input
                  type="text"
                  value={disclosingParty}
                  onChange={(e) => setDisclosingParty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Receiving Party
                </label>
                <input
                  type="text"
                  value={receivingParty}
                  onChange={(e) => setReceivingParty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Purpose of Commercial Discussions
                </label>
                <textarea
                  rows={3}
                  value={ndaPurpose}
                  onChange={(e) => setNdaPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Agreement Confidentiality Term (Years)
                </label>
                <select
                  value={termYears}
                  onChange={(e) => setTermYears(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                >
                  <option value={1}>1 Year Term</option>
                  <option value={2}>2 Years Standard</option>
                  <option value={3}>3 Years Extended</option>
                  <option value={5}>5 Years Enterprise</option>
                </select>
              </div>
            </div>
          )}

          {/* LLC Operating Agreement Inputs */}
          {docType === "llc" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Official LLC Registered Name
                </label>
                <input
                  type="text"
                  value={llcName}
                  onChange={(e) => setLlcName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Principal Executive Office
                </label>
                <input
                  type="text"
                  value={llcAddress}
                  onChange={(e) => setLlcAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Member 1 Name
                  </label>
                  <input
                    type="text"
                    value={member1Name}
                    onChange={(e) => setMember1Name(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Share (% Ownership)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={member1Percent}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setMember1Percent(v);
                      setMember2Percent(100 - v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Member 2 Name
                  </label>
                  <input
                    type="text"
                    value={member2Name}
                    onChange={(e) => setMember2Name(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Share (% Ownership)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={member2Percent}
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Management Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMemberManaged(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border ${isMemberManaged ? "bg-indigo-600/30 border-indigo-500 text-indigo-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                  >
                    Member-Managed
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMemberManaged(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border ${!isMemberManaged ? "bg-indigo-600/30 border-indigo-500 text-indigo-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                  >
                    Manager-Managed
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Promissory Note Inputs */}
          {docType === "promissory-note" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lender Name / Financial Institution
                </label>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Borrower Full Legal Name
                </label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Loan Principal ($)
                  </label>
                  <input
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    APR (% Interest)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Term Duration
                  </label>
                  <select
                    value={loanTermMonths}
                    onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    <option value={12}>12 Months (1 Yr)</option>
                    <option value={24}>24 Months (2 Yrs)</option>
                    <option value={36}>36 Months (3 Yrs)</option>
                    <option value={60}>60 Months (5 Yrs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Late Fee ($)
                  </label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Legal Compliance Footer Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Statutory Filing Authority:
            </div>
            <p className="leading-relaxed">
              {stateData.stateFilingAgency}. Built with statutory governing law clauses under the Uniform Commercial Code (UCC) and applicable state codes.
            </p>
          </div>
        </div>

        {/* Right Live Contract Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Live Document Preview
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Official {stateData.name} Edition
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Ready to Sign &amp; Notarize
            </span>
          </div>

          {/* Contract Output Container */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-6 shadow-2xl font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[700px] overflow-y-auto selection:bg-indigo-500 selection:text-white">
            {documentText}
          </div>

          {/* Bottom Trust & Verification Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block">State Law Aligned</span>
                Governing {stateData.name} statutes
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block">Standardized Clauses</span>
                Severability &amp; Usury Savings
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block">Confidential &amp; Local</span>
                Zero server document storage
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
