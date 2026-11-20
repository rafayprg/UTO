import type { TextOp } from "./types";

export const advancedDataOps: Record<string, TextOp> = {
  "tsv-to-json-converter": {
    input: {
      label: "TSV (Tab-Separated Values) Input",
      placeholder: "name\tage\tcity\nAlice\t30\tNew York\nBob\t25\tLondon",
      example: "id\tproduct\tprice\n1\tLaptop\t999\n2\tPhone\t699",
      rows: 5
    },
    outputLabel: "JSON Array of Objects",
    outputExt: "json",
    run(input) {
      const lines = input.trim().split("\n").map(l => l.split("\t"));
      if (lines.length < 2) return "[]";
      const headers = lines[0].map(h => h.trim());
      const records = lines.slice(1).map(row => {
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          const val = row[i]?.trim() ?? "";
          obj[h] = !isNaN(Number(val)) && val !== "" ? Number(val) : val;
        });
        return obj;
      });
      return JSON.stringify(records, null, 2);
    }
  },

  "json-to-tsv-converter": {
    input: {
      label: "JSON Array of Objects",
      placeholder: "[{\"name\": \"Alice\", \"age\": 30}]",
      example: "[{\"id\": 1, \"product\": \"Laptop\", \"price\": 999}, {\"id\": 2, \"product\": \"Phone\", \"price\": 699}]",
      rows: 5
    },
    outputLabel: "TSV Tab-Separated Output",
    outputExt: "tsv",
    run(input) {
      const data = JSON.parse(input);
      if (!Array.isArray(data) || data.length === 0) return "";
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(h => String(item[h] ?? "")).join("\t"));
      return [headers.join("\t"), ...rows].join("\n");
    }
  },

  "csv-to-latex-table": {
    input: {
      label: "CSV Content",
      placeholder: "Name,Score,Grade\nAlice,95,A\nBob,82,B",
      example: "Item,Quantity,Unit Price\nKeyboard,15,45.00\nMouse,25,25.00",
      rows: 5
    },
    outputLabel: "LaTeX Booktabs Table",
    outputExt: "tex",
    run(input) {
      const lines = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (lines.length === 0) return "";
      const colCount = lines[0].length;
      const align = "l" + "r".repeat(colCount - 1);
      const rows = lines.map(r => r.join(" & ") + " \\\\");
      return [
        "\\begin{table}[ht]",
        "\\centering",
        `\\begin{tabular}{${align}}`,
        "\\toprule",
        rows[0],
        "\\midrule",
        ...rows.slice(1),
        "\\bottomrule",
        "\\end{tabular}",
        "\\end{table}"
      ].join("\n");
    }
  },

  "csv-to-yaml-objects": {
    input: {
      label: "CSV Data",
      placeholder: "id,name,role\n1,Alice,Admin\n2,Bob,Editor",
      example: "id,name,role\n1,Alice,Admin\n2,Bob,Editor",
      rows: 5
    },
    outputLabel: "YAML Document List",
    outputExt: "yaml",
    run(input) {
      const lines = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (lines.length < 2) return "";
      const headers = lines[0];
      const items = lines.slice(1).map(row => {
        const fields = headers.map((h, i) => `  ${h}: ${row[i] || ""}`).join("\n");
        return `- ${fields.slice(2)}`;
      });
      return items.join("\n");
    }
  },

  "csv-to-xml-rows": {
    input: {
      label: "CSV Input",
      placeholder: "id,product,price\n1,Desk,199\n2,Chair,89",
      example: "id,product,price\n1,Desk,199\n2,Chair,89",
      rows: 5
    },
    outputLabel: "Hierarchical XML Rows",
    outputExt: "xml",
    run(input) {
      const lines = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (lines.length < 2) return "";
      const headers = lines[0].map(h => h.replace(/[^a-zA-Z0-9_]/g, "_"));
      const records = lines.slice(1).map(r => {
        const fields = headers.map((h, i) => `    <${h}>${r[i] ?? ""}</${h}>`).join("\n");
        return `  <record>\n${fields}\n  </record>`;
      });
      return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${records.join("\n")}\n</data>`;
    }
  },

  "base64-csv-encoder": {
    input: {
      label: "Raw CSV Text",
      placeholder: "name,email,score\nAlice,alice@example.com,94",
      example: "id,name,score\n1,Alice,98\n2,Bob,85",
      rows: 4
    },
    outputLabel: "Base64 Encoded CSV",
    outputExt: "txt",
    run(input) {
      return Buffer.from(input, "utf-8").toString("base64");
    }
  },

  "base64-csv-decoder": {
    input: {
      label: "Base64 Encoded String",
      placeholder: "aWQsbWFtZSxzY29yZQoxLEFsaWNlLDk4CjIsQm9iLDg1",
      example: "aWQsbWFtZSxzY29yZQoxLEFsaWNlLDk4CjIsQm9iLDg1",
      rows: 3
    },
    outputLabel: "Decoded CSV Table",
    outputExt: "csv",
    run(input) {
      return Buffer.from(input.trim(), "base64").toString("utf-8");
    }
  },

  "csv-duplicate-rows-isolator": {
    input: {
      label: "CSV Content",
      placeholder: "email,name\nalice@test.com,Alice\nbob@test.com,Bob\nalice@test.com,Alice",
      example: "id,email\n1,alice@example.com\n2,bob@example.com\n3,alice@example.com\n4,charlie@example.com",
      rows: 5
    },
    outputLabel: "Duplicate Rows Isolated",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length < 2) return "No duplicate rows found.";
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (seen.has(line)) dupes.push(line);
        else seen.add(line);
      }
      if (dupes.length === 0) return "No duplicate rows detected in file.";
      return [lines[0], ...dupes].join("\n");
    }
  },

  "csv-column-math-stats": {
    input: {
      label: "CSV Content",
      placeholder: "Product,Sales,Cost\nWidget A,150,45\nWidget B,220,60\nWidget C,310,80",
      example: "Transaction,Amount,Fee\nTX101,120.50,3.50\nTX102,85.00,2.10\nTX103,450.00,12.00\nTX104,210.25,5.50",
      rows: 6
    },
    options: [
      { id: "colIndex", label: "Column Index (1-based)", type: "number", default: 2, min: 1, max: 20 }
    ],
    outputLabel: "Column Statistics Summary",
    outputExt: "txt",
    run(input, opts) {
      const lines = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (lines.length < 2) return "Need at least one header and one data row.";
      const idx = Number(opts.colIndex || 2) - 1;
      const colName = lines[0][idx] || `Column ${idx + 1}`;
      const values = lines.slice(1).map(r => Number(r[idx])).filter(n => !isNaN(n));
      if (values.length === 0) return `No numeric values found in column ${idx + 1}.`;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return [
        `Summary Statistics for [${colName}]:`,
        `Count:   ${values.length}`,
        `Sum:     ${sum.toLocaleString()}`,
        `Mean:    ${mean.toFixed(2)}`,
        `Min:     ${min.toLocaleString()}`,
        `Max:     ${max.toLocaleString()}`
      ].join("\n");
    }
  },

  "csv-tsv-markdown-table": {
    input: {
      label: "CSV or TSV Table",
      placeholder: "Product,Price,Stock\nKeyboard,49.99,120\nMouse,24.99,250",
      example: "Product,Price,Stock\nKeyboard,49.99,120\nMouse,24.99,250",
      rows: 5
    },
    outputLabel: "Formatted Markdown Table",
    outputExt: "md",
    run(input) {
      const delimiter = input.includes("\t") ? "\t" : ",";
      const rows = input.trim().split("\n").map(line => line.split(delimiter).map(c => c.trim()));
      if (rows.length === 0) return "";
      const header = `| ${rows[0].join(" | ")} |`;
      const divider = `| ${rows[0].map(() => "---").join(" | ")} |`;
      const body = rows.slice(1).map(r => `| ${r.join(" | ")} |`).join("\n");
      return [header, divider, body].join("\n");
    }
  },

  "csv-to-sql-update-generator": {
    input: {
      label: "CSV Content",
      placeholder: "id,status,score\n101,active,95\n102,suspended,42",
      example: "id,status,score\n101,active,95\n102,suspended,42",
      rows: 5
    },
    options: [
      { id: "tableName", label: "Target SQL Table Name", type: "text", default: "users" }
    ],
    outputLabel: "SQL UPDATE Script",
    outputExt: "sql",
    run(input, opts) {
      const tbl = String(opts.tableName || "users");
      const lines = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (lines.length < 2) return "";
      const headers = lines[0];
      const idCol = headers[0];
      const setCols = headers.slice(1);
      return lines.slice(1).map(row => {
        const assignments = setCols.map((col, i) => {
          const val = row[i + 1] ?? "";
          return `${col} = '${val.replace(/'/g, "''")}'`;
        }).join(", ");
        return `UPDATE ${tbl} SET ${assignments} WHERE ${idCol} = '${row[0]}';`;
      }).join("\n");
    }
  },

  "csv-header-slugifier": {
    input: {
      label: "CSV with Messy Headers",
      placeholder: "First Name,Email Address (Primary),Annual Revenue ($),Created Date",
      example: "First Name,Email Address (Primary),Annual Revenue ($),Created Date\nAlice,alice@site.com,120000,2025-01-01",
      rows: 4
    },
    outputLabel: "Cleaned Snake_Case / Slugified CSV",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length === 0) return "";
      const cleanHeader = lines[0].split(",").map(h => {
        return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      }).join(",");
      return [cleanHeader, ...lines.slice(1)].join("\n");
    }
  },

  "json-array-to-sql-inserts": {
    input: {
      label: "JSON Array of Objects",
      placeholder: "[{\"name\": \"Alice\", \"role\": \"admin\"}]",
      example: "[{\"id\": 1, \"name\": \"Alice\", \"role\": \"admin\"}, {\"id\": 2, \"name\": \"Bob\", \"role\": \"editor\"}]",
      rows: 5
    },
    options: [
      { id: "tableName", label: "SQL Table Name", type: "text", default: "accounts" }
    ],
    outputLabel: "SQL INSERT Script",
    outputExt: "sql",
    run(input, opts) {
      const tbl = String(opts.tableName || "accounts");
      const data = JSON.parse(input);
      if (!Array.isArray(data) || data.length === 0) return "";
      const cols = Object.keys(data[0]);
      return data.map(item => {
        const vals = cols.map(c => {
          const v = item[c];
          if (v === null || v === undefined) return "NULL";
          if (typeof v === "number") return v;
          return `'${String(v).replace(/'/g, "''")}'`;
        }).join(", ");
        return `INSERT INTO ${tbl} (${cols.join(", ")}) VALUES (${vals});`;
      }).join("\n");
    }
  },

  "sql-inserts-to-json": {
    input: {
      label: "SQL INSERT Statements",
      placeholder: "INSERT INTO users (id, name) VALUES (1, 'Alice');",
      example: "INSERT INTO users (id, name, score) VALUES (1, 'Alice', 95);\nINSERT INTO users (id, name, score) VALUES (2, 'Bob', 88);",
      rows: 5
    },
    outputLabel: "Parsed JSON Array",
    outputExt: "json",
    run(input) {
      const lines = input.trim().split("\n").filter(l => /INSERT\s+INTO/i.test(l));
      const records: Record<string, unknown>[] = [];
      for (const line of lines) {
        const colMatch = line.match(/\(([^)]+)\)\s+VALUES/i);
        const valMatch = line.match(/VALUES\s*\(([^)]+)\)/i);
        if (colMatch && valMatch) {
          const cols = colMatch[1].split(",").map(c => c.trim().replace(/[`"']/g, ""));
          const vals = valMatch[1].split(",").map(v => v.trim().replace(/^'|'$/g, ""));
          const obj: Record<string, unknown> = {};
          cols.forEach((c, i) => {
            const raw = vals[i] ?? "";
            obj[c] = !isNaN(Number(raw)) && raw !== "" ? Number(raw) : raw;
          });
          records.push(obj);
        }
      }
      return JSON.stringify(records, null, 2);
    }
  },

  "data-minmax-scaler": {
    input: {
      label: "Raw Numbers (Comma or space separated)",
      placeholder: "10, 20, 30, 40, 50",
      example: "12, 45, 68, 24, 95, 33",
      rows: 3
    },
    outputLabel: "Min-Max Scaled Data [0.0 - 1.0]",
    outputExt: "txt",
    run(input) {
      const nums = input.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length < 2) return "Enter at least 2 numbers.";
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const range = max - min;
      if (range === 0) return nums.map(() => "0.000").join(", ");
      return nums.map(x => ((x - min) / range).toFixed(4)).join(", ");
    }
  },

  "data-zscore-scaler": {
    input: {
      label: "Raw Numbers (Comma or space separated)",
      placeholder: "10, 20, 30, 40, 50",
      example: "15, 25, 35, 45, 55, 65",
      rows: 3
    },
    outputLabel: "Z-Score Standardized Data (Mean=0, SD=1)",
    outputExt: "txt",
    run(input) {
      const nums = input.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length < 2) return "Enter at least 2 numbers.";
      const n = nums.length;
      const mean = nums.reduce((a, b) => a + b, 0) / n;
      const sd = Math.sqrt(nums.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / n);
      if (sd === 0) return nums.map(() => "0.000").join(", ");
      return nums.map(x => ((x - mean) / sd).toFixed(3)).join(", ");
    }
  },

  "csv-find-replace-column": {
    input: {
      label: "CSV Content",
      placeholder: "id,status\n1,pending\n2,pending\n3,completed",
      example: "id,environment,active\n1,staging,true\n2,staging,false\n3,production,true",
      rows: 5
    },
    second: {
      label: "Find and Replace (format: target=>replacement)",
      placeholder: "staging=>production",
      example: "staging=>production"
    },
    outputLabel: "Updated CSV",
    outputExt: "csv",
    run(input, _, pattern) {
      if (!pattern || !pattern.includes("=>")) return input;
      const [findStr, replaceStr] = pattern.split("=>").map(s => s.trim());
      return input.split("\n").map(l => l.replaceAll(findStr, replaceStr)).join("\n");
    }
  },

  "random-csv-mock-generator": {
    input: false,
    options: [
      { id: "rowsCount", label: "Number of Rows to Generate", type: "number", default: 10, min: 1, max: 100 }
    ],
    outputLabel: "Generated Mock CSV",
    outputExt: "csv",
    run(_, opts) {
      const count = Number(opts.rowsCount || 10);
      const firstNames = ["James", "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia"];
      const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis"];
      const domains = ["example.com", "company.org", "techcorp.io", "webmail.net"];
      const roles = ["Engineer", "Designer", "Manager", "Analyst", "Product"];
      const rows: string[] = ["id,first_name,last_name,email,role,salary"];
      for (let i = 1; i <= count; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
        const role = roles[Math.floor(Math.random() * roles.length)];
        const salary = 65000 + (Math.floor(Math.random() * 60) * 1000);
        rows.push(`${i},${fn},${ln},${email},${role},${salary}`);
      }
      return rows.join("\n");
    }
  },

  "excel-formula-lookup-helper": {
    input: false,
    options: [
      { id: "formulaType", label: "Lookup Formula Template", type: "select", default: "xlookup", choices: [["xlookup", "XLOOKUP (Modern Two-Way Lookup)"], ["index-match", "INDEX / MATCH (Classic Robust Two-Way)"], ["vlookup", "VLOOKUP (Exact Match Table)"], ["sumifs", "SUMIFS (Multi-Condition Sum)"]] }
    ],
    outputLabel: "Excel Formula Syntax & Guide",
    outputExt: "txt",
    run(_, opts) {
      const templates: Record<string, string> = {
        "xlookup": "=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode])\nExample: =XLOOKUP(A2, Products!A:A, Products!C:C, \"Not Found\", 0)",
        "index-match": "=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))\nExample: =INDEX(Products!C:C, MATCH(A2, Products!A:A, 0))",
        "vlookup": "=VLOOKUP(lookup_value, table_array, col_index_number, FALSE)\nExample: =VLOOKUP(A2, Products!A:E, 3, FALSE)",
        "sumifs": "=SUMIFS(sum_range, criteria_range1, criteria1, criteria_range2, criteria2)\nExample: =SUMIFS(Sales!D:D, Sales!B:B, \"North\", Sales!C:C, \">100\")"
      };
      return templates[String(opts.formulaType)] || "";
    }
  },

  "csv-column-splitter": {
    input: {
      label: "CSV Content",
      placeholder: "Full Name,Role\nJohn Smith,Developer\nJane Doe,Designer",
      example: "Full Name,Department\nJohn Smith,Engineering\nJane Doe,Marketing",
      rows: 5
    },
    outputLabel: "CSV with Split Column (First Name & Last Name)",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length < 2) return input;
      const headers = lines[0].split(",").map(c => c.trim());
      const newHeader = ["First Name", "Last Name", ...headers.slice(1)].join(",");
      const body = lines.slice(1).map(row => {
        const cells = row.split(",").map(c => c.trim());
        const fullName = cells[0] || "";
        const spaceIdx = fullName.indexOf(" ");
        const first = spaceIdx !== -1 ? fullName.slice(0, spaceIdx) : fullName;
        const last = spaceIdx !== -1 ? fullName.slice(spaceIdx + 1) : "";
        return [first, last, ...cells.slice(1)].join(",");
      });
      return [newHeader, ...body].join("\n");
    }
  },

  "csv-column-merger": {
    input: {
      label: "CSV Content",
      placeholder: "first_name,last_name,department\nJohn,Smith,IT\nJane,Doe,Sales",
      example: "first_name,last_name,department\nJohn,Smith,IT\nJane,Doe,Sales",
      rows: 5
    },
    outputLabel: "CSV with Combined full_name Column",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length < 2) return input;
      const headers = lines[0].split(",").map(c => c.trim());
      const newHeader = ["full_name", ...headers.slice(2)].join(",");
      const body = lines.slice(1).map(row => {
        const cells = row.split(",").map(c => c.trim());
        const combined = `${cells[0] || ""} ${cells[1] || ""}`.trim();
        return [combined, ...cells.slice(2)].join(",");
      });
      return [newHeader, ...body].join("\n");
    }
  },

  "csv-case-normalizer": {
    input: {
      label: "CSV Content",
      placeholder: "EMAIL,NAME\nALICE@TEST.COM,alice smith\nBOB@TEST.COM,bob jones",
      example: "EMAIL,NAME\nALICE@TEST.COM,alice smith\nBOB@TEST.COM,bob jones",
      rows: 5
    },
    options: [
      { id: "caseType", label: "Normalization Case", type: "select", default: "lowercase", choices: [["lowercase", "lowercase all text"], ["uppercase", "UPPERCASE all text"], ["titlecase", "Title Case Words"]] }
    ],
    outputLabel: "Case Normalized CSV",
    outputExt: "csv",
    run(input, opts) {
      const c = String(opts.caseType || "lowercase");
      if (c === "lowercase") return input.toLowerCase();
      if (c === "uppercase") return input.toUpperCase();
      return input.split("\n").map(l => l.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join("\n");
    }
  },

  "csv-row-counter-profiler": {
    input: {
      label: "Raw CSV File Text",
      placeholder: "id,name,email\n1,Alice,alice@site.com\n2,Bob,bob@site.com",
      example: "id,product,price,stock\n1,Apples,1.20,500\n2,Oranges,1.50,350\n3,Bananas,0.80,600",
      rows: 6
    },
    outputLabel: "CSV File Health Profile",
    outputExt: "txt",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length === 0) return "Empty CSV file.";
      const headers = lines[0].split(",");
      const dataRows = lines.slice(1);
      const emptyLines = dataRows.filter(l => !l.trim()).length;
      const validRows = dataRows.filter(l => l.trim()).length;
      return [
        `File Statistics:`,
        `Total Lines:       ${lines.length}`,
        `Header Columns:    ${headers.length} (${headers.map(h => h.trim()).join(", ")})`,
        `Data Rows:         ${validRows}`,
        `Blank Lines:       ${emptyLines}`,
        `Character Length:  ${input.length.toLocaleString()} characters`
      ].join("\n");
    }
  },

  "csv-null-empty-isolator": {
    input: {
      label: "CSV Content with Missing Values",
      placeholder: "id,name,email\n1,Alice,alice@site.com\n2,Bob,\n3,,charlie@site.com",
      example: "id,name,email\n1,Alice,alice@site.com\n2,Bob,\n3,,charlie@site.com\n4,David,david@site.com",
      rows: 6
    },
    outputLabel: "Rows with Missing/Empty Values",
    outputExt: "csv",
    run(input) {
      const lines = input.trim().split("\n");
      if (lines.length < 2) return "No missing values found.";
      const header = lines[0];
      const incomplete = lines.slice(1).filter(l => {
        const cells = l.split(",");
        return cells.some(c => c.trim() === "");
      });
      if (incomplete.length === 0) return "All rows have complete values (0 empty cells detected).";
      return [header, ...incomplete].join("\n");
    }
  },

  "csv-transpose-table": {
    input: {
      label: "CSV to Transpose (Swap Rows & Columns)",
      placeholder: "Month,Jan,Feb,Mar\nRevenue,100,120,140\nExpenses,70,80,90",
      example: "Month,Jan,Feb,Mar\nRevenue,100,120,140\nExpenses,70,80,90",
      rows: 5
    },
    outputLabel: "Transposed CSV Output",
    outputExt: "csv",
    run(input) {
      const matrix = input.trim().split("\n").map(l => l.split(",").map(c => c.trim()));
      if (matrix.length === 0) return "";
      const cols = matrix[0].length;
      const transposed: string[][] = [];
      for (let c = 0; c < cols; c++) {
        transposed.push(matrix.map(row => row[c] ?? ""));
      }
      return transposed.map(r => r.join(",")).join("\n");
    }
  }
};
