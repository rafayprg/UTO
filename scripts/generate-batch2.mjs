// Generator for Batch 2 catalog files: dev.ts, data.ts, image.ts, media.ts
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// --- 1. DEV CATALOG (65 tools) ---
const devRows = [
  // JSON to Code Generators
  ["json-to-typescript", "JSON to TypeScript Interfaces", "Convert sample JSON into strict, strongly-typed TypeScript interfaces or type aliases.", ["json to typescript", "ts interface", "typescript types"], "json-to-typescript", "JSON to Code Generators"],
  ["json-to-zod", "JSON to Zod Schema Generator", "Infer runtime validation schemas and TypeScript types with Zod from sample JSON data.", ["json to zod", "zod schema", "runtime validation"], "json-to-zod", "JSON to Code Generators"],
  ["json-to-yup", "JSON to Yup Schema Generator", "Convert JSON data into Yup object validation schemas for form and payload checks.", ["json to yup", "yup schema", "form validation"], "json-to-yup", "JSON to Code Generators"],
  ["json-to-jsdoc", "JSON to JSDoc Typedef Generator", "Generate JSDoc @typedef declarations from JSON for typed vanilla JavaScript codebases.", ["json to jsdoc", "jsdoc typedef", "vanilla js types"], "json-to-jsdoc", "JSON to Code Generators"],
  ["json-to-go", "JSON to Go Struct Generator", "Convert JSON payloads into idiomatic Go structs with json tags and correct types.", ["json to go", "go struct", "golang json"], "json-to-go", "JSON to Code Generators"],
  ["json-to-rust", "JSON to Rust Struct Generator", "Generate idiomatic Rust structs with Serde Serialize and Deserialize derives.", ["json to rust", "rust struct", "serde json"], "json-to-rust", "JSON to Code Generators"],
  ["json-to-pydantic", "JSON to Pydantic Model Generator", "Generate Pydantic v2 BaseModel classes with type annotations from sample JSON.", ["json to pydantic", "pydantic model", "fastapi schema"], "json-to-pydantic", "JSON to Code Generators"],
  ["json-to-python-dataclass", "JSON to Python Dataclass Generator", "Convert JSON objects into clean Python 3.10+ @dataclass definitions.", ["json to python dataclass", "python dataclass", "type hints"], "json-to-python-dataclass", "JSON to Code Generators"],
  ["json-to-java", "JSON to Java Class Generator", "Convert JSON into Java POJO classes with private fields and getters/setters.", ["json to java", "java pojo", "jackson model"], "json-to-java", "JSON to Code Generators"],
  ["json-to-csharp", "JSON to C# Record & Class Generator", "Generate strongly typed C# record or class models from JSON with JsonProperty tags.", ["json to csharp", "c# record", "dotnet json"], "json-to-csharp", "JSON to Code Generators"],
  ["json-to-kotlin", "JSON to Kotlin Data Class Generator", "Convert JSON payloads into Kotlin data classes with kotlinx.serialization tags.", ["json to kotlin", "kotlin data class", "android json"], "json-to-kotlin", "JSON to Code Generators"],
  ["json-to-swift", "JSON to Swift Codable Struct Generator", "Generate Swift struct definitions conforming to Codable with CodingKeys.", ["json to swift", "swift codable", "ios json"], "json-to-swift", "JSON to Code Generators"],
  ["json-to-php", "JSON to PHP Typed Class Generator", "Convert JSON data into modern PHP 8.2+ typed classes with constructor promotion.", ["json to php", "php typed class", "php 8"], "json-to-php", "JSON to Code Generators"],
  ["json-to-dart", "JSON to Dart Class Generator", "Generate Flutter and Dart classes with fromJson and toJson serialization methods.", ["json to dart", "dart class", "flutter model"], "json-to-dart", "JSON to Code Generators"],
  ["json-to-prisma", "JSON to Prisma Schema Model Generator", "Infer relational database models for Prisma ORM schema.prisma from JSON data.", ["json to prisma", "prisma schema", "orm model"], "json-to-prisma", "JSON to Code Generators"],
  ["json-to-graphql", "JSON to GraphQL Type Definition", "Convert JSON objects into GraphQL SDL schema type definitions and scalar types.", ["json to graphql", "graphql sdl", "graphql schema"], "json-to-graphql", "JSON to Code Generators"],
  ["json-to-sql-create", "JSON to SQL CREATE TABLE Generator", "Infer column names and SQL types (PostgreSQL, MySQL, SQLite) from sample JSON.", ["json to sql", "create table", "sql schema"], "json-to-sql-create", "JSON to Code Generators"],
  ["json-to-sql-insert", "JSON to SQL INSERT Statements", "Convert JSON arrays or objects into parameterized SQL INSERT INTO statements.", ["json to sql insert", "sql insert", "data migration"], "json-to-sql-insert", "JSON to Code Generators"],
  ["json-to-json-schema", "JSON to JSON Schema Generator", "Generate Draft-07 JSON Schema with type annotations and required fields from data.", ["json to json schema", "draft 07", "schema generator"], "json-to-json-schema", "JSON to Code Generators"],
  ["json-to-protobuf", "JSON to Protocol Buffers (proto3)", "Generate Google Protocol Buffers proto3 message declarations from JSON structures.", ["json to protobuf", "proto3", "grpc message"], "json-to-protobuf", "JSON to Code Generators"],

  // JSON Manipulation Tools
  ["json-prettify", "JSON Prettifier & Formatter", "Beautify, indent, and format messy or compact JSON with customizable spacing.", ["json prettify", "beautify json", "json formatter"], "json-prettify", "JSON Manipulation Tools"],
  ["json-minify", "JSON Minifier & Compressor", "Strip whitespace and newlines from JSON to minimize payload size for network transfer.", ["json minify", "compress json", "strip whitespace"], "json-minify", "JSON Manipulation Tools"],
  ["json-to-js-literal", "JSON to JavaScript Object Literal", "Convert strict double-quoted JSON into clean JavaScript object literal syntax.", ["json to js literal", "js object", "unquoted keys"], "json-to-js-literal", "JSON Manipulation Tools"],
  ["json-tree-outline", "JSON Tree Outline Visualizer", "Visualize complex nested JSON documents as a clear, indented structural outline.", ["json tree", "outline visualizer", "json hierarchy"], "json-tree-outline", "JSON Manipulation Tools"],
  ["json-leaf-paths", "JSON Leaf Property Paths Extractor", "Extract every terminal dot-delimited key path and data type from nested JSON.", ["json leaf paths", "property paths", "key inspector"], "json-leaf-paths", "JSON Manipulation Tools"],
  ["json-diff", "JSON Diff & Comparison Tool", "Compare two JSON documents side by side to detect added, removed, or changed properties.", ["json diff", "compare json", "json changes"], "json-diff", "JSON Manipulation Tools"],
  ["json-deep-merge", "JSON Deep Merge Tool", "Deep merge two JSON objects with configurable array concatenation or replacement.", ["json deep merge", "merge json", "patch json"], "json-deep-merge", "JSON Manipulation Tools"],
  ["json-sort-keys", "JSON Alphabetical Key Sorter", "Sort all object keys in a JSON document alphabetically in ascending or descending order.", ["json sort keys", "alphabetize json", "canonical json"], "json-sort-keys", "JSON Manipulation Tools"],
  ["jsonpath-evaluator", "JSONPath Expression Evaluator", "Query and extract nested properties and arrays using standard JSONPath syntax.", ["jsonpath", "json query", "filter json"], "jsonpath-evaluator", "JSON Manipulation Tools"],
  ["json-schema-validator", "JSON Schema Validator", "Validate JSON documents against a JSON Schema to verify strict structural compliance.", ["json schema validator", "validate json", "schema check"], "json-schema-validator", "JSON Manipulation Tools"],
  ["json-schema-sample-generator", "JSON Schema Sample Data Generator", "Generate realistic mock JSON sample data from a JSON Schema specification.", ["sample from schema", "mock json data", "test generator"], "json-schema-sample-generator", "JSON Manipulation Tools"],

  // Formats & Config Converters
  ["json-to-yaml", "JSON to YAML Converter", "Convert JSON documents into clean, human-readable YAML with proper indentation.", ["json to yaml", "yaml converter", "config migration"], "json-to-yaml", "Formats & Config Converters"],
  ["json-to-toml", "JSON to TOML Converter", "Convert JSON data into TOML configuration format for Rust and Python packaging.", ["json to toml", "toml converter", "pyproject toml"], "json-to-toml", "Formats & Config Converters"],
  ["jsonl-to-array", "JSON Lines to JSON Array Converter", "Convert newline-delimited JSON Lines (JSONL / NDJSON) into a standard JSON array.", ["jsonl to array", "ndjson to json", "json lines"], "jsonl-to-array", "Formats & Config Converters"],
  ["array-to-jsonl", "JSON Array to JSON Lines (JSONL)", "Convert standard JSON arrays into newline-delimited JSON Lines for streaming and logs.", ["array to jsonl", "json to ndjson", "json lines"], "array-to-jsonl", "Formats & Config Converters"],
  ["env-to-json", ".env File to JSON Converter", "Parse .env environment variable files into structured key-value JSON objects.", ["env to json", "dotenv converter", "environment variables"], "env-to-json", "Formats & Config Converters"],
  ["json-to-env", "JSON to .env File Converter", "Convert flat JSON key-value objects into standard dotenv .env configuration files.", ["json to env", "dotenv generator", "config export"], "json-to-env", "Formats & Config Converters"],
  ["properties-to-json", "Java .properties to JSON Converter", "Convert Java .properties application configuration files into nested JSON.", ["properties to json", "java properties", "spring config"], "properties-to-json", "Formats & Config Converters"],
  ["json-to-properties", "JSON to Java .properties Converter", "Convert JSON objects into flat dot-delimited Java .properties configuration files.", ["json to properties", "java properties", "spring properties"], "json-to-properties", "Formats & Config Converters"],
  ["ini-to-json", "INI Configuration to JSON Converter", "Convert section-based INI configuration files into structured nested JSON.", ["ini to json", "ini parser", "config conversion"], "ini-to-json", "Formats & Config Converters"],
  ["json-to-ini", "JSON to INI Configuration Converter", "Convert nested JSON objects into section-based INI configuration format.", ["json to ini", "ini generator", "config export"], "json-to-ini", "Formats & Config Converters"],
  ["json-flatten", "Flatten Nested JSON (Dot Notation)", "Flatten deeply nested JSON objects into single-level dot-separated key paths.", ["flatten json", "dot notation", "key flatten"], "json-flatten", "Formats & Config Converters"],
  ["json-unflatten", "Unflatten Dot Notation to Nested JSON", "Reconstruct deeply nested hierarchical JSON objects from flat dot-separated keys.", ["unflatten json", "nested json", "dot paths"], "json-unflatten", "Formats & Config Converters"],

  // CSS Tools
  ["css-format", "CSS Beautifier & Formatter", "Format and beautify unorganized CSS with consistent spacing and indentation.", ["css format", "beautify css", "css prettifier"], "css-format", "CSS Tools"],
  ["css-minify", "CSS Minifier & Compressor", "Strip comments, unnecessary spaces, and line breaks to minimize stylesheet size.", ["css minify", "compress css", "clean css"], "css-minify", "CSS Tools"],
  ["css-sort-properties", "CSS Property Alphabetical Sorter", "Sort CSS declarations inside rule blocks alphabetically or by idiomatic convention.", ["css sort properties", "alphabetize css", "clean css"], "css-sort-properties", "CSS Tools"],
  ["css-to-js-object", "CSS to JavaScript / CSS-in-JS Object", "Convert CSS rule blocks into camelCase JavaScript style objects for styled-components.", ["css to js object", "css in js", "camelcase style"], "css-to-js-object", "CSS Tools"],

  // HTML & Markup Tools
  ["html-format", "HTML Beautifier & Formatter", "Format and indent raw or messy HTML with clean tag hierarchies.", ["html format", "beautify html", "html prettifier"], "html-format", "HTML & Markup Tools"],
  ["html-minify", "HTML Minifier & Compressor", "Strip HTML comments, collapse whitespace, and minimize markup document size.", ["html minify", "compress html", "html cleaner"], "html-minify", "HTML & Markup Tools"],
  ["html-to-jsx", "HTML to React JSX Converter", "Convert HTML markup into valid JSX with className, htmlFor, and camelCase attributes.", ["html to jsx", "jsx converter", "react jsx"], "html-to-jsx", "HTML & Markup Tools"],
  ["svg-to-jsx", "SVG to React JSX Converter", "Convert raw SVG elements into valid React JSX with camelCase attributes and clean tags.", ["svg to jsx", "react svg", "jsx converter"], "svg-to-jsx", "HTML & Markup Tools"],
  ["svg-to-react-component", "SVG to React Component Generator", "Package SVG icons and graphics into self-contained, typed React functional components.", ["svg to component", "react icon component", "svg component"], "svg-to-react-component", "HTML & Markup Tools"],
  ["svg-to-react-native", "SVG to React Native Svg Component", "Convert SVG markup into React Native SVG elements (Svg, Path, Rect, Circle).", ["svg to react native", "react native svg", "mobile icon"], "svg-to-react-native", "HTML & Markup Tools"],
  ["svg-optimizer", "SVG Optimizer & Cleaner", "Strip editor metadata, comments, and redundant tags to produce clean, compact SVGs.", ["svg optimizer", "clean svg", "svg minifier"], "svg-optimizer", "HTML & Markup Tools"],
  ["html-to-pug", "HTML to Pug / Jade Template Converter", "Convert standard HTML markup into concise, whitespace-sensitive Pug template syntax.", ["html to pug", "jade template", "pug converter"], "html-to-pug", "HTML & Markup Tools"],
  ["html-to-markdown", "HTML to Clean Markdown Converter", "Convert rich HTML snippets into standard readable CommonMark Markdown text.", ["html to markdown", "html to md", "markdown converter"], "html-to-markdown", "HTML & Markup Tools"],
  ["markdown-to-html", "Markdown to HTML Converter", "Compile CommonMark Markdown headings, lists, tables, and blockquotes into clean HTML.", ["markdown to html", "md to html", "markdown compiler"], "markdown-to-html", "HTML & Markup Tools"],
  ["markdown-table-formatter", "Markdown Table Formatter & Aligner", "Align pipes and column widths across Markdown tables for beautiful monospaced viewing.", ["markdown table formatter", "align tables", "markdown pipes"], "markdown-table-formatter", "HTML & Markup Tools"],
  ["markdown-toc-generator", "Markdown Table of Contents Generator", "Generate an anchored, clickable Table of Contents outline from document headings.", ["markdown toc", "table of contents", "heading links"], "markdown-toc-generator", "HTML & Markup Tools"],
  ["html-to-plain-text", "HTML to Plain Text Stripper", "Strip all HTML tags and decode entities to extract clean, unformatted readable text.", ["html to text", "strip html tags", "text extractor"], "html-to-plain-text", "HTML & Markup Tools"],

  // XML Tools
  ["xml-format", "XML Beautifier & Formatter", "Beautify, indent, and format raw or compact XML documents with clean hierarchy.", ["xml format", "beautify xml", "xml prettifier"], "xml-format", "XML Tools"],
  ["xml-minify", "XML Minifier & Compressor", "Strip unnecessary whitespace and newlines from XML to reduce data payload size.", ["xml minify", "compress xml", "xml cleaner"], "xml-minify", "XML Tools"],
  ["xml-to-json", "XML to JSON Converter", "Convert XML document trees and attributes into structured nested JSON objects.", ["xml to json", "xml converter", "parse xml"], "xml-to-json", "XML Tools"],
  ["json-to-xml", "JSON to XML Converter", "Convert structured JSON data into valid, well-formed XML documents with custom root tags.", ["json to xml", "xml generator", "export xml"], "json-to-xml", "XML Tools"],
  ["xml-stats", "XML Document Structure Metrics & Stats", "Inspect tag count, max element nesting depth, attribute metrics, and node distributions.", ["xml stats", "xml metrics", "inspect xml"], "xml-stats", "XML Tools"],
];

// --- 2. DATA CATALOG (25 tools) ---
const dataRows = [
  // Delimited & Tabular Converters
  ["csv-to-json", "CSV to JSON Converter", "Convert CSV spreadsheet rows into an array of structured JSON objects with typed numbers.", ["csv to json", "csv converter", "parse csv"], "csv-to-json", "Delimited & Tabular Converters"],
  ["json-to-csv", "JSON to CSV Converter", "Convert an array of JSON objects into standard RFC-4180 CSV with escaped quotes.", ["json to csv", "export csv", "json converter"], "json-to-csv", "Delimited & Tabular Converters"],
  ["csv-to-tsv", "CSV to TSV Converter", "Convert comma-separated CSV into tab-separated TSV values.", ["csv to tsv", "tab separated", "tsv converter"], "csv-to-tsv", "Delimited & Tabular Converters"],
  ["tsv-to-csv", "TSV to CSV Converter", "Convert tab-separated TSV files into standard RFC-4180 comma-separated CSV spreadsheets.", ["tsv to csv", "tab to comma", "csv export"], "tsv-to-csv", "Delimited & Tabular Converters"],
  ["tsv-to-json", "TSV to JSON Converter", "Convert tab-separated TSV text with headers into an array of JSON objects.", ["tsv to json", "parse tsv", "json array"], "tsv-to-json", "Delimited & Tabular Converters"],
  ["json-to-tsv", "JSON to TSV Converter", "Convert an array of JSON objects into tab-separated values for easy spreadsheet pasting.", ["json to tsv", "export tsv", "excel copy"], "json-to-tsv", "Delimited & Tabular Converters"],
  ["csv-to-markdown", "CSV to Markdown Table Converter", "Turn raw CSV spreadsheets into clean, monospaced Markdown tables with aligned pipes.", ["csv to markdown", "markdown table", "table generator"], "csv-to-markdown", "Delimited & Tabular Converters"],
  ["markdown-to-csv", "Markdown Table to CSV Converter", "Convert Markdown pipe-delimited tables into standard downloadable CSV spreadsheets.", ["markdown to csv", "table to csv", "export table"], "markdown-to-csv", "Delimited & Tabular Converters"],
  ["csv-to-html-table", "CSV to HTML Table Converter", "Convert CSV spreadsheets into accessible HTML table markup with thead and tbody.", ["csv to html table", "html table", "table generator"], "csv-to-html-table", "Delimited & Tabular Converters"],
  ["csv-to-sql-insert", "CSV to SQL INSERT Statements", "Generate SQL INSERT INTO statements from CSV rows for database seeding and migrations.", ["csv to sql", "sql insert", "database seed"], "csv-to-sql-insert", "Delimited & Tabular Converters"],
  ["csv-to-jsonl", "CSV to JSON Lines (JSONL) Converter", "Convert CSV records into newline-delimited JSON Lines (JSONL) for BigQuery and pipelines.", ["csv to jsonl", "ndjson", "data streaming"], "csv-to-jsonl", "Delimited & Tabular Converters"],
  ["jsonl-to-csv", "JSON Lines (JSONL) to CSV Converter", "Convert newline-delimited JSON Lines files into standard comma-separated CSV tables.", ["jsonl to csv", "ndjson to csv", "export logs"], "jsonl-to-csv", "Delimited & Tabular Converters"],
  ["csv-to-ascii-grid", "CSV to ASCII Grid Table", "Render CSV tables into beautiful box-drawing ASCII/Unicode terminal grid tables.", ["csv to ascii table", "grid table", "terminal table"], "csv-to-ascii-grid", "Delimited & Tabular Converters"],

  // CSV Manipulation & Cleaning
  ["csv-column-extractor", "CSV Column Extractor", "Extract and isolate specific columns from large CSV files by name or column index.", ["csv column extractor", "extract columns", "filter columns"], "csv-column-extractor", "CSV Manipulation & Cleaning"],
  ["csv-column-reorder", "CSV Column Reorder Tool", "Rearrange the sequence of columns in a CSV table using custom order definitions.", ["csv column reorder", "rearrange columns", "sort columns"], "csv-column-reorder", "CSV Manipulation & Cleaning"],
  ["csv-column-remover", "CSV Column Remover", "Strip out unwanted or sensitive columns from CSV spreadsheets while preserving the rest.", ["csv column remover", "delete columns", "remove fields"], "csv-column-remover", "CSV Manipulation & Cleaning"],
  ["csv-transpose", "CSV Transpose & Pivot (90°)", "Flip rows and columns in a CSV table so rows become columns and columns become rows.", ["csv transpose", "pivot table", "swap rows columns"], "csv-transpose", "CSV Manipulation & Cleaning"],
  ["csv-sort-by-column", "CSV Sort by Column", "Sort CSV rows by any column numerically or alphabetically in ascending or descending order.", ["csv sort", "sort by column", "order csv rows"], "csv-sort-by-column", "CSV Manipulation & Cleaning"],
  ["csv-deduplicate", "CSV Duplicate Row Remover", "Detect and remove duplicate rows from CSV files to ensure dataset uniqueness.", ["csv deduplicate", "remove duplicate rows", "unique csv"], "csv-deduplicate", "CSV Manipulation & Cleaning"],
  ["csv-filter-rows", "CSV Row Filter by Keyword", "Keep or drop CSV rows that contain specific text queries or keywords in their cells.", ["csv filter", "filter rows", "search csv"], "csv-filter-rows", "CSV Manipulation & Cleaning"],
  ["csv-delimiter-converter", "CSV Delimiter Converter", "Change delimiter separators between comma, semicolon, tab, and pipe in seconds.", ["csv delimiter converter", "change delimiter", "semicolon to comma"], "csv-delimiter-converter", "CSV Manipulation & Cleaning"],
  ["csv-header-case", "CSV Header Case Converter", "Normalize CSV headers into snake_case, camelCase, UPPERCASE, or Title Case.", ["csv header case", "normalize headers", "snake case headers"], "csv-header-case", "CSV Manipulation & Cleaning"],
  ["csv-trim-whitespace", "CSV Whitespace Trimmer", "Strip accidental leading and trailing whitespace from every single cell in a CSV.", ["csv trim whitespace", "clean spaces", "csv polish"], "csv-trim-whitespace", "CSV Manipulation & Cleaning"],
  ["csv-remove-empty-rows", "CSV Empty Row Cleaner", "Remove blank, empty, and whitespace-only lines from CSV documents.", ["csv remove empty rows", "clean blank rows", "sanitize csv"], "csv-remove-empty-rows", "CSV Manipulation & Cleaning"],
  ["csv-stats-analyzer", "CSV Data Profiler & Statistics", "Analyze row count, column count, empty cell percentages, and unique value counts.", ["csv stats", "data profiler", "inspect dataset"], "csv-stats-analyzer", "CSV Manipulation & Cleaning"],
];

// --- 3. IMAGE / CSS CATALOG (15 tools) ---
const imageRows = [
  // CSS Visual & Styling Generators
  ["css-linear-gradient", "CSS Linear Gradient Generator", "Create smooth multi-stop CSS linear gradients with live direction angle and color stops.", ["css linear gradient", "gradient generator", "css background"], "css-linear-gradient", "CSS Visual & Styling Generators"],
  ["css-radial-gradient", "CSS Radial Gradient Generator", "Generate radial-gradient backgrounds with customizable center origin and color stops.", ["css radial gradient", "radial background", "css gradient"], "css-radial-gradient", "CSS Visual & Styling Generators"],
  ["css-conic-gradient", "CSS Conic Gradient Generator", "Generate 360-degree conic gradients for pie charts, color wheels, and angle effects.", ["css conic gradient", "color wheel", "conic background"], "css-conic-gradient", "CSS Visual & Styling Generators"],
  ["css-box-shadow", "CSS Box Shadow Generator", "Design single and multi-layer soft drop shadows with spread, blur, and inset options.", ["css box shadow", "drop shadow generator", "elevation"], "css-box-shadow", "CSS Visual & Styling Generators"],
  ["css-glassmorphism", "CSS Glassmorphism Generator", "Create frosted glass UI effects with backdrop-filter blur, alpha borders, and specular glow.", ["glassmorphism", "backdrop filter blur", "frosted glass ui"], "css-glassmorphism", "CSS Visual & Styling Generators"],
  ["css-neumorphism", "CSS Neumorphism Soft UI Generator", "Generate soft extruded and pressed neumorphic shadows for light and dark surfaces.", ["neumorphism", "soft ui", "extruded shadow"], "css-neumorphism", "CSS Visual & Styling Generators"],
  ["css-border-radius-blob", "CSS Organic Blob Generator", "Create dynamic 8-point organic blob shapes using advanced CSS border-radius syntax.", ["css blob generator", "organic border radius", "blob shape"], "css-border-radius-blob", "CSS Visual & Styling Generators"],
  ["css-aspect-ratio-calc", "CSS Aspect Ratio Calculator", "Calculate modern aspect-ratio CSS rules and responsive padding-top percentage hacks.", ["aspect ratio calculator", "16 9 ratio", "responsive video aspect"], "css-aspect-ratio-calc", "CSS Visual & Styling Generators"],
  ["css-filter-effects", "CSS Filter Effects Generator", "Combine brightness, contrast, blur, grayscale, sepia, and hue-rotate filter rules.", ["css filter effects", "css image filters", "filter blur"], "css-filter-effects", "CSS Visual & Styling Generators"],
  ["css-clip-path-generator", "CSS Clip-Path Shape Generator", "Generate CSS clip-path polygon, circle, and ellipse shapes for modern hero sections.", ["css clip path", "polygon clip path", "shape generator"], "css-clip-path-generator", "CSS Visual & Styling Generators"],
  ["svg-placeholder-generator", "Inline SVG Placeholder Generator", "Generate lightweight inline SVG placeholder graphics and data URIs with dimensions.", ["svg placeholder", "image placeholder", "data uri image"], "svg-placeholder-generator", "CSS Visual & Styling Generators"],
  ["svg-wave-divider", "SVG Wave Section Divider Generator", "Generate smooth responsive SVG wave curves for website transitions and headers.", ["svg wave generator", "section divider", "wave transition"], "svg-wave-divider", "CSS Visual & Styling Generators"],
  ["hex-to-rgb-hsl-converter", "Hex to RGB & HSL Color Converter", "Convert hex colors to rgb(), rgba(), hsl(), and hsla() formats with normalized values.", ["hex to rgb", "hex to hsl", "color converter"], "hex-to-rgb-hsl-converter", "CSS Visual & Styling Generators"],
  ["color-shades-tints", "Color Shades & Tints Palette Generator", "Generate a 10-step palette of darker shades and lighter tints from a single hex color.", ["color shades tints", "palette generator", "tint and shade"], "color-shades-tints", "CSS Visual & Styling Generators"],
  ["wcag-contrast-ratio-calc", "WCAG Color Contrast Ratio Calculator", "Compute contrast ratios between foreground and background colors with AA/AAA ratings.", ["wcag contrast ratio", "color contrast calculator", "accessibility contrast"], "wcag-contrast-ratio-calc", "CSS Visual & Styling Generators"],
];

// --- 4. MEDIA CATALOG (9 tools) ---
const mediaRows = [
  // Subtitle & Timing Operations
  ["subtitle-shift", "Shift Subtitle Timings (SRT / VTT)", "Shift all subtitle cues forward or backward in time by milliseconds.", ["subtitle shift", "delay subtitles", "fix subtitle sync"], "subtitle-shift", "Subtitle & Timing Operations"],
  ["subtitle-fps-convert", "Convert Subtitle Frame Rates (FPS)", "Recalculate subtitle timecodes between 23.976, 24, 25, 29.97, and 60 FPS.", ["subtitle fps convert", "23.976 to 25", "frame rate conversion"], "subtitle-fps-convert", "Subtitle & Timing Operations"],
  ["srt-validate", "Validate & Repair SRT Subtitles", "Check SRT files for overlapping times, negative durations, and broken sequences.", ["validate srt", "fix srt errors", "repair subtitles"], "srt-validate", "Subtitle & Timing Operations"],
  ["srt-to-ass", "Convert SRT / VTT to Styled ASS Subtitles", "Convert SRT and WebVTT subtitles into Advanced SubStation Alpha (.ass) format.", ["srt to ass", "advanced substation alpha", "styled subtitles"], "srt-to-ass", "Subtitle & Timing Operations"],
  ["srt-to-vtt-converter", "Convert SRT to WebVTT (.vtt)", "Convert SubRip (.srt) subtitle files into modern web-ready WebVTT format.", ["srt to vtt", "subrip to webvtt", "web subtitles"], "srt-to-vtt-converter", "Subtitle & Timing Operations"],
  ["vtt-to-srt-converter", "Convert WebVTT to SubRip (.srt)", "Convert WebVTT (.vtt) caption files into standard SubRip (.srt) subtitles.", ["vtt to srt", "webvtt to srt", "subrip export"], "vtt-to-srt-converter", "Subtitle & Timing Operations"],
  ["subtitle-strip-formatting", "Strip HTML Tags from Subtitles", "Remove styling tags like <i>, <b>, <u>, and font color attributes from captions.", ["strip subtitle tags", "clean srt formatting", "remove html subtitles"], "subtitle-strip-formatting", "Subtitle & Timing Operations"],
  ["subtitle-clean-sound-effects", "Remove Sound Effects & Music Tags", "Strip [Music], (Applause), [Laughter], and ambient sound tags from subtitles.", ["clean subtitle music", "strip sound effects", "caption cleaner"], "subtitle-clean-sound-effects", "Subtitle & Timing Operations"],
  ["subtitle-stats-analyzer", "Subtitle Speed & Reading Metrics", "Analyze cue count, speech duration, words per minute (WPM), and pace (CPS).", ["subtitle reading speed", "words per minute subtitles", "cps pace"], "subtitle-stats-analyzer", "Subtitle & Timing Operations"],
];

function generateCatalogFile(filename, exportName, rows, defaultEngine, defaultModule) {
  let content = `import type { CatalogEntry } from "./types";\n\n`;
  content += `export const ${exportName}: CatalogEntry[] = [\n`;
  for (const r of rows) {
    const slug = r[0];
    const title = r[1];
    const shortDesc = r[2];
    const keywords = JSON.stringify(r[3]);
    const op = r[4];
    const group = r[5];
    const engine = r[6] || defaultEngine;
    const modKey = r[7] || defaultModule;
    content += `  { slug: ${JSON.stringify(slug)}, title: ${JSON.stringify(title)}, shortDesc: ${JSON.stringify(shortDesc)}, keywords: ${keywords}, group: ${JSON.stringify(group)}, engine: ${JSON.stringify(engine)}, module: ${JSON.stringify(modKey)}, op: ${JSON.stringify(op)} },\n`;
  }
  content += `];\n`;
  fs.writeFileSync(path.join(root, "src/lib/catalog", filename), content, "utf-8");
  console.log(`Wrote ${filename} with ${rows.length} entries.`);
}

generateCatalogFile("dev.ts", "devCatalog", devRows, "text", "dev-text");
generateCatalogFile("data.ts", "dataCatalog", dataRows, "text", "data-text");
generateCatalogFile("image.ts", "imageCatalog", imageRows, "text", "image-css");
generateCatalogFile("media.ts", "mediaCatalog", mediaRows, "text", "media-text");
