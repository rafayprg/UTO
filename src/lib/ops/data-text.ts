import type { TextOp } from "./types";
import { parseCsv } from "./pdf-ops-parse.ts";
import { advancedDataOps } from "./data-text-advanced.ts";

const SAMPLE_CSV = `id,name,role,department,salary
1,Alice Johnson,Lead Architect,Engineering,145000
2,Bob Smith,Senior Product Designer,Design,120000
3,Charlie Brown,Backend Developer,Engineering,115000
4,Dana Scully,Data Scientist,Analytics,130000
5,Fox Mulder,Investigative Analyst,Operations,110000`;

const SAMPLE_TSV = `id\tname\trole\tsalary
1\tAlice\tArchitect\t145000
2\tBob\tDesigner\t120000
3\tCharlie\tDeveloper\t115000`;

const SAMPLE_JSON_ARRAY = JSON.stringify([
  { id: 1, name: "Alice Johnson", role: "Lead Architect", salary: 145000 },
  { id: 2, name: "Bob Smith", role: "Senior Designer", salary: 120000 },
  { id: 3, name: "Charlie Brown", role: "Backend Developer", salary: 115000 }
], null, 2);

const SAMPLE_MARKDOWN_TABLE = `| id | name | role | salary |
|---|---|---|---|
| 1 | Alice Johnson | Lead Architect | 145000 |
| 2 | Bob Smith | Senior Designer | 120000 |
| 3 | Charlie Brown | Backend Developer | 115000 |`;

function formatCsvRow(cells: string[], delimiter = ","): string {
  return cells.map(cell => {
    if (cell.includes('"') || cell.includes(delimiter) || cell.includes("\n") || cell.includes("\r")) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }).join(delimiter);
}

function toCsvString(rows: string[][], delimiter = ","): string {
  return rows.map(r => formatCsvRow(r, delimiter)).join("\n") + "\n";
}

function parseJsonArray(input: string): Array<Record<string, unknown>> {
  const val = JSON.parse(input.trim());
  if (!Array.isArray(val)) throw new Error("Input must be a JSON array of objects.");
  return val as Array<Record<string, unknown>>;
}

export const ops: Record<string, TextOp> = {
  "csv-to-json": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["2", "2 spaces"], ["4", "4 spaces"]], default: "2" }],
    outputLabel: "JSON Array of Objects",
    outputExt: "json",
    run(input, options) {
      const rows = parseCsv(input);
      if (rows.length < 2) throw new Error("CSV must have at least a header row and one data row.");
      const headers = rows[0];
      const items = rows.slice(1).map(row => {
        const obj: Record<string, string | number | boolean | null> = {};
        headers.forEach((h, i) => {
          const val = row[i] ?? "";
          if (val === "") obj[h] = null;
          else if (/^-?\d+$/.test(val)) obj[h] = parseInt(val, 10);
          else if (/^-?\d+\.\d+$/.test(val)) obj[h] = parseFloat(val);
          else if (val.toLowerCase() === "true") obj[h] = true;
          else if (val.toLowerCase() === "false") obj[h] = false;
          else obj[h] = val;
        });
        return obj;
      });
      return JSON.stringify(items, null, Number(options.indent || 2)) + "\n";
    }
  },

  "json-to-csv": {
    input: { label: "JSON Array of Objects", example: SAMPLE_JSON_ARRAY, rows: 10 },
    outputLabel: "CSV text",
    outputExt: "csv",
    run(input) {
      const items = parseJsonArray(input);
      if (!items.length) return "";
      const headers = Array.from(new Set(items.flatMap(item => Object.keys(item))));
      const rows = [headers];
      for (const item of items) {
        rows.push(headers.map(h => {
          const val = item[h];
          return val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
        }));
      }
      return toCsvString(rows, ",");
    }
  },

  "csv-to-tsv": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "TSV (Tab-separated values)",
    outputExt: "tsv",
    run(input) {
      const rows = parseCsv(input);
      return rows.map(r => r.join("\t")).join("\n") + "\n";
    }
  },

  "tsv-to-csv": {
    input: { label: "TSV text", example: SAMPLE_TSV, rows: 10 },
    outputLabel: "CSV text",
    outputExt: "csv",
    run(input) {
      const rows = parseCsv(input);
      return toCsvString(rows, ",");
    }
  },

  "tsv-to-json": {
    input: { label: "TSV text", example: SAMPLE_TSV, rows: 10 },
    outputLabel: "JSON Array",
    outputExt: "json",
    run(input) {
      const rows = parseCsv(input);
      if (rows.length < 2) throw new Error("TSV must have at least a header row and one data row.");
      const headers = rows[0];
      const items = rows.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        return obj;
      });
      return JSON.stringify(items, null, 2) + "\n";
    }
  },

  "json-to-tsv": {
    input: { label: "JSON Array of Objects", example: SAMPLE_JSON_ARRAY, rows: 10 },
    outputLabel: "TSV text",
    outputExt: "tsv",
    run(input) {
      const items = parseJsonArray(input);
      if (!items.length) return "";
      const headers = Array.from(new Set(items.flatMap(item => Object.keys(item))));
      const lines = [headers.join("\t")];
      for (const item of items) {
        lines.push(headers.map(h => String(item[h] ?? "")).join("\t"));
      }
      return lines.join("\n") + "\n";
    }
  },

  "csv-to-markdown": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "Markdown Table",
    outputExt: "md",
    run(input) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const cols = rows[0].length;
      const widths = Array.from({ length: cols }, (_, c) => Math.max(3, ...rows.map(r => (r[c] || "").length)));
      const formatRow = (r: string[]) => "| " + r.map((cell, c) => (cell || "").padEnd(widths[c])).join(" | ") + " |";
      const separator = "| " + widths.map(w => "-".repeat(w)).join(" | ") + " |";
      const head = formatRow(rows[0]);
      const body = rows.slice(1).map(formatRow);
      return [head, separator, ...body].join("\n") + "\n";
    }
  },

  "markdown-to-csv": {
    input: { label: "Markdown Table", example: SAMPLE_MARKDOWN_TABLE, rows: 8 },
    outputLabel: "CSV text",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n").filter(l => l.includes("|"));
      const rows = lines
        .filter(l => !/^[|\s-:]+$/.test(l.trim()))
        .map(l => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim()));
      return toCsvString(rows, ",");
    }
  },

  "csv-to-html-table": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "bordered", label: "Include border styling class", type: "checkbox", default: true }],
    outputLabel: "HTML Table",
    outputExt: "html",
    run(input, options) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const cls = options.bordered ? ' class="table table-bordered"' : "";
      const thead = `  <thead>\n    <tr>\n${rows[0].map(h => `      <th>${h}</th>`).join("\n")}\n    </tr>\n  </thead>`;
      const tbody = `  <tbody>\n${rows.slice(1).map(r => `    <tr>\n${r.map(c => `      <td>${c}</td>`).join("\n")}\n    </tr>`).join("\n")}\n  </tbody>`;
      return `<table${cls}>\n${thead}\n${tbody}\n</table>\n`;
    }
  },

  "csv-to-sql-insert": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "table", label: "Target SQL Table Name", type: "text", default: "employees" }],
    outputLabel: "SQL INSERT statements",
    outputExt: "sql",
    run(input, options) {
      const rows = parseCsv(input);
      if (rows.length < 2) throw new Error("CSV needs at least one header row and one data row.");
      const table = String(options.table || "table_name");
      const headers = rows[0].map(h => `"${h.replace(/"/g, '""')}"`).join(", ");
      const inserts = rows.slice(1).map(r => {
        const values = r.map(cell => {
          if (cell === "") return "NULL";
          if (/^-?\d+(\.\d+)?$/.test(cell)) return cell;
          return `'${cell.replace(/'/g, "''")}'`;
        }).join(", ");
        return `INSERT INTO "${table}" (${headers}) VALUES (${values});`;
      });
      return inserts.join("\n") + "\n";
    }
  },

  "csv-column-extractor": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "columns", label: "Columns to extract (comma-separated names or 1-based indices)", type: "text", default: "name, salary" }],
    outputLabel: "Extracted Columns CSV",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const headers = rows[0];
      const targets = String(options.columns || "").split(",").map(s => s.trim().toLowerCase());
      const indices: number[] = [];
      targets.forEach(t => {
        const num = parseInt(t, 10);
        if (!isNaN(num) && num >= 1 && num <= headers.length) indices.push(num - 1);
        else {
          const idx = headers.findIndex(h => h.toLowerCase() === t);
          if (idx >= 0) indices.push(idx);
        }
      });
      if (!indices.length) throw new Error("No matching columns found. Specify column names matching the headers.");
      const extracted = rows.map(r => indices.map(i => r[i] ?? ""));
      return toCsvString(extracted, ",");
    }
  },

  "csv-column-reorder": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "order", label: "New Column Order (comma-separated headers)", type: "text", default: "name, salary, role, id" }],
    outputLabel: "Reordered CSV",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const headers = rows[0];
      const targets = String(options.order || "").split(",").map(s => s.trim().toLowerCase());
      const indices = targets.map(t => headers.findIndex(h => h.toLowerCase() === t)).filter(i => i >= 0);
      if (!indices.length) throw new Error("None of the specified columns match existing headers.");
      const reordered = rows.map(r => indices.map(i => r[i] ?? ""));
      return toCsvString(reordered, ",");
    }
  },

  "csv-column-remover": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "columns", label: "Columns to remove (comma-separated names)", type: "text", default: "salary, department" }],
    outputLabel: "Trimmed CSV",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const headers = rows[0];
      const drop = new Set(String(options.columns || "").split(",").map(s => s.trim().toLowerCase()));
      const keepIndices = headers.map((h, i) => drop.has(h.toLowerCase()) ? -1 : i).filter(i => i >= 0);
      if (!keepIndices.length) throw new Error("Cannot remove all columns.");
      const remaining = rows.map(r => keepIndices.map(i => r[i] ?? ""));
      return toCsvString(remaining, ",");
    }
  },

  "csv-transpose": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "Transposed CSV (Pivoted 90°)",
    outputExt: "csv",
    run(input) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const cols = rows[0].length;
      const transposed = Array.from({ length: cols }, (_, c) => rows.map(r => r[c] ?? ""));
      return toCsvString(transposed, ",");
    }
  },

  "csv-sort-by-column": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [
      { id: "col", label: "Column name or 1-based index to sort by", type: "text", default: "salary" },
      { id: "dir", label: "Sort direction", type: "select", choices: [["asc", "Ascending"], ["desc", "Descending"]], default: "asc" },
      { id: "type", label: "Sort type", type: "select", choices: [["auto", "Auto detect (Numeric / Alphabetical)"], ["numeric", "Strictly Numeric"], ["text", "Alphabetical"]], default: "auto" }
    ],
    outputLabel: "Sorted CSV",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (rows.length < 2) return input;
      const headers = rows[0];
      const target = String(options.col || "1").trim().toLowerCase();
      let colIdx = headers.findIndex(h => h.toLowerCase() === target);
      if (colIdx < 0) {
        const num = parseInt(target, 10);
        colIdx = !isNaN(num) && num >= 1 && num <= headers.length ? num - 1 : 0;
      }
      const dataRows = rows.slice(1);
      const isNum = options.type === "numeric" || (options.type === "auto" && dataRows.every(r => /^-?\d+(\.\d+)?$/.test((r[colIdx] || "").trim())));
      dataRows.sort((a, b) => {
        const va = (a[colIdx] || "").trim();
        const vb = (b[colIdx] || "").trim();
        let cmp = 0;
        if (isNum) cmp = parseFloat(va || "0") - parseFloat(vb || "0");
        else cmp = va.localeCompare(vb);
        return options.dir === "desc" ? -cmp : cmp;
      });
      return toCsvString([headers, ...dataRows], ",");
    }
  },

  "csv-deduplicate": {
    input: { label: "CSV text", example: `${SAMPLE_CSV}\n1,Alice Johnson,Lead Architect,Engineering,145000`, rows: 10 },
    outputLabel: "Deduplicated CSV",
    outputExt: "csv",
    run(input) {
      const rows = parseCsv(input);
      if (rows.length < 2) return input;
      const seen = new Set<string>();
      const unique: string[][] = [rows[0]];
      for (const r of rows.slice(1)) {
        const key = JSON.stringify(r);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(r);
        }
      }
      return toCsvString(unique, ",");
    }
  },

  "csv-filter-rows": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [
      { id: "query", label: "Filter search query", type: "text", default: "Engineering" },
      { id: "mode", label: "Action", type: "select", choices: [["keep", "Keep matching rows"], ["drop", "Drop matching rows"]], default: "keep" }
    ],
    outputLabel: "Filtered CSV",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (rows.length < 2) return input;
      const q = String(options.query || "").toLowerCase();
      const filtered = [rows[0]];
      for (const r of rows.slice(1)) {
        const match = r.some(c => c.toLowerCase().includes(q));
        if (options.mode === "keep" ? match : !match) filtered.push(r);
      }
      return toCsvString(filtered, ",");
    }
  },

  "csv-delimiter-converter": {
    input: { label: "CSV or delimited text", example: SAMPLE_CSV, rows: 10 },
    options: [
      { id: "to", label: "Convert Delimiter To", type: "select", choices: [[";", "Semicolon (;)"], ["\t", "Tab (\\t)"], ["|", "Pipe (|)"], [",", "Comma (,)"]], default: ";" }
    ],
    outputLabel: "Delimited Output",
    outputExt: "txt",
    run(input, options) {
      const rows = parseCsv(input);
      return toCsvString(rows, String(options.to || ";"));
    }
  },

  "csv-header-case": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    options: [{ id: "case", label: "Target Header Case", type: "select", choices: [["snake", "snake_case"], ["camel", "camelCase"], ["upper", "UPPERCASE"], ["title", "Title Case"]], default: "snake" }],
    outputLabel: "CSV with Transformed Headers",
    outputExt: "csv",
    run(input, options) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const transform = (h: string) => {
        const words = h.replace(/[-_]/g, " ").trim().split(/\s+/);
        if (options.case === "snake") return words.map(w => w.toLowerCase()).join("_");
        if (options.case === "camel") return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
        if (options.case === "upper") return h.toUpperCase();
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      };
      const newHeaders = rows[0].map(transform);
      return toCsvString([newHeaders, ...rows.slice(1)], ",");
    }
  },

  "csv-trim-whitespace": {
    input: { label: "CSV text", example: "id ,  name  , salary \n 1 , Alice ,  145000 ", rows: 8 },
    outputLabel: "Trimmed CSV",
    outputExt: "csv",
    run(input) {
      const rows = parseCsv(input);
      const cleaned = rows.map(r => r.map(c => c.trim()));
      return toCsvString(cleaned, ",");
    }
  },

  "csv-remove-empty-rows": {
    input: { label: "CSV text", example: `${SAMPLE_CSV}\n\n   \n,,,`, rows: 10 },
    outputLabel: "Cleaned CSV",
    outputExt: "csv",
    run(input) {
      const rows = parseCsv(input);
      const cleaned = rows.filter(r => r.some(c => c.trim() !== ""));
      return toCsvString(cleaned, ",");
    }
  },

  "csv-stats-analyzer": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "Data Profile & Statistics",
    outputExt: "txt",
    run(input) {
      const rows = parseCsv(input);
      if (!rows.length) return "Empty CSV document.";
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const totalCells = dataRows.length * headers.length;
      let emptyCells = 0;
      const stats = headers.map((h, i) => {
        const values = dataRows.map(r => r[i] ?? "");
        const emptyCount = values.filter(v => v.trim() === "").length;
        emptyCells += emptyCount;
        const distinct = new Set(values).size;
        return `  • "${h}": ${dataRows.length - emptyCount} populated, ${emptyCount} empty, ${distinct} unique values`;
      });

      return [
        "=== CSV Table Profile ===",
        `Total Rows: ${dataRows.length} (excluding header)`,
        `Total Columns: ${headers.length}`,
        `Total Cells: ${totalCells}`,
        `Completeness: ${totalCells ? (((totalCells - emptyCells) / totalCells) * 100).toFixed(1) : 100}%`,
        "",
        "Column Breakdown:",
        ...stats
      ].join("\n") + "\n";
    }
  },

  "csv-to-jsonl": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "JSON Lines (JSONL)",
    outputExt: "jsonl",
    run(input) {
      const rows = parseCsv(input);
      if (rows.length < 2) return "";
      const headers = rows[0];
      const lines = rows.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        return JSON.stringify(obj);
      });
      return lines.join("\n") + "\n";
    }
  },

  "jsonl-to-csv": {
    input: { label: "JSON Lines", example: '{"id":1,"name":"Alice","role":"Architect"}\n{"id":2,"name":"Bob","role":"Designer"}', rows: 8 },
    outputLabel: "CSV text",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n").filter(l => l.trim());
      const items = lines.map(l => JSON.parse(l));
      const headers = Array.from(new Set(items.flatMap(item => Object.keys(item))));
      const rows = [headers];
      for (const item of items) {
        rows.push(headers.map(h => String(item[h] ?? "")));
      }
      return toCsvString(rows, ",");
    }
  },

  "csv-to-ascii-grid": {
    input: { label: "CSV text", example: SAMPLE_CSV, rows: 10 },
    outputLabel: "ASCII Grid Table",
    outputExt: "txt",
    run(input) {
      const rows = parseCsv(input);
      if (!rows.length) return "";
      const cols = rows[0].length;
      const widths = Array.from({ length: cols }, (_, c) => Math.max(3, ...rows.map(r => (r[c] || "").length)));
      const border = "+" + widths.map(w => "-".repeat(w + 2)).join("+") + "+";
      const formatRow = (r: string[]) => "| " + r.map((cell, c) => (cell || "").padEnd(widths[c])).join(" | ") + " |";
      const head = formatRow(rows[0]);
      const body = rows.slice(1).map(formatRow);
      return [border, head, border, ...body, border].join("\n") + "\n";
    }
  },

  ...advancedDataOps,
};
