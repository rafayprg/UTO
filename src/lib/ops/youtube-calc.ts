import type { CalcField, CalcOp, CalcOutput } from "./types";

const ESTIMATE = "Estimate only. Uses the numbers you enter; actual YouTube earnings vary and are shown in YouTube Analytics.";

function num(value: string, label: string, { min = 0, allowZero = true, max = Infinity } = {}): number {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  if (String(value ?? "").trim() === "" || !Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  if (parsed < min || (!allowZero && parsed === 0)) throw new Error(`${label[0].toUpperCase()}${label.slice(1)} must be ${allowZero ? "at least" : "greater than"} ${min}.`);
  if (parsed > max) throw new Error(`${label[0].toUpperCase()}${label.slice(1)} must be at most ${max}.`);
  return parsed;
}

/** "4:30", "1:02:03" or "270" (seconds) → seconds. */
function duration(value: string, label: string): number {
  const clean = String(value ?? "").trim();
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(clean)) throw new Error(`Enter ${label} as m:ss, h:mm:ss or seconds.`);
  const parts = clean.split(":").map(Number);
  if (parts.slice(1).some(part => part >= 60)) throw new Error(`Minutes and seconds in ${label} must be under 60.`);
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  if (seconds <= 0) throw new Error(`${label[0].toUpperCase()}${label.slice(1)} must be longer than zero.`);
  return seconds;
}

const usd = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const int = (value: number) => Math.round(value).toLocaleString("en-US");
const fixed = (value: number, digits = 2) => value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (value: number, digits = 2) => `${fixed(value, digits)}%`;

function clock(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function finite(output: CalcOutput): CalcOutput {
  if (output.results.some(r => /NaN|Infinity/.test(r.value))) throw new Error("Those numbers give a result that is too large to show.");
  return output;
}

const field = (id: string, label: string, def: string, extra: Partial<CalcField> = {}): CalcField => ({ id, label, type: "number", default: def, ...extra });

const revenueOps: Record<string, CalcOp> = {
  "adsense-rpm-estimator": {
    fields: [field("views", "Views", "100000"), field("rpm", "Your RPM (USD per 1,000 views)", "3.50", { step: "0.01", hint: "Find your own RPM in YouTube Analytics → Revenue." })],
    note: ESTIMATE,
    compute(v) {
      const views = num(v.views, "views");
      const rpm = num(v.rpm, "the RPM");
      const earnings = (views / 1000) * rpm;
      return finite({
        results: [
          { label: "Estimated earnings", value: usd(earnings), primary: true },
          { label: "Per 1 million views", value: usd(rpm * 1000) },
          { label: "Per view", value: `$${fixed(rpm / 1000, 4)}` },
        ],
        formula: "Earnings = Views ÷ 1,000 × RPM",
      });
    },
  },
  "cpm-revenue-estimator": {
    fields: [
      field("views", "Views", "100000"),
      field("monetized", "Monetized playbacks (% of views)", "50", { step: "0.1", hint: "Shown in YouTube Analytics; enter your own figure." }),
      field("cpm", "Your CPM (USD per 1,000 ad impressions)", "8", { step: "0.01" }),
      field("share", "Your share of ad revenue (%)", "55", { step: "0.1", hint: "Use the revenue share in your YouTube Partner Program terms." }),
    ],
    note: ESTIMATE,
    compute(v) {
      const views = num(v.views, "views");
      const monetized = num(v.monetized, "monetized playbacks", { max: 100 }) / 100;
      const cpm = num(v.cpm, "the CPM");
      const share = num(v.share, "your revenue share", { max: 100 }) / 100;
      const gross = (views * monetized / 1000) * cpm;
      const net = gross * share;
      return finite({
        results: [
          { label: "Your estimated earnings", value: usd(net), primary: true },
          { label: "Gross ad revenue", value: usd(gross) },
          { label: "Monetized playbacks", value: int(views * monetized) },
          { label: "Effective RPM", value: views > 0 ? usd((net / views) * 1000) : usd(0) },
        ],
        formula: "Earnings = Views × Monetized % ÷ 1,000 × CPM × Your share",
      });
    },
  },
  "youtube-rpm-calculator": {
    fields: [field("earnings", "Total earnings (USD)", "350", { step: "0.01" }), field("views", "Views in the same period", "100000")],
    note: "RPM (revenue per mille) is what you earned per 1,000 views after YouTube's share.",
    compute(v) {
      const earnings = num(v.earnings, "the earnings");
      const views = num(v.views, "views", { allowZero: false });
      return finite({ results: [{ label: "RPM", value: usd((earnings / views) * 1000), primary: true }, { label: "Earnings per view", value: `$${fixed(earnings / views, 4)}` }], formula: "RPM = Earnings ÷ Views × 1,000" });
    },
  },
  "youtube-cpm-calculator": {
    fields: [field("revenue", "Gross ad revenue (USD)", "400", { step: "0.01" }), field("impressions", "Ad impressions (or monetized playbacks)", "50000")],
    note: "CPM is what advertisers paid per 1,000 ad impressions, before YouTube's share.",
    compute(v) {
      const revenue = num(v.revenue, "the ad revenue");
      const impressions = num(v.impressions, "ad impressions", { allowZero: false });
      return finite({ results: [{ label: "CPM", value: usd((revenue / impressions) * 1000), primary: true }], formula: "CPM = Ad revenue ÷ Ad impressions × 1,000" });
    },
  },
  "youtube-revenue-goal": {
    fields: [field("target", "Earnings goal (USD)", "1000", { step: "0.01" }), field("rpm", "Your RPM (USD)", "3.50", { step: "0.01" }), field("videos", "Videos you plan to publish", "8")],
    note: ESTIMATE,
    compute(v) {
      const target = num(v.target, "the goal");
      const rpm = num(v.rpm, "the RPM", { allowZero: false });
      const videos = num(v.videos, "the number of videos", { min: 1 });
      const views = (target / rpm) * 1000;
      return finite({ results: [{ label: "Views needed", value: int(views), primary: true }, { label: "Views needed per video", value: int(views / videos) }], formula: "Views = Goal ÷ RPM × 1,000" });
    },
  },
  "sponsorship-rate-calculator": {
    fields: [
      field("views", "Expected views of the sponsored video", "50000"),
      field("rate", "Your rate per 1,000 views (USD)", "20", { step: "0.01", hint: "Your own CPM-style sponsor rate; there is no fixed industry figure." }),
      field("multiplier", "Placement multiplier", "1", { step: "0.1", hint: "1 for an integrated mention; set your own higher value for a dedicated video." }),
      field("extras", "Extra fees (USD, e.g. links, usage rights)", "0", { step: "0.01" }),
    ],
    note: "A starting point for your own pricing, not a market rate.",
    compute(v) {
      const views = num(v.views, "expected views");
      const rate = num(v.rate, "your rate");
      const multiplier = num(v.multiplier, "the multiplier", { allowZero: false });
      const extras = num(v.extras, "extra fees");
      const base = (views / 1000) * rate;
      return finite({
        results: [{ label: "Suggested quote", value: usd(base * multiplier + extras), primary: true }, { label: "Base (views × rate)", value: usd(base) }, { label: "Cost per view to the sponsor", value: views > 0 ? `$${fixed((base * multiplier + extras) / views, 4)}` : "—" }],
        formula: "Quote = Views ÷ 1,000 × Rate × Multiplier + Extras",
      });
    },
  },
  "youtube-membership-revenue": {
    fields: [field("members", "Paying members", "120"), field("price", "Monthly price per member (USD)", "4.99", { step: "0.01" }), field("share", "Your share (%)", "70", { step: "0.1", hint: "Check YouTube's current channel membership terms for your share." })],
    note: "Estimate only. Taxes and app-store fees can lower the amount you receive.",
    compute(v) {
      const members = num(v.members, "members");
      const price = num(v.price, "the price");
      const share = num(v.share, "your share", { max: 100 }) / 100;
      const monthly = members * price * share;
      return finite({ results: [{ label: "Monthly earnings", value: usd(monthly), primary: true }, { label: "Yearly earnings", value: usd(monthly * 12) }, { label: "Gross monthly revenue", value: usd(members * price) }], formula: "Monthly = Members × Price × Your share" });
    },
  },
  "youtube-video-roi": {
    fields: [field("cost", "Production cost (USD)", "500", { step: "0.01" }), field("views", "Views", "80000"), field("rpm", "Your RPM (USD)", "3.50", { step: "0.01" }), field("other", "Other income from the video (USD, sponsors, affiliates)", "300", { step: "0.01" })],
    note: ESTIMATE,
    compute(v) {
      const cost = num(v.cost, "the cost", { allowZero: false });
      const views = num(v.views, "views");
      const rpm = num(v.rpm, "the RPM");
      const other = num(v.other, "other income");
      const income = (views / 1000) * rpm + other;
      const breakEven = rpm > 0 ? Math.max(0, ((cost - other) / rpm) * 1000) : NaN;
      return finite({
        results: [
          { label: "ROI", value: pct(((income - cost) / cost) * 100, 1), primary: true },
          { label: "Total income", value: usd(income) },
          { label: "Profit", value: usd(income - cost) },
          { label: "Break-even views", value: Number.isFinite(breakEven) ? int(breakEven) : "Not reachable with RPM 0" },
        ],
        formula: "ROI = (Income − Cost) ÷ Cost × 100; Income = Views ÷ 1,000 × RPM + Other",
      });
    },
  },
};

const growthOps: Record<string, CalcOp> = {
  "youtube-engagement-rate": {
    fields: [field("likes", "Likes", "4200"), field("comments", "Comments", "380"), field("shares", "Shares", "150"), field("views", "Views", "90000")],
    note: "Engagement rate here = (likes + comments + shares) ÷ views. Other tools may divide by subscribers instead.",
    compute(v) {
      const total = num(v.likes, "likes") + num(v.comments, "comments") + num(v.shares, "shares");
      const views = num(v.views, "views", { allowZero: false });
      return finite({ results: [{ label: "Engagement rate", value: pct((total / views) * 100), primary: true }, { label: "Total interactions", value: int(total) }], formula: "Rate = (Likes + Comments + Shares) ÷ Views × 100" });
    },
  },
  "youtube-like-ratio": {
    fields: [field("likes", "Likes", "4200"), field("dislikes", "Dislikes (from YouTube Studio)", "120"), field("views", "Views", "90000")],
    compute(v) {
      const likes = num(v.likes, "likes");
      const dislikes = num(v.dislikes, "dislikes");
      const views = num(v.views, "views", { allowZero: false });
      const votes = likes + dislikes;
      return finite({
        results: [
          { label: "Likes per 100 views", value: fixed((likes / views) * 100), primary: true },
          { label: "Like share of all ratings", value: votes > 0 ? pct((likes / votes) * 100, 1) : "No ratings yet" },
          { label: "Views per like", value: likes > 0 ? fixed(views / likes, 1) : "No likes yet" },
        ],
        formula: "Like-to-view = Likes ÷ Views × 100; Like share = Likes ÷ (Likes + Dislikes)",
      });
    },
  },
  "youtube-ctr-calculator": {
    fields: [field("impressions", "Impressions", "250000"), field("views", "Views from impressions", "11500")],
    compute(v) {
      const impressions = num(v.impressions, "impressions", { allowZero: false });
      const views = num(v.views, "views");
      return finite({ results: [{ label: "Impressions click-through rate", value: pct((views / impressions) * 100), primary: true }], formula: "CTR = Views from impressions ÷ Impressions × 100" });
    },
  },
  "youtube-impressions-needed": {
    fields: [field("target", "Target views", "20000"), field("ctr", "Your click-through rate (%)", "4.5", { step: "0.1" })],
    compute(v) {
      const target = num(v.target, "target views");
      const ctr = num(v.ctr, "the CTR", { allowZero: false, max: 100 });
      return finite({ results: [{ label: "Impressions needed", value: int(target / (ctr / 100)), primary: true }], formula: "Impressions = Target views ÷ (CTR ÷ 100)" });
    },
  },
  "youtube-retention-calculator": {
    fields: [{ id: "avd", label: "Average view duration (m:ss)", type: "text", default: "4:12" }, { id: "length", label: "Video length (m:ss)", type: "text", default: "10:30" }],
    compute(v) {
      const avd = duration(v.avd, "the average view duration");
      const length = duration(v.length, "the video length");
      if (avd > length) throw new Error("The average view duration cannot be longer than the video.");
      return finite({ results: [{ label: "Average percentage viewed", value: pct((avd / length) * 100, 1), primary: true }, { label: "Average time not watched", value: clock(length - avd) }], formula: "Average % viewed = Average view duration ÷ Video length × 100" });
    },
  },
  "youtube-watch-time-calculator": {
    fields: [field("views", "Views", "60000"), { id: "avd", label: "Average view duration (m:ss)", type: "text", default: "3:45" }, field("goal", "Watch-hour goal", "4000", { hint: "Enter your target; check the YouTube Partner Program page for current requirements." })],
    compute(v) {
      const views = num(v.views, "views");
      const avd = duration(v.avd, "the average view duration");
      const goal = num(v.goal, "the goal", { allowZero: false });
      const hours = (views * avd) / 3600;
      const viewsForGoal = (goal * 3600) / avd;
      return finite({
        results: [{ label: "Watch time", value: `${fixed(hours, 1)} hours`, primary: true }, { label: "Progress to goal", value: pct(Math.min(100, (hours / goal) * 100), 1) }, { label: "Total views needed for goal", value: int(viewsForGoal) }],
        formula: "Watch hours = Views × Average view duration (s) ÷ 3,600",
      });
    },
  },
  "youtube-view-velocity": {
    fields: [field("views", "Views so far", "12500"), field("hours", "Hours since publishing", "36", { step: "0.1" })],
    compute(v) {
      const views = num(v.views, "views");
      const hours = num(v.hours, "hours", { allowZero: false });
      return finite({ results: [{ label: "Views per hour", value: fixed(views / hours, 1), primary: true }, { label: "Views per day (same pace)", value: int((views / hours) * 24) }, { label: "Projected after 7 days (same pace)", value: int((views / hours) * 168) }], formula: "Velocity = Views ÷ Hours since publishing" });
    },
  },
  "subscriber-conversion-rate": {
    fields: [field("subs", "Subscribers gained", "320"), field("views", "Views", "45000")],
    compute(v) {
      const subs = num(v.subs, "subscribers gained");
      const views = num(v.views, "views", { allowZero: false });
      return finite({ results: [{ label: "Conversion rate", value: pct((subs / views) * 100, 3), primary: true }, { label: "Views per new subscriber", value: subs > 0 ? fixed(views / subs, 1) : "No subscribers gained" }], formula: "Rate = Subscribers gained ÷ Views × 100" });
    },
  },
  "subscriber-growth-projection": {
    fields: [field("current", "Current subscribers", "5000"), field("rate", "Monthly growth rate (%)", "8", { step: "0.1" }), field("months", "Months ahead", "12"), field("target", "Target subscribers (optional, 0 to skip)", "10000")],
    note: "Projection only: assumes the same growth rate every month.",
    compute(v) {
      const current = num(v.current, "current subscribers", { allowZero: false });
      const rate = num(v.rate, "the growth rate", { min: -100 }) / 100;
      const months = num(v.months, "months", { max: 600 });
      const target = num(v.target, "the target");
      const projected = current * (1 + rate) ** months;
      const rows = Array.from({ length: Math.min(Math.floor(months), 24) }, (_, i) => [String(i + 1), int(current * (1 + rate) ** (i + 1))]);
      const reach = target > current && rate > 0 ? Math.ceil(Math.log(target / current) / Math.log(1 + rate)) : null;
      return finite({
        results: [{ label: `Subscribers after ${fixed(months, 0)} months`, value: int(projected), primary: true }, ...(target > 0 ? [{ label: "Months to reach target", value: target <= current ? "Already reached" : reach === null ? "Not reached with this rate" : String(reach) }] : [])],
        formula: "Subscribers = Current × (1 + rate)^months",
        table: rows.length ? { head: ["Month", "Subscribers"], rows } : undefined,
      });
    },
  },
  "upload-schedule-calculator": {
    fields: [{ id: "start", label: "Start date", type: "date", default: "2026-01-05" }, field("perWeek", "Uploads per week", "2", { step: "0.5" }), field("count", "Number of videos", "24")],
    compute(v) {
      const start = new Date(`${v.start}T00:00:00Z`);
      if (Number.isNaN(start.getTime())) throw new Error("Pick a valid start date.");
      const perWeek = num(v.perWeek, "uploads per week", { allowZero: false, max: 50 });
      const count = num(v.count, "the number of videos", { min: 1, max: 1000 });
      const gapDays = 7 / perWeek;
      const dateOf = (i: number) => new Date(start.getTime() + Math.round(i * gapDays) * 86400000);
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", year: "numeric", month: "short", day: "numeric" });
      const total = Math.floor(count);
      const rows = Array.from({ length: Math.min(total, 52) }, (_, i) => [String(i + 1), fmt(dateOf(i))]);
      return {
        results: [{ label: "Last video publishes on", value: fmt(dateOf(total - 1)), primary: true }, { label: "Days between uploads", value: fixed(gapDays, 1) }, { label: "Weeks needed", value: fixed((total - 1) / perWeek, 1) }],
        table: { head: ["Video", "Publish date"], rows },
      };
    },
  },
};

const scriptOps: Record<string, CalcOp> = {
  "script-length-calculator": {
    fields: [{ id: "length", label: "Target video length (m:ss)", type: "text", default: "8:00" }, field("wpm", "Speaking pace (words per minute)", "150", { hint: "Time yourself reading a paragraph to find your own pace." }), field("talk", "Share of the video with voiceover (%)", "90")],
    compute(v) {
      const seconds = duration(v.length, "the video length");
      const wpm = num(v.wpm, "the pace", { min: 60, max: 300 });
      const talk = num(v.talk, "the voiceover share", { allowZero: false, max: 100 }) / 100;
      const total = (seconds / 60) * wpm * talk;
      return finite({ results: [{ label: "Words to write", value: int(total), primary: true }, { label: "Words per minute of video", value: int(wpm * talk) }], formula: "Words = Minutes × WPM × Voiceover share" });
    },
  },
};

const mediaOps: Record<string, CalcOp> = {
  "video-bitrate-file-size": {
    fields: [
      { id: "mode", label: "Calculate", type: "select", default: "size", choices: [["size", "File size from bitrate"], ["bitrate", "Bitrate from target file size"]] },
      { id: "length", label: "Duration (m:ss or h:mm:ss)", type: "text", default: "10:00" },
      field("video", "Video bitrate (kbps) — for file size", "8000"),
      field("audio", "Audio bitrate (kbps)", "192"),
      field("size", "Target file size (MB) — for bitrate", "500"),
    ],
    note: "Container overhead (usually a few percent) is not included. 1 MB = 1,000,000 bytes; 1 kbps = 1,000 bits per second.",
    compute(v) {
      const seconds = duration(v.length, "the duration");
      const audio = num(v.audio, "the audio bitrate");
      if (v.mode === "bitrate") {
        const sizeMb = num(v.size, "the target size", { allowZero: false });
        const totalKbps = (sizeMb * 8000) / seconds;
        const videoKbps = totalKbps - audio;
        if (videoKbps <= 0) throw new Error("The target size is too small for this duration and audio bitrate.");
        return finite({ results: [{ label: "Video bitrate", value: `${int(videoKbps)} kbps`, primary: true }, { label: "Total bitrate", value: `${int(totalKbps)} kbps (${fixed(totalKbps / 1000)} Mbps)` }], formula: "Bitrate (kbps) = Size (MB) × 8,000 ÷ Seconds − Audio kbps" });
      }
      const totalKbps = num(v.video, "the video bitrate") + audio;
      const mb = (totalKbps * seconds) / 8000;
      return finite({ results: [{ label: "Estimated file size", value: `${fixed(mb, 1)} MB`, primary: true }, { label: "In gigabytes", value: `${fixed(mb / 1000, 2)} GB` }, { label: "In mebibytes", value: `${fixed((mb * 1e6) / 1048576, 1)} MiB` }], formula: "Size (MB) = (Video kbps + Audio kbps) × Seconds ÷ 8,000" });
    },
  },
};

export const ops: Record<string, CalcOp> = { ...revenueOps, ...growthOps, ...scriptOps, ...mediaOps };
