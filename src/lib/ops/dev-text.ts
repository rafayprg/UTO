import type { TextOp } from "./types";
import { type JsonObject } from "./dev-text-util.ts";
import { parseLoose, toJsLiteral, treeOutline, leafPaths, jsonDiff, deepMerge, sortKeys } from "./dev-text-json.ts";
import { inferSchema } from "./dev-text-schema.ts";
import * as codegenA from "./dev-text-codegen-a.ts";
import * as codegenB from "./dev-text-codegen-b.ts";
import * as formats from "./dev-text-formats.ts";
import * as css from "./dev-text-css.ts";
import * as xml from "./dev-text-xml.ts";
import * as md from "./dev-text-markdown.ts";
import * as markup from "./dev-text-markup.ts";
import { queryPath, validateSchema, sampleFromSchema } from "./dev-text-jsonpath.ts";
import { advancedDevOps } from "./dev-text-advanced.ts";

const SAMPLE_JSON = JSON.stringify({
  id: 101,
  name: "Antigravity Dev Toolkit",
  version: "3.2.0",
  active: true,
  tags: ["typescript", "tools", "client-side"],
  config: {
    port: 3000,
    debug: false,
    environment: "production"
  },
  maintainers: [
    { name: "DeepMind Team", email: "team@google.internal" }
  ]
}, null, 2);

const SAMPLE_DIFF_A = JSON.stringify({ id: 1, name: "Alpha", active: true, roles: ["admin"] }, null, 2);
const SAMPLE_DIFF_B = JSON.stringify({ id: 1, name: "Alpha 2", active: false, roles: ["admin", "editor"], email: "alpha@example.com" }, null, 2);

const SAMPLE_CSS = `.card {
  padding: 1.5rem;
  margin: 0 auto;
  display: flex;
  background-color: #ffffff;
  border-radius: 8px;
  color: #111827;
}
.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}`;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <product id="101">
    <name>Pro Widget</name>
    <price currency="USD">29.99</price>
    <inStock>true</inStock>
  </product>
</catalog>`;

const SAMPLE_HTML = `<div class="hero-banner" id="main">
  <h1>Modern Client-Side Tools</h1>
  <p>100% private, local in-browser computation.</p>
  <button type="button" class="btn primary">Get Started</button>
</div>`;

const SAMPLE_MD = `# Antigravity Platform Guide

Welcome to the **100% private** developer tools platform.

## Quick Summary

- All processing happens in browser
- Zero server-side uploads
- Fast static Next.js export

| Metric | Target | Status |
|---|---|---|
| Tools | 975+ | Active |
| Speed | < 50ms | Passed |
`;

const parseHelper = (input: string) => parseLoose(input, false).value;

export const ops: Record<string, TextOp> = {
  // --- JSON to Code Generators ---
  "json-to-typescript": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [
      { id: "style", label: "Declaration style", type: "select", choices: [["interface", "interface"], ["type", "type alias"]], default: "interface" },
      { id: "rootName", label: "Root type name", type: "text", default: "RootConfig" },
      { id: "exported", label: "Add export keyword", type: "checkbox", default: true }
    ],
    outputLabel: "TypeScript types",
    outputExt: "ts",
    run(input, options) {
      const val = parseHelper(input);
      const rootName = String(options.rootName || "Root");
      const { root } = inferSchema(val, rootName);
      return codegenA.toTypeScript(root, String(options.style || "interface"), Boolean(options.exported));
    }
  },

  "json-to-zod": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root schema name", type: "text", default: "RootConfig" }],
    outputLabel: "Zod schemas",
    outputExt: "ts",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toZod(root);
    }
  },

  "json-to-yup": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root schema name", type: "text", default: "RootConfig" }],
    outputLabel: "Yup schemas",
    outputExt: "ts",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toYup(root);
    }
  },

  "json-to-jsdoc": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root type name", type: "text", default: "RootConfig" }],
    outputLabel: "JSDoc typedefs",
    outputExt: "js",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toJsDoc(root);
    }
  },

  "json-to-go": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root struct name", type: "text", default: "RootConfig" }],
    outputLabel: "Go structs",
    outputExt: "go",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toGo(root, String(options.rootName || "Root"));
    }
  },

  "json-to-rust": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root struct name", type: "text", default: "RootConfig" }],
    outputLabel: "Rust structs",
    outputExt: "rs",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toRust(root);
    }
  },

  "json-to-pydantic": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "Python Pydantic models",
    outputExt: "py",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toPydantic(root);
    }
  },

  "json-to-python-dataclass": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "Python dataclasses",
    outputExt: "py",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toDataclass(root);
    }
  },

  "json-to-java": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "Java classes",
    outputExt: "java",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toJava(root);
    }
  },

  "json-to-csharp": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [
      { id: "rootName", label: "Root type name", type: "text", default: "RootConfig" },
      { id: "namespace", label: "Namespace", type: "text", default: "Models" }
    ],
    outputLabel: "C# models",
    outputExt: "cs",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toCSharp(root, String(options.namespace || "Models"));
    }
  },

  "json-to-kotlin": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "Kotlin data classes",
    outputExt: "kt",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenA.toKotlin(root);
    }
  },

  "json-to-swift": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root struct name", type: "text", default: "RootConfig" }],
    outputLabel: "Swift Codable structs",
    outputExt: "swift",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenB.toSwift(root);
    }
  },

  "json-to-php": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "PHP typed classes",
    outputExt: "php",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenB.toPhp(root);
    }
  },

  "json-to-dart": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "rootName", label: "Root class name", type: "text", default: "RootConfig" }],
    outputLabel: "Dart classes",
    outputExt: "dart",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.rootName || "Root"));
      return codegenB.toDart(root);
    }
  },

  "json-to-prisma": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "modelName", label: "Prisma model name", type: "text", default: "Item" }],
    outputLabel: "Prisma schema model",
    outputExt: "prisma",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.modelName || "Item"));
      return codegenB.toPrisma(root, String(options.modelName || "Item"));
    }
  },

  "json-to-graphql": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    outputLabel: "GraphQL schema SDL",
    outputExt: "graphql",
    run(input) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, "Item");
      return codegenB.toGraphQL(root);
    }
  },

  "json-to-sql-create": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [
      { id: "table", label: "Table name", type: "text", default: "items" },
      { id: "dialect", label: "SQL Dialect", type: "select", choices: [["postgres", "PostgreSQL"], ["mysql", "MySQL"], ["sqlite", "SQLite"]], default: "postgres" }
    ],
    outputLabel: "SQL CREATE TABLE statement",
    outputExt: "sql",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.table || "items"));
      return codegenB.toSqlCreate(root, String(options.table || "items"), options.dialect as codegenB.Dialect);
    }
  },

  "json-to-sql-insert": {
    input: { label: "JSON input (object or array of objects)", example: SAMPLE_JSON, rows: 12 },
    options: [
      { id: "table", label: "Table name", type: "text", default: "items" },
      { id: "dialect", label: "SQL Dialect", type: "select", choices: [["postgres", "PostgreSQL"], ["mysql", "MySQL"], ["sqlite", "SQLite"]], default: "postgres" }
    ],
    outputLabel: "SQL INSERT statements",
    outputExt: "sql",
    run(input, options) {
      const val = parseHelper(input);
      return codegenB.toSqlInsert(val, String(options.table || "items"), options.dialect as codegenB.Dialect);
    }
  },

  "json-to-json-schema": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    outputLabel: "JSON Schema (Draft-07)",
    outputExt: "json",
    run(input) {
      const val = parseHelper(input);
      const { root, topIsArray } = inferSchema(val, "Root");
      return codegenB.toJsonSchema(root, topIsArray, "Root");
    }
  },

  "json-to-protobuf": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 12 },
    options: [{ id: "messageName", label: "Proto message name", type: "text", default: "Item" }],
    outputLabel: "Protobuf proto3 schema",
    outputExt: "proto",
    run(input, options) {
      const val = parseHelper(input);
      const { root } = inferSchema(val, String(options.messageName || "Item"));
      return codegenB.toProtobuf(root, String(options.messageName || "Item"));
    }
  },

  // --- JSON Manipulation Tools ---
  "json-prettify": {
    input: { label: "Raw or minified JSON", example: '{"id":1,"title":"Localtools","tags":["crypto","pdf"]}', rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["2", "2 spaces"], ["4", "4 spaces"], ["\t", "Tabs"]], default: "2" }],
    outputLabel: "Prettified JSON",
    outputExt: "json",
    run(input, options) {
      const val = parseHelper(input);
      const indent = options.indent === "\t" ? "\t" : Number(options.indent || 2);
      return JSON.stringify(val, null, indent) + "\n";
    }
  },

  "json-minify": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "Minified JSON",
    outputExt: "json",
    run(input) {
      const val = parseHelper(input);
      return JSON.stringify(val);
    }
  },

  "json-to-js-literal": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 10 },
    options: [{ id: "quote", label: "Quote style", type: "select", choices: [['"', 'Double (")'], ["'", "Single (')"]], default: '"' }],
    outputLabel: "JavaScript Object Literal",
    outputExt: "js",
    run(input, options) {
      const val = parseHelper(input);
      return toJsLiteral(val, String(options.quote || '"'), true, "  ");
    }
  },

  "json-tree-outline": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "Tree Outline",
    outputExt: "txt",
    run(input) {
      const val = parseHelper(input);
      return treeOutline(val, 10);
    }
  },

  "json-leaf-paths": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "Leaf Property Paths",
    outputExt: "txt",
    run(input) {
      const val = parseHelper(input);
      return leafPaths(val, true).join("\n") + "\n";
    }
  },

  "json-diff": {
    input: { label: "Original JSON (A)", example: SAMPLE_DIFF_A, rows: 8 },
    second: { label: "Modified JSON (B)", example: SAMPLE_DIFF_B, placeholder: "Paste second JSON..." },
    outputLabel: "JSON Differences",
    outputExt: "txt",
    run(input, _opts, second) {
      const a = parseHelper(input);
      const b = parseHelper(second || input);
      const diffs = jsonDiff(a, b);
      return diffs.length ? diffs.join("\n") + "\n" : "No differences detected. Both JSON objects are identical.\n";
    }
  },

  "json-deep-merge": {
    input: { label: "Base JSON", example: SAMPLE_DIFF_A, rows: 8 },
    second: { label: "Patch JSON", example: SAMPLE_DIFF_B, placeholder: "Paste patch JSON..." },
    options: [{ id: "arrays", label: "Array merge strategy", type: "select", choices: [["replace", "Replace"], ["concat", "Concatenate"], ["union", "Deduplicated Union"]], default: "replace" }],
    outputLabel: "Merged JSON",
    outputExt: "json",
    run(input, options, second) {
      const base = parseHelper(input);
      const patch = parseHelper(second || input);
      const merged = deepMerge(base, patch, String(options.arrays || "replace"));
      return JSON.stringify(merged, null, 2) + "\n";
    }
  },

  "json-sort-keys": {
    input: { label: "JSON input", example: '{"z": 1, "a": 2, "m": { "c": 3, "b": 4 }}', rows: 8 },
    options: [{ id: "order", label: "Key order", type: "select", choices: [["asc", "Ascending (A to Z)"], ["desc", "Descending (Z to A)"]], default: "asc" }],
    outputLabel: "Key-Sorted JSON",
    outputExt: "json",
    run(input, options) {
      const val = parseHelper(input);
      const sorted = sortKeys(val, String(options.order || "asc"));
      return JSON.stringify(sorted, null, 2) + "\n";
    }
  },

  "jsonpath-evaluator": {
    input: { label: "JSON document", example: SAMPLE_JSON, rows: 10 },
    options: [{ id: "path", label: "JSONPath expression", type: "text", default: "$.tags[*]" }],
    outputLabel: "Query Results",
    outputExt: "json",
    run(input, options) {
      const val = parseHelper(input);
      const rawPath = typeof options.path === "string" && options.path.trim().startsWith("$") ? options.path.trim() : "$.tags[*]";
      const matches = queryPath(val, rawPath);
      return JSON.stringify(matches, null, 2) + "\n";
    }
  },

  "json-schema-validator": {
    input: { label: "JSON Schema", example: '{"type":"object","properties":{"id":{"type":"number"},"name":{"type":"string"}},"required":["id","name"]}', rows: 8 },
    second: { label: "JSON data to validate", example: '{"id": 42, "name": "Antigravity"}' },
    outputLabel: "Validation Status",
    outputExt: "txt",
    run(input, _opts, second) {
      const schema = parseHelper(input);
      const data = parseHelper(second || "{}");
      const errs = validateSchema(data, schema as JsonObject);
      return errs.length ? `INVALID (found ${errs.length} issues):\n\n` + errs.map(e => `• ${e}`).join("\n") + "\n" : "VALID: Data strictly adheres to the schema.\n";
    }
  },

  "json-schema-sample-generator": {
    input: { label: "JSON Schema", example: '{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"},"active":{"type":"boolean"},"roles":{"type":"array","items":{"type":"string"}}}}', rows: 10 },
    outputLabel: "Sample JSON Data",
    outputExt: "json",
    run(input) {
      const schema = parseHelper(input);
      const sample = sampleFromSchema(schema, false);
      return JSON.stringify(sample, null, 2) + "\n";
    }
  },

  // --- Formats & Config Converters ---
  "json-to-yaml": {
    input: { label: "JSON input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "YAML output",
    outputExt: "yaml",
    run(input) {
      const val = parseHelper(input);
      return formats.toYaml(val, false);
    }
  },

  "json-to-toml": {
    input: { label: "JSON object input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "TOML output",
    outputExt: "toml",
    run(input) {
      const val = parseHelper(input);
      return formats.toToml(val);
    }
  },

  "jsonl-to-array": {
    input: { label: "JSON Lines (one JSON per line)", example: '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n{"id":3,"name":"Charlie"}', rows: 8 },
    outputLabel: "JSON Array",
    outputExt: "json",
    run(input) {
      const arr = formats.jsonLinesToArray(input);
      return JSON.stringify(arr, null, 2) + "\n";
    }
  },

  "array-to-jsonl": {
    input: { label: "JSON Array input", example: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]', rows: 8 },
    outputLabel: "JSON Lines",
    outputExt: "jsonl",
    run(input) {
      const val = parseHelper(input);
      if (!Array.isArray(val)) throw new Error("Input must be a JSON array.");
      return val.map(item => JSON.stringify(item)).join("\n") + "\n";
    }
  },

  "env-to-json": {
    input: { label: ".env file input", example: 'PORT=3000\nDATABASE_URL="postgres://localhost:5432/db"\nDEBUG=true\nTIMEOUT_MS=5000', rows: 8 },
    outputLabel: "JSON Object",
    outputExt: "json",
    run(input) {
      const obj = formats.parseEnv(input);
      return JSON.stringify(obj, null, 2) + "\n";
    }
  },

  "json-to-env": {
    input: { label: "Flat JSON object input", example: '{"PORT": 3000, "DEBUG": true, "APP_ENV": "production"}', rows: 8 },
    outputLabel: ".env output",
    outputExt: "env",
    run(input) {
      const val = parseHelper(input);
      return formats.toEnv(val, false);
    }
  },

  "properties-to-json": {
    input: { label: "Java .properties input", example: "server.port=8080\nspring.datasource.url=jdbc:postgresql://localhost/db\napp.enabled=true", rows: 8 },
    outputLabel: "JSON Object",
    outputExt: "json",
    run(input) {
      const obj = formats.parseProperties(input);
      return JSON.stringify(obj, null, 2) + "\n";
    }
  },

  "json-to-properties": {
    input: { label: "JSON object input", example: '{"server.port": 8080, "app.name": "Localtools"}', rows: 8 },
    outputLabel: "Java .properties output",
    outputExt: "properties",
    run(input) {
      const val = parseHelper(input);
      return formats.toProperties(val, false);
    }
  },

  "ini-to-json": {
    input: { label: "INI config input", example: '[database]\nhost = 127.0.0.1\nport = 5432\n\n[server]\nenable_tls = true', rows: 8 },
    outputLabel: "JSON Object",
    outputExt: "json",
    run(input) {
      const obj = formats.parseIni(input, false);
      return JSON.stringify(obj, null, 2) + "\n";
    }
  },

  "json-to-ini": {
    input: { label: "JSON object input", example: '{"database": {"host": "127.0.0.1", "port": 5432}, "server": {"tls": true}}', rows: 8 },
    outputLabel: "INI config output",
    outputExt: "ini",
    run(input) {
      const val = parseHelper(input);
      return formats.toIni(val);
    }
  },

  "json-flatten": {
    input: { label: "Nested JSON input", example: SAMPLE_JSON, rows: 10 },
    outputLabel: "Flattened Key-Value JSON",
    outputExt: "json",
    run(input) {
      const val = parseHelper(input);
      const flat = formats.flatten(val, ".", false);
      return JSON.stringify(flat, null, 2) + "\n";
    }
  },

  "json-unflatten": {
    input: { label: "Flattened dot-path JSON", example: '{"config.port": 3000, "config.debug": false, "name": "Localtools"}', rows: 8 },
    outputLabel: "Unflattened Nested JSON",
    outputExt: "json",
    run(input) {
      const val = parseHelper(input);
      const unflat = formats.unflatten(val as JsonObject, ".");
      return JSON.stringify(unflat, null, 2) + "\n";
    }
  },

  // --- CSS Tools ---
  "css-format": {
    input: { label: "CSS input", example: SAMPLE_CSS, rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["  ", "2 spaces"], ["    ", "4 spaces"], ["\t", "Tabs"]], default: "  " }],
    outputLabel: "Formatted CSS",
    outputExt: "css",
    run(input, options) {
      return css.formatCss(input, String(options.indent || "  "));
    }
  },

  "css-minify": {
    input: { label: "CSS input", example: SAMPLE_CSS, rows: 10 },
    outputLabel: "Minified CSS",
    outputExt: "css",
    run(input) {
      return css.minifyCss(input, false);
    }
  },

  "css-sort-properties": {
    input: { label: "CSS input", example: SAMPLE_CSS, rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["  ", "2 spaces"], ["    ", "4 spaces"]], default: "  " }],
    outputLabel: "CSS with Alphabetical Properties",
    outputExt: "css",
    run(input, options) {
      return css.sortCssProperties(input, String(options.indent || "  "));
    }
  },

  "css-to-js-object": {
    input: { label: "CSS declarations or rules", example: SAMPLE_CSS, rows: 10 },
    outputLabel: "CSS-in-JS Style Object",
    outputExt: "js",
    run(input) {
      return css.cssToJsObject(input);
    }
  },

  // --- HTML & Markup Tools ---
  "html-format": {
    input: { label: "HTML input", example: SAMPLE_HTML, rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["  ", "2 spaces"], ["    ", "4 spaces"], ["\t", "Tabs"]], default: "  " }],
    outputLabel: "Formatted HTML",
    outputExt: "html",
    run(input, options) {
      return markup.formatHtml(input, String(options.indent || "  "));
    }
  },

  "html-minify": {
    input: { label: "HTML input", example: SAMPLE_HTML, rows: 10 },
    outputLabel: "Minified HTML",
    outputExt: "html",
    run(input) {
      return markup.minifyHtml(input, false);
    }
  },

  "html-to-jsx": {
    input: { label: "HTML snippet", example: SAMPLE_HTML, rows: 10 },
    outputLabel: "React JSX",
    outputExt: "tsx",
    run(input) {
      return markup.htmlToJsx(input, "");
    }
  },

  "svg-to-jsx": {
    input: { label: "SVG code", example: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7"/></svg>', rows: 8 },
    outputLabel: "JSX SVG",
    outputExt: "tsx",
    run(input) {
      return markup.svgToJsx(input, false);
    }
  },

  "svg-to-react-component": {
    input: { label: "SVG code", example: '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/></svg>', rows: 8 },
    options: [{ id: "name", label: "Component name", type: "text", default: "IconCircle" }],
    outputLabel: "React Component",
    outputExt: "tsx",
    run(input, options) {
      return markup.svgToComponent(input, String(options.name || "Icon"), true);
    }
  },

  "svg-to-react-native": {
    input: { label: "SVG code", example: '<svg width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" fill="#10b981"/></svg>', rows: 8 },
    options: [{ id: "name", label: "Component name", type: "text", default: "IconRect" }],
    outputLabel: "React Native Svg Component",
    outputExt: "tsx",
    run(input, options) {
      return markup.svgToReactNative(input, String(options.name || "Icon"));
    }
  },

  "svg-optimizer": {
    input: { label: "SVG code", example: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <!-- Generator: Local -->\n  <path d="M 10 10 L 90 90" stroke="black"/>\n</svg>', rows: 8 },
    outputLabel: "Optimized SVG",
    outputExt: "svg",
    run(input) {
      return markup.optimizeSvg(input, 2, true);
    }
  },

  "html-to-pug": {
    input: { label: "HTML snippet", example: SAMPLE_HTML, rows: 10 },
    outputLabel: "Pug / Jade template",
    outputExt: "pug",
    run(input) {
      return markup.htmlToPug(input);
    }
  },

  "html-to-markdown": {
    input: { label: "HTML snippet", example: SAMPLE_HTML, rows: 10 },
    outputLabel: "Clean Markdown",
    outputExt: "md",
    run(input) {
      return md.htmlToMarkdown(input);
    }
  },

  "markdown-to-html": {
    input: { label: "Markdown input", example: SAMPLE_MD, rows: 10 },
    outputLabel: "HTML output",
    outputExt: "html",
    run(input) {
      return md.markdownToHtml(input);
    }
  },

  "markdown-table-formatter": {
    input: { label: "Markdown with unaligned tables", example: "| Col1 | Column Two |\n|---|---|\n| val | longer value |", rows: 8 },
    outputLabel: "Aligned Markdown Table",
    outputExt: "md",
    run(input) {
      return md.formatMarkdownTables(input);
    }
  },

  "markdown-toc-generator": {
    input: { label: "Markdown document", example: SAMPLE_MD, rows: 10 },
    options: [
      { id: "maxLevel", label: "Max heading depth", type: "number", default: 3, min: 1, max: 6 },
      { id: "ordered", label: "Ordered list (1. 2. vs - )", type: "checkbox", default: false }
    ],
    outputLabel: "Table of Contents",
    outputExt: "md",
    run(input, options) {
      return md.markdownToc(input, Number(options.maxLevel || 3), Boolean(options.ordered));
    }
  },

  "html-to-plain-text": {
    input: { label: "HTML content", example: SAMPLE_HTML, rows: 10 },
    outputLabel: "Plain Text",
    outputExt: "txt",
    run(input) {
      return markup.htmlToText(input);
    }
  },

  // --- XML Tools ---
  "xml-format": {
    input: { label: "XML input", example: SAMPLE_XML, rows: 10 },
    options: [{ id: "indent", label: "Indentation", type: "select", choices: [["  ", "2 spaces"], ["    ", "4 spaces"], ["\t", "Tabs"]], default: "  " }],
    outputLabel: "Formatted XML",
    outputExt: "xml",
    run(input, options) {
      return xml.formatXml(input, String(options.indent || "  "));
    }
  },

  "xml-minify": {
    input: { label: "XML input", example: SAMPLE_XML, rows: 10 },
    outputLabel: "Minified XML",
    outputExt: "xml",
    run(input) {
      return xml.minifyXml(input, false);
    }
  },

  "xml-to-json": {
    input: { label: "XML input", example: SAMPLE_XML, rows: 10 },
    options: [{ id: "attrPrefix", label: "Attribute prefix", type: "text", default: "@" }],
    outputLabel: "JSON output",
    outputExt: "json",
    run(input, options) {
      const obj = xml.xmlToJson(input, String(options.attrPrefix ?? "@"));
      return JSON.stringify(obj, null, 2) + "\n";
    }
  },

  "json-to-xml": {
    input: { label: "JSON input", example: '{"product": {"name": "Pro Widget", "price": 29.99, "inStock": true}}', rows: 8 },
    options: [
      { id: "rootTag", label: "XML Root Tag", type: "text", default: "root" },
      { id: "attrPrefix", label: "Attribute prefix", type: "text", default: "@" },
      { id: "declaration", label: "Include <?xml...?> declaration", type: "checkbox", default: true }
    ],
    outputLabel: "XML output",
    outputExt: "xml",
    run(input, options) {
      const val = parseHelper(input);
      const rootTag = String(options.rootTag || "root");
      const attrPrefix = String(options.attrPrefix ?? "@");
      const declaration = Boolean(options.declaration);
      return xml.jsonToXml(val, rootTag, attrPrefix, "  ", declaration);
    }
  },

  "xml-stats": {
    input: { label: "XML input", example: SAMPLE_XML, rows: 10 },
    outputLabel: "XML Structure Metrics",
    outputExt: "txt",
    run(input) {
      return xml.xmlStats(input);
    }
  },

  ...advancedDevOps,
};
