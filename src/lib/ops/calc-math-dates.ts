import type { CalcOp } from "./types";
import { dateField, field, fmt, num, select } from "./calc-math-core.ts";

const DAY = 86400000;
const TODAY_HINT = "Leave empty for today.";
const MAX_SPAN_DAYS = 366 * 200;

/** "YYYY-MM-DD" to a UTC-midnight timestamp; empty means today (local calendar date). */
export function parseDate(value: string | undefined, label: string, emptyIsToday = false): number {
  const text = String(value ?? "").trim();
  if (text === "" && emptyIsToday) {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) throw new Error(`Choose a date for ${label}.`);
  const [y, m, d] = match.slice(1).map(Number);
  const ms = Date.UTC(y, m - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) throw new Error(`${text} is not a real calendar date.`);
  return ms;
}

export const dateText = (ms: number) => new Date(ms).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" });
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

/** Adds calendar months, clamping to the last day of the month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(ms: number, months: number): number {
  const date = new Date(ms);
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const [year, month] = [Math.floor(total / 12), ((total % 12) + 12) % 12];
  return Date.UTC(year, month, Math.min(date.getUTCDate(), daysInMonth(year, month)));
}

/** Calendar difference in years, months and days (start ≤ end). */
export function diffYmd(start: number, end: number): { years: number; months: number; days: number } {
  const [a, b] = [new Date(start), new Date(end)];
  let years = b.getUTCFullYear() - a.getUTCFullYear();
  let months = b.getUTCMonth() - a.getUTCMonth();
  let days = b.getUTCDate() - a.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0));
    days += prev.getUTCDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days };
}

const ymdText = ({ years, months, days }: { years: number; months: number; days: number }) => `${years} year${years === 1 ? "" : "s"}, ${months} month${months === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"}`;
const isWeekday = (ms: number) => { const day = new Date(ms).getUTCDay(); return day !== 0 && day !== 6; };

/** Monday–Friday count between two dates, both included. */
export function businessDays(start: number, end: number): number {
  const [from, to] = start <= end ? [start, end] : [end, start];
  if ((to - from) / DAY > MAX_SPAN_DAYS) throw new Error("Use a range of 200 years or less.");
  let count = 0;
  for (let ms = from; ms <= to; ms += DAY) if (isWeekday(ms)) count += 1;
  return count;
}

export function addBusinessDays(start: number, amount: number): number {
  const step = amount < 0 ? -DAY : DAY;
  let ms = start;
  let left = Math.abs(amount);
  while (left > 0) { ms += step; if (isWeekday(ms)) left -= 1; }
  return ms;
}

/** UTC offset of an IANA time zone at an instant, in minutes (east of UTC is positive). */
export function zoneOffset(zone: string, ms: number): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  } catch {
    throw new Error(`“${zone}” is not a time zone this browser knows.`);
  }
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const local = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((local - ms) / 60000);
}

const ZONES: Array<[string, string]> = [
  "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "America/Toronto", "America/Mexico_City", "America/Sao_Paulo",
  "UTC", "Europe/London", "Europe/Lisbon", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Istanbul", "Europe/Moscow", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg",
  "Asia/Dubai", "Asia/Riyadh", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok", "Asia/Jakarta", "Asia/Singapore", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Manila", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Perth", "Australia/Sydney", "Pacific/Auckland",
].map((zone): [string, string] => [zone, zone.replace(/_/g, " ")]);

const clock = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
const offsetText = (minutes: number) => `UTC${minutes < 0 ? "−" : "+"}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, "0")}:${String(Math.abs(minutes) % 60).padStart(2, "0")}`;

function workWindow(v: Record<string, string>, key: "a" | "b") {
  const start = num(v[`${key}Start`], "the start hour", { min: 0, max: 24 });
  const end = num(v[`${key}End`], "the end hour", { min: 0, max: 24 });
  if (end <= start) throw new Error("Each end hour must be later than its start hour (use 0–24, e.g. 9 to 17).");
  return [start * 60, end * 60];
}

export const dateOps: Record<string, CalcOp> = {
  age: {
    fields: [dateField("birth", "Date of birth", "1990-06-15"), dateField("asOf", "Age on this date", "", TODAY_HINT)],
    compute(v) {
      const birth = parseDate(v.birth, "the date of birth");
      const asOf = parseDate(v.asOf, "the age date", true);
      if (birth > asOf) throw new Error("The date of birth must be on or before the age date.");
      const age = diffYmd(birth, asOf);
      let next = addMonths(birth, (age.years + 1) * 12);
      if (age.months === 0 && age.days === 0) next = asOf;
      const totalDays = Math.round((asOf - birth) / DAY);
      return {
        results: [
          { label: "Age", value: ymdText(age), primary: true },
          { label: "Total months", value: (age.years * 12 + age.months).toLocaleString("en-US") },
          { label: "Total weeks", value: `${Math.floor(totalDays / 7).toLocaleString("en-US")} weeks, ${totalDays % 7} days` },
          { label: "Total days", value: totalDays.toLocaleString("en-US") },
          { label: "Next birthday", value: next === asOf ? "Today" : `${dateText(next)} (in ${Math.round((next - asOf) / DAY)} days)` },
        ],
      };
    },
  },
  "date-difference": {
    fields: [dateField("start", "Start date", "2026-01-01"), dateField("end", "End date", "2026-12-31"), select("include", "Count the end date too", "no", [["no", "No (difference only)"], ["yes", "Yes (add 1 day)"]])],
    compute(v) {
      const a = parseDate(v.start, "the start date");
      const b = parseDate(v.end, "the end date");
      const [from, to] = a <= b ? [a, b] : [b, a];
      const days = Math.round((to - from) / DAY) + (v.include === "yes" ? 1 : 0);
      return {
        results: [
          { label: "Days between", value: days.toLocaleString("en-US"), primary: true },
          { label: "Weeks and days", value: `${Math.floor(days / 7)} weeks, ${days % 7} days` },
          { label: "Years, months, days", value: ymdText(diffYmd(from, to + (v.include === "yes" ? DAY : 0))) },
          { label: "Hours", value: (days * 24).toLocaleString("en-US") },
        ],
      };
    },
  },
  "business-days": {
    fields: [dateField("start", "Start date", "2026-11-02"), dateField("end", "End date", "2026-11-30")],
    note: "Counts Monday to Friday with both dates included. Public holidays are not included, so subtract any that fall in the range.",
    compute(v) {
      const a = parseDate(v.start, "the start date");
      const b = parseDate(v.end, "the end date");
      const work = businessDays(a, b);
      const total = Math.round(Math.abs(b - a) / DAY) + 1;
      return { results: [{ label: "Business days (Mon–Fri)", value: work.toLocaleString("en-US"), primary: true }, { label: "Weekend days", value: (total - work).toLocaleString("en-US") }, { label: "Total calendar days", value: total.toLocaleString("en-US") }] };
    },
  },
  "add-days": {
    fields: [
      dateField("start", "Start date", "2026-11-19"),
      select("op", "Operation", "add", [["add", "Add"], ["subtract", "Subtract"]]),
      field("amount", "Amount", "90", { step: "1" }),
      select("unit", "Unit", "days", [["days", "Days"], ["weeks", "Weeks"], ["months", "Months"], ["years", "Years"], ["business", "Business days (Mon–Fri)"]]),
    ],
    note: "Months and years clamp to the end of the month (Jan 31 + 1 month = Feb 28 or 29). Business days skip weekends but not holidays.",
    compute(v) {
      const start = parseDate(v.start, "the start date");
      const amount = num(v.amount, "the amount", { min: 0, max: 100000, integer: true }) * (v.op === "subtract" ? -1 : 1);
      const result = v.unit === "months" ? addMonths(start, amount)
        : v.unit === "years" ? addMonths(start, amount * 12)
        : v.unit === "business" ? addBusinessDays(start, amount)
        : start + amount * (v.unit === "weeks" ? 7 : 1) * DAY;
      if (!Number.isFinite(result) || Math.abs(result) > 8.64e15) throw new Error("That date is out of range.");
      return { results: [{ label: "Result date", value: dateText(result), primary: true }, { label: "ISO format", value: new Date(result).toISOString().slice(0, 10) }, { label: "Calendar days from start", value: Math.round((result - start) / DAY).toLocaleString("en-US") }] };
    },
  },
  "timezone-overlap": {
    fields: [
      select("zoneA", "Time zone A", "America/New_York", ZONES),
      field("aStart", "A: workday starts (hour, 0–24)", "9", { step: "0.5" }),
      field("aEnd", "A: workday ends (hour)", "17", { step: "0.5" }),
      select("zoneB", "Time zone B", "Europe/London", ZONES),
      field("bStart", "B: workday starts (hour, 0–24)", "9", { step: "0.5" }),
      field("bEnd", "B: workday ends (hour)", "17", { step: "0.5" }),
      dateField("date", "Date", "", "Leave empty for today. Daylight saving time depends on the date."),
    ],
    note: "UTC offsets come from your browser's time zone database for the chosen date.",
    compute(v) {
      const day = parseDate(v.date, "the date", true);
      const noon = day + DAY / 2;
      const [offA, offB] = [zoneOffset(v.zoneA, noon), zoneOffset(v.zoneB, noon)];
      const [aFrom, aTo] = workWindow(v, "a").map(m => m - offA);
      const [bFrom, bTo] = workWindow(v, "b").map(m => m - offB);
      const best = [-1440, 0, 1440].map(shift => [Math.max(aFrom, bFrom + shift), Math.min(aTo, bTo + shift)]).reduce((top, pair) => (pair[1] - pair[0] > top[1] - top[0] ? pair : top));
      const minutes = Math.max(0, best[1] - best[0]);
      const diff = offB - offA;
      return {
        results: [
          { label: "Overlap", value: minutes > 0 ? `${fmt(minutes / 60, 3)} hours` : "No overlap", primary: true },
          { label: `In ${v.zoneA}`, value: minutes > 0 ? `${clock(best[0] + offA)}–${clock(best[1] + offA)}` : "—" },
          { label: `In ${v.zoneB}`, value: minutes > 0 ? `${clock(best[0] + offB)}–${clock(best[1] + offB)}` : "—" },
          { label: "UTC offsets", value: `${offsetText(offA)} / ${offsetText(offB)}` },
          { label: "B compared with A", value: diff === 0 ? "Same time" : `${fmt(Math.abs(diff) / 60, 3)} hours ${diff > 0 ? "ahead" : "behind"}` },
        ],
      };
    },
  },
};
