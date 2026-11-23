"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, Link2, BookMarked } from "lucide-react";

interface CiteWidgetProps {
  title: string;
  url: string;
  authorName?: string;
  publishedYear?: string;
}

export function CiteWidget({
  title,
  url,
  authorName = "LocalTools Editorial Board",
  publishedYear = "2026",
}: CiteWidgetProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const markdownLink = `[${title}](${url})`;
  const htmlLink = `<a href="${url}" target="_blank" rel="noopener">${title}</a>`;
  const apaCitation = `${authorName}. (${publishedYear}). ${title}. LocalTools. Retrieved from ${url}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <aside className="cite-widget-card not-prose" aria-label="Citation and Link Resource">
      <div className="cite-widget-header">
        <div className="cite-widget-title-group">
          <BookMarked size={18} className="text-primary" />
          <h3 className="cite-widget-heading">Cite, Reference or Link to this Resource</h3>
        </div>
        <span className="cite-widget-badge">Free to Reference</span>
      </div>
      <p className="cite-widget-desc">
        Referencing this guide or calculator in an article, documentation, or syllabus? Copy a pre-formatted link or citation:
      </p>

      <div className="cite-options-grid">
        <div className="cite-option-row">
          <div className="cite-option-label">
            <Link2 size={13} />
            <span>Markdown (for GitHub, Reddit, Obsidian)</span>
          </div>
          <div className="cite-code-action">
            <code className="cite-code-preview">{markdownLink}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(markdownLink, "md")}
              className="cite-copy-btn"
              title="Copy Markdown Link"
            >
              {copiedType === "md" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedType === "md" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="cite-option-row">
          <div className="cite-option-label">
            <Share2 size={13} />
            <span>HTML Embed (for WordPress, Medium, Blogs)</span>
          </div>
          <div className="cite-code-action">
            <code className="cite-code-preview">{htmlLink}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(htmlLink, "html")}
              className="cite-copy-btn"
              title="Copy HTML Link"
            >
              {copiedType === "html" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedType === "html" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="cite-option-row">
          <div className="cite-option-label">
            <BookMarked size={13} />
            <span>Academic Citation (APA Style)</span>
          </div>
          <div className="cite-code-action">
            <code className="cite-code-preview">{apaCitation}</code>
            <button
              type="button"
              onClick={() => copyToClipboard(apaCitation, "apa")}
              className="cite-copy-btn"
              title="Copy APA Citation"
            >
              {copiedType === "apa" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedType === "apa" ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
