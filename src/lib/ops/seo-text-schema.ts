// JSON-LD (schema.org) builders. Every value comes from the user; empty fields are left out.
import type { OptionField, OptionValues, TextOp } from "./types";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };
type Obj = { [key: string]: Json | undefined };

const text = (id: string, label: string, def = "", hint?: string): OptionField => ({ id, label, type: "text", default: def, ...(hint ? { hint } : {}) });
const select = (id: string, label: string, choices: string[], def: string): OptionField => ({ id, label, type: "select", choices: choices.map(c => [c, c]), default: def });

const str = (o: OptionValues, id: string) => String(o[id] ?? "").trim();

function clean(value: Json | undefined): Json | undefined {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((v): v is Json => v !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => [k, clean(v)] as const).filter(([, v]) => v !== undefined);
    const meaningful = entries.filter(([k]) => k !== "@type");
    return meaningful.length ? Object.fromEntries(entries) : undefined;
  }
  return value === "" || value === undefined ? undefined : value;
}

export function jsonLdScript(data: Obj): string {
  const body = JSON.stringify(clean({ "@context": "https://schema.org", ...data }), null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${body}\n</script>`;
}

function url(value: string, label: string): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad");
    return parsed.href;
  } catch { throw new Error(`${label} must be a full URL starting with https:// (got "${value}").`); }
}

function date(value: string, label: string): string {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value) || Number.isNaN(Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value))) {
    throw new Error(`${label} must be an ISO 8601 date such as 2026-03-15 or 2026-03-15T19:00:00-05:00.`);
  }
  return value;
}

function price(value: string): string {
  if (!value) return "";
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error("Price must be a number like 19.99 (no currency symbol).");
  return value;
}

/** "3:45" or "1:02:03" → ISO 8601 duration "PT3M45S". Also accepts minutes like "45". */
export function isoDuration(value: string, label: string): string {
  if (!value) return "";
  if (/^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/.test(value) && value !== "PT") return value;
  const parts = value.split(":").map(Number);
  if (!/^\d+(?::\d{1,2}){0,2}$/.test(value) || parts.slice(1).some(p => p >= 60)) throw new Error(`${label}: use m:ss, h:mm:ss, minutes, or an ISO duration like PT1H30M.`);
  const seconds = parts.length === 1 ? parts[0] * 60 : parts.reduce((t, p) => t * 60 + p, 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s || (!h && !m) ? `${s}S` : ""}`;
}

const lines = (input: string) => input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const list = (value: string) => value.split(/[,\n]/).map(v => v.trim()).filter(Boolean);

function address(o: OptionValues): Obj {
  return { "@type": "PostalAddress", streetAddress: str(o, "street"), addressLocality: str(o, "city"), addressRegion: str(o, "region"), postalCode: str(o, "postal"), addressCountry: str(o, "country") };
}

const addressFields: OptionField[] = [
  text("street", "Street address", "123 Main Street"), text("city", "City", "Springfield"), text("region", "State or region", "IL"),
  text("postal", "Postal code", "62701"), text("country", "Country code", "US", "Two-letter ISO code, e.g. US, GB, PK"),
];

const DAYS: Record<string, string> = { mo: "Monday", tu: "Tuesday", we: "Wednesday", th: "Thursday", fr: "Friday", sa: "Saturday", su: "Sunday" };
const DAY_KEYS = Object.keys(DAYS);

function openingHours(input: string): Obj[] {
  return lines(input).map(line => {
    const m = /^([a-z]{2})(?:\s*-\s*([a-z]{2}))?\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/i.exec(line);
    if (!m) throw new Error(`Write opening hours like "Mo-Fr 09:00-17:00" or "Sa 10:00-14:00" (problem: "${line}").`);
    const from = DAY_KEYS.indexOf(m[1].toLowerCase());
    const to = m[2] ? DAY_KEYS.indexOf(m[2].toLowerCase()) : from;
    if (from < 0 || to < 0 || to < from) throw new Error(`Unknown day range in "${line}". Use Mo Tu We Th Fr Sa Su.`);
    return { "@type": "OpeningHoursSpecification", dayOfWeek: DAY_KEYS.slice(from, to + 1).map(k => DAYS[k]), opens: m[3], closes: m[4] };
  });
}

function pairs(input: string, separator: RegExp, label: string): Array<[string, string]> {
  return lines(input).map(line => {
    const [a, ...rest] = line.split(separator);
    const b = rest.join(" ").trim();
    if (!a?.trim() || !b) throw new Error(`Each line needs ${label} (problem: "${line}").`);
    return [a.trim(), b];
  });
}

function faqPairs(input: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  let q = "";
  for (const line of lines(input)) {
    const qm = /^q(?:uestion)?\s*[:.)-]\s*(.+)$/i.exec(line);
    const am = /^a(?:nswer)?\s*[:.)-]\s*(.+)$/i.exec(line);
    if (qm) q = qm[1];
    else if (am && q) { out.push([q, am[1]]); q = ""; }
    else if (am) throw new Error(`Answer without a question: "${line}".`);
    else if (out.length && !q) out[out.length - 1] = [out[out.length - 1][0], `${out[out.length - 1][1]} ${line}`];
    else throw new Error(`Start each line with "Q:" or "A:" (problem: "${line}").`);
  }
  if (q) throw new Error(`The question "${q}" has no answer.`);
  if (out.length === 0) throw new Error("Add at least one Q: line followed by an A: line.");
  return out;
}

const generator = (options: OptionField[], build: (o: OptionValues) => Obj, note?: string): TextOp => ({
  input: false, options, outputLabel: "JSON-LD script tag", outputExt: "html", ...(note ? { note } : {}), run: (_, o) => jsonLdScript(build(o)),
});

const NOTE = "Replace the sample values with your own. Test the result with Google's Rich Results Test before publishing.";

export const schemaOps: Record<string, TextOp> = {
  "jsonld-article": generator([
    select("type", "Article type", ["Article", "BlogPosting", "NewsArticle"], "BlogPosting"),
    text("headline", "Headline", "How to Trim a Video in Your Browser"), text("description", "Description", "A step-by-step guide to trimming video files without uploading them."),
    text("image", "Image URL", "https://example.com/images/trim-guide.jpg"), text("author", "Author name", "Jane Doe"), text("authorUrl", "Author page URL", "https://example.com/about/jane"),
    text("published", "Date published (YYYY-MM-DD)", "2026-03-15"), text("modified", "Date modified (optional)", ""), text("publisher", "Publisher name", "Example Media"), text("logo", "Publisher logo URL", "https://example.com/logo.png"),
    text("url", "Article URL", "https://example.com/blog/trim-video"),
  ], o => ({
    "@type": str(o, "type"), headline: str(o, "headline"), description: str(o, "description"), image: url(str(o, "image"), "Image URL"),
    author: { "@type": "Person", name: str(o, "author"), url: url(str(o, "authorUrl"), "Author page URL") },
    datePublished: date(str(o, "published"), "Date published"), dateModified: date(str(o, "modified"), "Date modified"),
    publisher: { "@type": "Organization", name: str(o, "publisher"), logo: { "@type": "ImageObject", url: url(str(o, "logo"), "Logo URL") } },
    mainEntityOfPage: url(str(o, "url"), "Article URL"),
  }), NOTE),
  "jsonld-faq": {
    input: { label: "Questions and answers (Q: and A: lines)", example: "Q: Are my files uploaded?\nA: No. Everything runs in your browser.\nQ: Is it free?\nA: Yes, all tools are free to use.", rows: 10 },
    outputLabel: "FAQPage JSON-LD", outputExt: "html",
    note: "Only mark up questions and answers that are visible on the page.",
    run: input => jsonLdScript({ "@type": "FAQPage", mainEntity: faqPairs(input).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }),
  },
  "jsonld-product": generator([
    text("name", "Product name", "Example Wireless Mouse"), text("description", "Description", "A quiet two-button wireless mouse."), text("image", "Image URL", "https://example.com/images/mouse.jpg"),
    text("brand", "Brand", "ExampleBrand"), text("sku", "SKU", "EX-MOUSE-01"), text("gtin", "GTIN / barcode (optional)", ""),
    text("price", "Price", "24.99"), text("currency", "Currency (ISO code)", "USD"),
    select("availability", "Availability", ["InStock", "OutOfStock", "PreOrder", "BackOrder", "Discontinued", "LimitedAvailability"], "InStock"),
    select("condition", "Condition", ["NewCondition", "UsedCondition", "RefurbishedCondition"], "NewCondition"), text("url", "Product page URL", "https://example.com/products/mouse"),
  ], o => ({
    "@type": "Product", name: str(o, "name"), description: str(o, "description"), image: url(str(o, "image"), "Image URL"), brand: { "@type": "Brand", name: str(o, "brand") }, sku: str(o, "sku"), gtin: str(o, "gtin"),
    offers: { "@type": "Offer", url: url(str(o, "url"), "Product URL"), price: price(str(o, "price")), priceCurrency: str(o, "currency").toUpperCase(), availability: `https://schema.org/${str(o, "availability")}`, itemCondition: `https://schema.org/${str(o, "condition")}` },
  }), "Ratings and reviews are left out on purpose: only add them when they come from real customers."),
  "jsonld-howto": {
    input: { label: "Steps (one per line)", example: "Open the video trimmer page.\nDrop your video file onto the page.\nDrag the handles to choose the part to keep.\nPress Export and save the new file.", rows: 8 },
    options: [text("name", "How-to title", "How to trim a video in your browser"), text("description", "Description", "Cut the start and end of a clip without uploading it."), text("time", "Total time (m:ss or minutes, optional)", "5"), text("tools", "Tools needed (comma separated, optional)", "A modern web browser")],
    outputLabel: "HowTo JSON-LD", outputExt: "html",
    run(input, o) {
      const steps = lines(input);
      if (steps.length === 0) throw new Error("Add at least one step.");
      return jsonLdScript({
        "@type": "HowTo", name: str(o, "name"), description: str(o, "description"), totalTime: isoDuration(str(o, "time"), "Total time"),
        tool: list(str(o, "tools")).map(name => ({ "@type": "HowToTool", name })),
        step: steps.map((step, i) => ({ "@type": "HowToStep", position: i + 1, text: step })),
      });
    },
  },
  "jsonld-local-business": {
    input: { label: "Opening hours (one range per line)", example: "Mo-Fr 09:00-18:00\nSa 10:00-14:00", rows: 4 },
    options: [
      select("type", "Business type", ["LocalBusiness", "Restaurant", "CafeOrCoffeeShop", "Store", "AutoRepair", "BeautySalon", "Dentist", "MedicalClinic", "LegalService", "RealEstateAgent", "HomeAndConstructionBusiness", "ProfessionalService"], "LocalBusiness"),
      text("name", "Business name", "Example Coffee House"), text("url", "Website", "https://example.com"), text("phone", "Phone", "+1-217-555-0100"), text("image", "Photo URL", "https://example.com/storefront.jpg"),
      ...addressFields, text("lat", "Latitude (optional)", ""), text("lng", "Longitude (optional)", ""), text("priceRange", "Price range (optional, e.g. $$)", ""),
    ],
    outputLabel: "LocalBusiness JSON-LD", outputExt: "html",
    note: "Opening hours use two-letter days: Mo Tu We Th Fr Sa Su.",
    run(input, o) {
      const lat = str(o, "lat");
      const lng = str(o, "lng");
      if ((lat || lng) && !(Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && lat && lng)) throw new Error("Enter both latitude and longitude as numbers, or leave both empty.");
      return jsonLdScript({
        "@type": str(o, "type"), name: str(o, "name"), url: url(str(o, "url"), "Website"), telephone: str(o, "phone"), image: url(str(o, "image"), "Photo URL"), priceRange: str(o, "priceRange"),
        address: address(o), geo: lat ? { "@type": "GeoCoordinates", latitude: Number(lat), longitude: Number(lng) } : undefined,
        openingHoursSpecification: input.trim() ? openingHours(input) : undefined,
      });
    },
  },
  "jsonld-software-app": generator([
    text("name", "App name", "Example Notes"), select("category", "Category", ["BusinessApplication", "DeveloperApplication", "DesignApplication", "EducationalApplication", "GameApplication", "MultimediaApplication", "UtilitiesApplication", "LifestyleApplication", "FinanceApplication", "HealthApplication"], "UtilitiesApplication"),
    text("os", "Operating systems", "Windows, macOS, Web"), text("price", "Price (0 for free)", "0"), text("currency", "Currency", "USD"), text("url", "App page URL", "https://example.com/app"), text("description", "Description", "A simple note-taking app."),
  ], o => ({ "@type": "SoftwareApplication", name: str(o, "name"), applicationCategory: str(o, "category"), operatingSystem: str(o, "os"), description: str(o, "description"), url: url(str(o, "url"), "App URL"), offers: { "@type": "Offer", price: price(str(o, "price")), priceCurrency: str(o, "currency").toUpperCase() } }), NOTE),
  "jsonld-breadcrumb": {
    input: { label: "Breadcrumb trail (Name | URL, one per line, top level first)", example: "Home | https://example.com/\nTools | https://example.com/tools/\nVideo Trimmer | https://example.com/tools/video-trimmer", rows: 6 },
    outputLabel: "BreadcrumbList JSON-LD", outputExt: "html",
    run: input => jsonLdScript({ "@type": "BreadcrumbList", itemListElement: pairs(input, /\s*\|\s*/, "a name and a URL separated by |").map(([name, link], i) => ({ "@type": "ListItem", position: i + 1, name, item: url(link, `URL for "${name}"`) })) }),
  },
  "jsonld-organization": {
    input: { label: "Profile links (sameAs), one per line", example: "https://www.linkedin.com/company/example\nhttps://www.youtube.com/@example", rows: 4 },
    options: [text("name", "Organization name", "Example Inc."), text("url", "Website", "https://example.com"), text("logo", "Logo URL", "https://example.com/logo.png"), text("email", "Contact email (optional)", ""), text("phone", "Contact phone (optional)", ""), text("description", "Description (optional)", "")],
    outputLabel: "Organization JSON-LD", outputExt: "html",
    run: (input, o) => jsonLdScript({
      "@type": "Organization", name: str(o, "name"), url: url(str(o, "url"), "Website"), logo: url(str(o, "logo"), "Logo URL"), description: str(o, "description"), email: str(o, "email"), telephone: str(o, "phone"),
      sameAs: lines(input).map(l => url(l, "Profile link")),
    }),
  },
  "jsonld-person": {
    input: { label: "Profile links (sameAs), one per line", example: "https://www.linkedin.com/in/example\nhttps://github.com/example", rows: 4 },
    options: [text("name", "Full name", "Jane Doe"), text("job", "Job title", "Video Editor"), text("worksFor", "Works for (optional)", ""), text("url", "Personal website", "https://example.com"), text("image", "Photo URL (optional)", "")],
    outputLabel: "Person JSON-LD", outputExt: "html",
    run: (input, o) => jsonLdScript({
      "@type": "Person", name: str(o, "name"), jobTitle: str(o, "job"), worksFor: str(o, "worksFor") ? { "@type": "Organization", name: str(o, "worksFor") } : undefined,
      url: url(str(o, "url"), "Website"), image: url(str(o, "image"), "Photo URL"), sameAs: lines(input).map(l => url(l, "Profile link")),
    }),
  },
  "jsonld-website": generator([
    text("name", "Site name", "Example Tools"), text("url", "Home page URL", "https://example.com/"),
    text("search", "Site search URL with {search_term_string} (optional)", "https://example.com/search?q={search_term_string}"),
  ], o => {
    const search = str(o, "search");
    if (search && !search.includes("{search_term_string}")) throw new Error("The search URL must contain {search_term_string} where the query goes.");
    return { "@type": "WebSite", name: str(o, "name"), url: url(str(o, "url"), "Home page URL"), potentialAction: search ? { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: search }, "query-input": "required name=search_term_string" } : undefined };
  }),
  "jsonld-event": generator([
    text("name", "Event name", "Browser Video Editing Workshop"), text("start", "Start (YYYY-MM-DDTHH:MM with offset)", "2026-06-10T18:00:00-05:00"), text("end", "End (optional)", "2026-06-10T20:00:00-05:00"),
    select("mode", "Attendance", ["OfflineEventAttendanceMode", "OnlineEventAttendanceMode", "MixedEventAttendanceMode"], "OfflineEventAttendanceMode"),
    select("status", "Status", ["EventScheduled", "EventPostponed", "EventRescheduled", "EventMovedOnline", "EventCancelled"], "EventScheduled"),
    text("venue", "Venue name (in person)", "Springfield Library"), ...addressFields, text("online", "Online event URL (online/mixed)", ""),
    text("organizer", "Organizer name", "Example Media"), text("description", "Description", "A hands-on evening workshop."), text("image", "Image URL (optional)", ""),
  ], o => {
    const online = o.mode !== "OfflineEventAttendanceMode";
    const place = str(o, "venue") ? { "@type": "Place", name: str(o, "venue"), address: address(o) } : undefined;
    const virtual = online ? { "@type": "VirtualLocation", url: url(str(o, "online"), "Online event URL") } : undefined;
    if (online && !str(o, "online")) throw new Error("Online and mixed events need an online event URL.");
    return {
      "@type": "Event", name: str(o, "name"), description: str(o, "description"), image: url(str(o, "image"), "Image URL"), startDate: date(str(o, "start"), "Start"), endDate: date(str(o, "end"), "End"),
      eventAttendanceMode: `https://schema.org/${str(o, "mode")}`, eventStatus: `https://schema.org/${str(o, "status")}`,
      location: o.mode === "MixedEventAttendanceMode" ? [place, virtual].filter((x): x is NonNullable<typeof x> => Boolean(x)) : online ? virtual : place,
      organizer: { "@type": "Organization", name: str(o, "organizer") },
    };
  }, NOTE),
  "jsonld-recipe": {
    input: { label: "Ingredients (one per line)", example: "2 cups all-purpose flour\n1 cup sugar\n2 eggs\n1 cup milk", rows: 6 },
    second: { label: "Instructions (one step per line)", example: "Preheat the oven to 350°F (175°C).\nMix the dry ingredients.\nWhisk in the eggs and milk.\nBake for 30 minutes." },
    options: [text("name", "Recipe name", "Simple Vanilla Cake"), text("author", "Author", "Jane Doe"), text("image", "Image URL", "https://example.com/cake.jpg"), text("prep", "Prep time (minutes or h:mm:ss)", "15"), text("cook", "Cook time", "30"), text("yield", "Yield", "8 servings"), text("category", "Category (optional)", "Dessert"), text("cuisine", "Cuisine (optional)", "")],
    outputLabel: "Recipe JSON-LD", outputExt: "html",
    run(input, o, second) {
      const ingredients = lines(input);
      const steps = lines(second ?? "");
      if (ingredients.length === 0 || steps.length === 0) throw new Error("Add at least one ingredient and one instruction.");
      return jsonLdScript({
        "@type": "Recipe", name: str(o, "name"), author: { "@type": "Person", name: str(o, "author") }, image: url(str(o, "image"), "Image URL"),
        prepTime: isoDuration(str(o, "prep"), "Prep time"), cookTime: isoDuration(str(o, "cook"), "Cook time"), recipeYield: str(o, "yield"), recipeCategory: str(o, "category"), recipeCuisine: str(o, "cuisine"),
        recipeIngredient: ingredients, recipeInstructions: steps.map(step => ({ "@type": "HowToStep", text: step })),
      });
    },
  },
  "jsonld-video": generator([
    text("name", "Video title", "How to Trim a Video in Your Browser"), text("description", "Description", "A two-minute walkthrough of the browser video trimmer."),
    text("thumb", "Thumbnail URL", "https://example.com/thumbs/trim.jpg"), text("upload", "Upload date (YYYY-MM-DD or with time and offset)", "2026-03-15"),
    text("duration", "Duration (m:ss)", "2:05"), text("content", "Video file URL (optional)", ""), text("embed", "Embed URL (optional)", "https://www.youtube.com/embed/dQw4w9WgXcQ"),
  ], o => ({
    "@type": "VideoObject", name: str(o, "name"), description: str(o, "description"), thumbnailUrl: url(str(o, "thumb"), "Thumbnail URL"), uploadDate: date(str(o, "upload"), "Upload date"),
    duration: str(o, "duration").includes(":") || str(o, "duration").startsWith("PT") ? isoDuration(str(o, "duration"), "Duration") : isoDuration(str(o, "duration") ? `0:${str(o, "duration")}` : "", "Duration"),
    contentUrl: url(str(o, "content"), "Video file URL"), embedUrl: url(str(o, "embed"), "Embed URL"),
  }), NOTE),
};
