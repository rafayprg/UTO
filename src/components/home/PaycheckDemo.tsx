"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { US_STATES } from "@/data/programmatic/us-states";
import { estimateW2Paycheck, PAY_PERIODS, type PayPeriod } from "@/lib/paycheck";

const MAX_SALARY = 10_000_000;
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PERIOD_LABEL: Record<PayPeriod, string> = { annual: "a year", monthly: "a month", biweekly: "every two weeks", weekly: "a week" };

export function PaycheckDemo() {
  const id = useId();
  const [salaryText, setSalaryText] = useState("75,000");
  const [stateCode, setStateCode] = useState("TX");
  const [period, setPeriod] = useState<PayPeriod>("biweekly");

  const salary = Math.min(MAX_SALARY, Number(salaryText.replace(/[^0-9.]/g, "")) || 0);
  const state = US_STATES.find((s) => s.code === stateCode) ?? US_STATES[0];
  const result = useMemo(() => estimateW2Paycheck(state, salary), [state, salary]);
  const per = PAY_PERIODS[period];

  const parts = [
    { label: "Federal income tax", value: result.federalTax, color: "#15201b" },
    { label: "Social Security & Medicare", value: result.socialSecurity + result.medicare, color: "#4c5650" },
    { label: `${state.name} income tax`, value: result.stateTax, color: "#8e988f" },
  ];

  return (
    <section className="lt-demo" aria-labelledby={`${id}-title`}>
      <div className="lt-demo__head">
        <h2 id={`${id}-title`}>Try one now: take-home pay</h2>
        <span className="lt-demo__badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
          </svg>
          Calculated on this device
        </span>
      </div>

      <div className="lt-demo__fields">
        <label className="lt-field">
          Yearly salary
          <input
            inputMode="decimal"
            value={salaryText}
            onChange={(event) => setSalaryText(event.target.value)}
            onBlur={() => setSalaryText(salary ? salary.toLocaleString("en-US") : "")}
            aria-describedby={`${id}-answer`}
          />
        </label>
        <label className="lt-field">
          State
          <select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lt-demo__answer" id={`${id}-answer`} aria-live="polite">
        <p>
          You take home about{" "}
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PayPeriod)}
            aria-label="Pay period"
            style={{ border: 0, background: "none", font: "inherit", color: "var(--ink)", fontWeight: 600, textDecoration: "underline", padding: 0 }}
          >
            {(Object.keys(PAY_PERIODS) as PayPeriod[]).map((key) => (
              <option key={key} value={key}>
                {PERIOD_LABEL[key]}
              </option>
            ))}
          </select>
        </p>
        <strong className="lt-demo__figure lt-num">
          <span className="lt-mark">{usd.format(result.netAnnual / per)}</span>
        </strong>

        <div className="lt-demo__bar" aria-hidden="true">
          {parts.map((part) => (
            <span key={part.label} style={{ width: `${salary ? (part.value / salary) * 100 : 0}%`, background: part.color }} />
          ))}
          <span style={{ width: `${salary ? (result.netAnnual / salary) * 100 : 0}%`, background: "#f2e35b" }} />
        </div>
        <div className="lt-demo__breakdown">
          {parts.map((part) => (
            <div className="lt-demo__row" key={part.label}>
              <span>
                <i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: part.color, marginRight: 8 }} />
                {part.label}
              </span>
              <strong className="lt-num">{usd.format(part.value / per)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="lt-demo__foot">
        <span>Single filer, standard deduction, 2026 federal rates.</span>
        <Link className="lt-link" href={`/tools/finance/${state.slug}-paycheck-calculator/`}>
          Full {state.name} calculator
        </Link>
      </div>
    </section>
  );
}
