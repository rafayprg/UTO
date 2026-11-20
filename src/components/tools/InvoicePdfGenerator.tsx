"use client";

import React, { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Download, Plus, Trash2 } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export default function InvoicePdfGenerator() {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-001");
  const [currency, setCurrency] = useState("USD ($)");
  const [senderName, setSenderName] = useState("Jane Doe Design LLC");
  const [senderEmail, setSenderEmail] = useState("billing@janedoe.com");
  const [clientName, setClientName] = useState("Acme Corporation");
  const [clientAddress, setClientAddress] = useState("100 Innovation Way, Suite 400");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [taxRate, setTaxRate] = useState(0);

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "Frontend Next.js Architecture & Implementation", quantity: 40, rate: 125 },
    { id: "2", description: "Design System & UI Components", quantity: 20, rate: 110 },
  ]);

  const [generating, setGenerating] = useState(false);

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), description: "New Service / Deliverable", quantity: 1, rate: 100 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, val: string | number) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const symbol = currency.includes("£") ? "£" : currency.includes("€") ? "€" : "$";

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const doc = await PDFDocument.create();
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

      const page = doc.addPage([595.28, 841.89]); // A4 portrait
      const { width, height } = page.getSize();

      // Top Banner
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width,
        height: 80,
        color: rgb(0.12, 0.28, 0.58),
      });

      page.drawText("INVOICE", {
        x: 40,
        y: height - 52,
        size: 26,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(`#${invoiceNumber}`, {
        x: width - 160,
        y: height - 50,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Sender Info
      page.drawText("From:", { x: 40, y: height - 120, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(senderName, { x: 40, y: height - 135, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(senderEmail, { x: 40, y: height - 150, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

      // Client Info
      page.drawText("Bill To:", { x: 300, y: height - 120, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(clientName, { x: 300, y: height - 135, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(clientAddress, { x: 300, y: height - 150, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

      // Dates
      page.drawText(`Issue Date: ${invoiceDate}`, { x: 40, y: height - 180, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`Due Date: ${dueDate}`, { x: 200, y: height - 180, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

      // Table Header
      let y = height - 220;
      page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 24, color: rgb(0.92, 0.94, 0.98) });
      page.drawText("Description", { x: 50, y: y + 2, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText("Qty / Hrs", { x: 320, y: y + 2, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText("Rate", { x: 410, y: y + 2, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      page.drawText("Amount", { x: 490, y: y + 2, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

      // Line Items
      y -= 25;
      for (const item of items) {
        page.drawText(item.description.slice(0, 45), { x: 50, y, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
        page.drawText(String(item.quantity), { x: 340, y, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
        page.drawText(`${symbol}${item.rate.toFixed(2)}`, { x: 410, y, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
        page.drawText(`${symbol}${(item.quantity * item.rate).toFixed(2)}`, { x: 490, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        y -= 22;
      }

      // Divider
      page.drawLine({
        start: { x: 40, y: y + 8 },
        end: { x: width - 40, y: y + 8 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });

      // Totals
      y -= 10;
      page.drawText("Subtotal:", { x: 380, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(`${symbol}${subtotal.toFixed(2)}`, { x: 490, y, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

      y -= 18;
      page.drawText(`Tax (${taxRate}%):`, { x: 380, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(`${symbol}${taxAmount.toFixed(2)}`, { x: 490, y, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

      y -= 24;
      page.drawRectangle({ x: 360, y: y - 6, width: width - 400, height: 26, color: rgb(0.95, 0.98, 0.95) });
      page.drawText("TOTAL DUE:", { x: 370, y, size: 11, font: fontBold, color: rgb(0.1, 0.4, 0.1) });
      page.drawText(`${symbol}${total.toFixed(2)}`, { x: 485, y, size: 12, font: fontBold, color: rgb(0.1, 0.4, 0.1) });

      // Footer
      page.drawText("Thank you for your business. Payment is due within the terms specified.", {
        x: 40,
        y: 50,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to build PDF. Please check input values.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tool-panel">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold m-0">Client Invoice-to-PDF Builder (In-Browser)</h3>
        <button
          onClick={generatePdf}
          disabled={generating}
          className="button text-xs flex items-center gap-1.5 py-1.5 px-4"
          type="button"
        >
          <Download size={14} /> {generating ? "Generating..." : "Download Vector PDF"}
        </button>
      </div>

      <div className="form-grid mb-4">
        <label className="field">
          Invoice Number
          <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
        </label>
        <label className="field">
          Currency
          <select value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="USD ($)">USD ($)</option>
            <option value="GBP (£)">GBP (£)</option>
            <option value="EUR (€)">EUR (€)</option>
            <option value="CAD ($)">CAD ($)</option>
            <option value="AUD ($)">AUD ($)</option>
          </select>
        </label>
        <label className="field">
          Your Business / Freelancer Name
          <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} />
        </label>
        <label className="field">
          Your Contact / Billing Email
          <input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} />
        </label>
        <label className="field">
          Client / Company Name
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} />
        </label>
        <label className="field">
          Client Address / Location
          <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
        </label>
        <label className="field">
          Issue Date
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
        </label>
        <label className="field">
          Due Date
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </label>
      </div>

      <h4 className="font-semibold text-sm mt-4 mb-2">Line Items & Services</h4>
      <div className="space-y-2 mb-3">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-800 p-2 rounded">
            <input
              type="text"
              placeholder="Description of work"
              className="col-span-6 text-xs p-1.5 rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
              value={item.description}
              onChange={e => updateItem(item.id, "description", e.target.value)}
            />
            <input
              type="number"
              placeholder="Qty"
              min="1"
              step="1"
              className="col-span-2 text-xs p-1.5 rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
              value={item.quantity}
              onChange={e => updateItem(item.id, "quantity", Number(e.target.value) || 0)}
            />
            <input
              type="number"
              placeholder="Rate"
              min="0"
              step="5"
              className="col-span-3 text-xs p-1.5 rounded border dark:border-slate-700 bg-white dark:bg-slate-900"
              value={item.rate}
              onChange={e => updateItem(item.id, "rate", Number(e.target.value) || 0)}
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="col-span-1 text-red-500 hover:text-red-700 flex justify-center p-1"
              aria-label="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="button secondary text-xs flex items-center gap-1 py-1 px-3 mb-4"
      >
        <Plus size={14} /> Add Line Item
      </button>

      <div className="flex justify-end gap-6 my-4 p-4 bg-blue-50 dark:bg-slate-800 rounded border border-blue-100 dark:border-slate-700 text-sm">
        <div>
          <label className="text-xs block mb-1">Tax / VAT (%):</label>
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            className="w-20 text-xs p-1 rounded border bg-white dark:bg-slate-900"
            value={taxRate}
            onChange={e => setTaxRate(Number(e.target.value) || 0)}
          />
        </div>
        <div className="text-right">
          <p className="m-0 text-xs text-gray-600 dark:text-gray-400">Subtotal: {symbol}{subtotal.toFixed(2)}</p>
          <p className="m-0 text-xs text-gray-600 dark:text-gray-400">Tax: {symbol}{taxAmount.toFixed(2)}</p>
          <p className="m-0 text-base font-bold text-blue-900 dark:text-blue-200">
            Total Due: {symbol}{total.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="hint text-xs opacity-75">
        Compiles professional vector PDF documents locally using pdf-lib. No invoices, client contacts, or bank accounts are ever transmitted to any cloud database.
      </p>
    </div>
  );
}
