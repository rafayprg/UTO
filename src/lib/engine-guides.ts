import type { GuideSection } from "./guides";
import { toolGuides } from "./guides";
import type { LegacyComponentKey, ToolDefinition } from "./tools-registry";

type Faq = { q: string; a: string };

const DEFAULT_COPY = {
  how: "Enter or adjust your parameters in the workspace above. Results calculate in real time directly within your browser window.",
  check: "Review calculated outputs, amortization schedules, and generated documents. Use results for planning and confirm binding financial, legal, or tax decisions with certified specialists.",
  privacy: "All computations run 100% inside your browser using client-side JavaScript. No sensitive numbers or confidential files are ever uploaded to any server.",
};

const ENGINE_COPY: Record<string, { how: string; check: string; privacy: string }> = {
  "text-engine": {
    how: "Paste or type your input, or open a text file from your device. Results update as you type for quick operations; heavier or random operations run when you press the button. Use Load example to see the expected input format before you paste your own.",
    check: "Compare the result with a small sample you understand before processing something important. Text transformations are exact for the rules they implement, but they do not guess what you meant: malformed input produces an error message instead of a silently repaired result.",
    privacy: "The text stays in this tab. Nothing you type is sent to a server, saved to an account, or kept after you close or reload the page, so copy or download the result first.",
  },
  "calc-engine": {
    how: "Enter your values in the fields. Results recalculate instantly, and the formula used is shown under the results so you can follow the arithmetic yourself.",
    check: "Calculators use standard formulas and JavaScript floating-point numbers. Results are estimates for planning and learning; confirm figures that matter for money, health, or legal decisions with a qualified professional or an official source.",
    privacy: "Your numbers are calculated in your browser. No values are stored or sent anywhere.",
  },
  "image-engine": {
    how: "Choose an image from your device, adjust the options, then press Process. The result appears with a preview and a download button. Your original file is never changed.",
    check: "Inspect the preview at full size before using it. Re-encoding can change colours, remove transparency in formats that do not support it, and drop camera metadata.",
    privacy: "Images are decoded and processed with your browser's Canvas API on your own device. They are not uploaded.",
  },
  "pdf-engine": {
    how: "Choose your PDF (or images or text, depending on the tool), set the options, then press Process. The new document downloads separately and your original file stays untouched.",
    check: "Open the downloaded PDF and check every page. Encrypted PDFs are not supported, and editing a document invalidates existing digital signatures.",
    privacy: "PDFs are processed in your browser with the open-source pdf-lib library. Files are not uploaded.",
  },
  "planned-tool": {
    how: "This page previews the workspace for a tool that is not live yet. The interface shows the inputs it will accept; the processing engine is added in a later phase.",
    check: "Until the tool goes live, use a related live tool from this suite, listed on this page.",
    privacy: "When it launches, this tool will follow the same rule as the rest of the site: processing happens in your browser.",
  },
};

export function toolGuideSections(tool: ToolDefinition): GuideSection[] {
  if (tool.componentKey in toolGuides) return toolGuides[tool.componentKey as LegacyComponentKey];
  const copy = ENGINE_COPY[tool.componentKey] || DEFAULT_COPY;
  const sections: GuideSection[] = [
    { heading: `What ${tool.title} does`, paragraphs: [`${tool.shortDesc} It is part of the ${tool.group} group in this suite.`] },
  ];
  if (tool.formulaExplanation) {
    sections.push({
      heading: "Calculation logic & formula",
      paragraphs: [tool.formulaExplanation],
    });
  }
  sections.push(
    { heading: "How to use it", paragraphs: [copy.how] },
    { heading: "Check the result", paragraphs: [copy.check] },
    { heading: "Privacy", paragraphs: [copy.privacy] }
  );
  return sections;
}

export function toolFaq(tool: ToolDefinition): Faq[] {
  if (tool.faqs && tool.faqs.length > 0) {
    return tool.faqs.map(f => ({ q: f.question, a: f.answer }));
  }
  if (tool.faq && tool.faq.length > 0) return tool.faq;
  if (tool.status === "planned") return [
    { q: `Can I use ${tool.title} now?`, a: "Not yet. This page shows the planned workspace; the processing engine is added in a later phase." },
    { q: "Will my files be uploaded when it launches?", a: "No. Like the live tools, it will process files in your browser." },
    { q: "Is there a working alternative today?", a: "Check the related tools listed on this page for a live option in the same suite." },
  ];
  const copy = ENGINE_COPY[tool.componentKey] || DEFAULT_COPY;
  return [
    { q: "Is my data uploaded?", a: copy.privacy },
    { q: "Do I need an account?", a: "No. The tool is free and works without signing up." },
    { q: "How accurate is the result?", a: copy.check },
  ];
}
