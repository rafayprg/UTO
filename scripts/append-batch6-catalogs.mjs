import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// 1. DEV TOOLS (40 tools)
const devEntries = [
  {
    slug: "sql-formatter",
    title: "SQL Query Formatter & Beautifier",
    shortDesc: "Format and indent complex SQL queries with standardized keyword capitalization and indentation.",
    keywords: ["sql formatter", "beautify sql", "format sql query", "sql prettifier"],
    group: "Database & SQL",
    engine: "text",
    module: "dev-text",
    op: "sql-formatter"
  },
  {
    slug: "sql-minifier",
    title: "SQL Query Minifier",
    shortDesc: "Strip comments and whitespace from SQL queries for compact inline code execution.",
    keywords: ["sql minifier", "compress sql", "minify sql queries"],
    group: "Database & SQL",
    engine: "text",
    module: "dev-text",
    op: "sql-minifier"
  },
  {
    slug: "jwt-decoder",
    title: "JWT Token Decoder & Inspector",
    shortDesc: "Decode and inspect JSON Web Token (JWT) headers, payload claims, and expiration timestamps.",
    keywords: ["jwt decoder", "decode jwt", "jwt inspector", "parse jwt token"],
    group: "Security & Tokens",
    engine: "text",
    module: "dev-text",
    op: "jwt-decoder"
  },
  {
    slug: "uuid-v4-generator",
    title: "UUID v4 Batch Generator",
    shortDesc: "Generate cryptographically secure RFC 4122 Version 4 UUIDs in bulk with formatting options.",
    keywords: ["uuid v4 generator", "guid generator", "random uuid", "batch uuid"],
    group: "Security & Tokens",
    engine: "text",
    module: "dev-text",
    op: "uuid-v4-generator"
  },
  {
    slug: "nanoid-generator",
    title: "NanoID Unique ID Generator",
    shortDesc: "Generate secure, compact, URL-friendly unique IDs using the customizable NanoID algorithm.",
    keywords: ["nanoid generator", "unique id generator", "url safe id", "nanoid"],
    group: "Security & Tokens",
    engine: "text",
    module: "dev-text",
    op: "nanoid-generator"
  },
  {
    slug: "cron-expression-explainer",
    title: "Cron Expression Explainer",
    shortDesc: "Translate standard 5-part UNIX cron syntax into plain English schedules and breakdown fields.",
    keywords: ["cron explainer", "cron syntax", "crontab interpreter", "cron schedule"],
    group: "System & Automation",
    engine: "text",
    module: "dev-text",
    op: "cron-expression-explainer"
  },
  {
    slug: "cron-expression-builder",
    title: "Cron Expression Builder",
    shortDesc: "Generate standard UNIX crontab expressions from human-friendly schedule frequencies.",
    keywords: ["cron builder", "crontab generator", "schedule cron expression"],
    group: "System & Automation",
    engine: "text",
    module: "dev-text",
    op: "cron-expression-builder"
  },
  {
    slug: "regex-tester-extractor",
    title: "Regex Pattern Tester & Match Extractor",
    shortDesc: "Test regular expressions against sample text and inspect match groups, counts, and indices.",
    keywords: ["regex tester", "regular expression evaluator", "regex extractor", "regex matcher"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "regex-tester-extractor"
  },
  {
    slug: "user-agent-parser",
    title: "User-Agent String Parser",
    shortDesc: "Parse browser, engine, OS, device, and architecture details from HTTP User-Agent headers.",
    keywords: ["user agent parser", "parse user agent", "browser detector", "device lookup"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "user-agent-parser"
  },
  {
    slug: "url-parser-inspector",
    title: "URL Parser & Query String Inspector",
    shortDesc: "Break down URLs into protocol, host, port, path, and detailed query parameter tables.",
    keywords: ["url parser", "query param inspector", "parse url", "url component viewer"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "url-parser-inspector"
  },
  {
    slug: "cidr-subnet-calculator",
    title: "CIDR IP Subnet Calculator",
    shortDesc: "Calculate network address, broadcast address, netmask, and usable host ranges from CIDR notation.",
    keywords: ["cidr calculator", "ip subnet calculator", "network mask", "host range"],
    group: "Networking & Infrastructure",
    engine: "text",
    module: "dev-text",
    op: "cidr-subnet-calculator"
  },
  {
    slug: "ipv4-to-ipv6-converter",
    title: "IPv4 to IPv6 Address Converter",
    shortDesc: "Convert IPv4 addresses into IPv4-mapped, IPv4-compatible, and 6to4 prefix IPv6 representations.",
    keywords: ["ipv4 to ipv6", "ip converter", "ipv4 mapped ipv6", "6to4 address"],
    group: "Networking & Infrastructure",
    engine: "text",
    module: "dev-text",
    op: "ipv4-to-ipv6-converter"
  },
  {
    slug: "mac-address-formatter",
    title: "MAC Address Formatter & Normalizer",
    shortDesc: "Normalize MAC addresses between colon, hyphen, Cisco dot notation, and raw hex formats.",
    keywords: ["mac address formatter", "normalize mac address", "cisco mac format"],
    group: "Networking & Infrastructure",
    engine: "text",
    module: "dev-text",
    op: "mac-address-formatter"
  },
  {
    slug: "dockerfile-linter",
    title: "Dockerfile Linter & Best Practice Checker",
    shortDesc: "Lint Dockerfile instructions against container best practices, caching hygiene, and security tips.",
    keywords: ["dockerfile linter", "lint dockerfile", "docker best practices", "container audit"],
    group: "DevOps & Config",
    engine: "text",
    module: "dev-text",
    op: "dockerfile-linter"
  },
  {
    slug: "nginx-config-formatter",
    title: "Nginx Configuration Formatter",
    shortDesc: "Format and indent Nginx server blocks, directives, and upstream stanzas cleanly.",
    keywords: ["nginx formatter", "beautify nginx config", "format nginx conf"],
    group: "DevOps & Config",
    engine: "text",
    module: "dev-text",
    op: "nginx-config-formatter"
  },
  {
    slug: "git-command-cheatsheet",
    title: "Git Command Lookup & Cheatsheet",
    shortDesc: "Find exact Git CLI commands for common operations: undoing commits, stashing, and branching.",
    keywords: ["git command lookup", "git cheatsheet", "git undo commit", "git rebase helper"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "git-command-cheatsheet"
  },
  {
    slug: "semver-calculator",
    title: "Semantic Versioning (SemVer) Bumper",
    shortDesc: "Parse and bump semantic version strings across major, minor, patch, and prerelease releases.",
    keywords: ["semver calculator", "semantic version bumper", "bump version", "semver parser"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "semver-calculator"
  },
  {
    slug: "robots-txt-validator",
    title: "Robots.txt Validator & Linter",
    shortDesc: "Audit robots.txt directives, sitemap declarations, and user-agent crawling rules for syntax errors.",
    keywords: ["robots txt validator", "lint robots txt", "crawler directives", "robots audit"],
    group: "DevOps & Config",
    engine: "text",
    module: "dev-text",
    op: "robots-txt-validator"
  },
  {
    slug: "sitemap-xml-validator",
    title: "Sitemap XML Syntax Validator",
    shortDesc: "Validate XML sitemap files for required tags, URL limits, changefreq, and priority fields.",
    keywords: ["sitemap validator", "xml sitemap checker", "validate sitemap xml"],
    group: "DevOps & Config",
    engine: "text",
    module: "dev-text",
    op: "sitemap-xml-validator"
  },
  {
    slug: "html-entity-encoder",
    title: "HTML Entity Encoder",
    shortDesc: "Encode special characters into named and numeric HTML entities for safe web display.",
    keywords: ["html entity encoder", "escape html characters", "html entities"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "html-entity-encoder"
  },
  {
    slug: "html-entity-decoder",
    title: "HTML Entity Decoder",
    shortDesc: "Decode HTML named, decimal, and hexadecimal entities back to raw UTF-8 characters.",
    keywords: ["html entity decoder", "unescape html", "decode html entities"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "html-entity-decoder"
  },
  {
    slug: "string-escape-unescape",
    title: "String Escape & Unescape Tool",
    shortDesc: "Escape or unescape strings for JavaScript, JSON, Java, and C/C++ string literals.",
    keywords: ["string escape", "string unescape", "escape string literal", "slash escape"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "string-escape-unescape"
  },
  {
    slug: "chmod-permissions-calculator",
    title: "Chmod Permissions Calculator",
    shortDesc: "Calculate octal (755) and symbolic (rwxr-xr-x) Linux file permissions with command examples.",
    keywords: ["chmod calculator", "linux permissions", "chmod 755", "octal permissions"],
    group: "System & Automation",
    engine: "text",
    module: "dev-text",
    op: "chmod-permissions-calculator"
  },
  {
    slug: "base32-encoder",
    title: "Base32 Encoder (RFC 4648)",
    shortDesc: "Encode text strings into standardized RFC 4648 Base32 encoded representations.",
    keywords: ["base32 encoder", "encode base32", "rfc 4648 base32"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base32-encoder"
  },
  {
    slug: "base32-decoder",
    title: "Base32 Decoder (RFC 4648)",
    shortDesc: "Decode RFC 4648 Base32 strings back to plain text characters.",
    keywords: ["base32 decoder", "decode base32", "base32 to text"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base32-decoder"
  },
  {
    slug: "base58-encoder",
    title: "Base58 Encoder (Bitcoin Alphabet)",
    shortDesc: "Encode text into alphanumeric Base58 format using the Bitcoin/IPFS character set.",
    keywords: ["base58 encoder", "bitcoin base58", "encode base58"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base58-encoder"
  },
  {
    slug: "base58-decoder",
    title: "Base58 Decoder (Bitcoin Alphabet)",
    shortDesc: "Decode Base58 Bitcoin-encoded strings back to plain text UTF-8.",
    keywords: ["base58 decoder", "decode base58", "base58 to text"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base58-decoder"
  },
  {
    slug: "base85-encoder",
    title: "Base85 / Ascii85 Encoder",
    shortDesc: "Encode binary and text strings into compact Adobe/IPv6 Base85 representations.",
    keywords: ["base85 encoder", "ascii85 encoder", "encode ascii85"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base85-encoder"
  },
  {
    slug: "base85-decoder",
    title: "Base85 / Ascii85 Decoder",
    shortDesc: "Decode Ascii85 and Base85 encoded data back to plain text characters.",
    keywords: ["base85 decoder", "ascii85 decoder", "decode base85"],
    group: "Encoding & Escaping",
    engine: "text",
    module: "dev-text",
    op: "base85-decoder"
  },
  {
    slug: "hex-dump-generator",
    title: "Hex Dump Viewer & Generator",
    shortDesc: "Generate canonical hex dumps with offset addresses, byte columns, and ASCII sidebars.",
    keywords: ["hex dump generator", "hexdump viewer", "hex bytes viewer"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "hex-dump-generator"
  },
  {
    slug: "css-box-shadow-stacker",
    title: "CSS Layered Box Shadow Generator",
    shortDesc: "Generate smooth, natural multi-layered CSS box-shadow stacks with realistic ambient falloff.",
    keywords: ["css box shadow stacker", "smooth shadow generator", "layered box shadow"],
    group: "CSS & Styling",
    engine: "text",
    module: "dev-text",
    op: "css-box-shadow-stacker"
  },
  {
    slug: "css-flexbox-code-generator",
    title: "CSS Flexbox Layout Generator",
    shortDesc: "Generate clean CSS flexbox container and item rules with alignment and direction options.",
    keywords: ["css flexbox generator", "flexbox css", "flex container rules"],
    group: "CSS & Styling",
    engine: "text",
    module: "dev-text",
    op: "css-flexbox-code-generator"
  },
  {
    slug: "css-grid-code-generator",
    title: "CSS Grid Layout Generator",
    shortDesc: "Generate modern CSS Grid template column and row declarations with gap spacing.",
    keywords: ["css grid generator", "grid layout css", "css grid columns"],
    group: "CSS & Styling",
    engine: "text",
    module: "dev-text",
    op: "css-grid-code-generator"
  },
  {
    slug: "css-clamp-typography",
    title: "CSS Fluid Typography clamp() Generator",
    shortDesc: "Calculate fluid typography formulas using CSS clamp() between minimum and maximum viewports.",
    keywords: ["css clamp typography", "fluid typography generator", "css clamp calculator"],
    group: "CSS & Styling",
    engine: "text",
    module: "dev-text",
    op: "css-clamp-typography"
  },
  {
    slug: "css-triangle-generator",
    title: "CSS Triangle Generator",
    shortDesc: "Generate pure CSS border-based triangle shapes pointing in any cardinal direction.",
    keywords: ["css triangle generator", "css border triangle", "triangle shape css"],
    group: "CSS & Styling",
    engine: "text",
    module: "dev-text",
    op: "css-triangle-generator"
  },
  {
    slug: "svg-path-optimizer",
    title: "SVG Path Data Optimizer",
    shortDesc: "Round coordinate numbers in SVG path 'd' attributes to reduce vector file footprint.",
    keywords: ["svg path optimizer", "clean svg path", "round svg coordinates"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "svg-path-optimizer"
  },
  {
    slug: "markdown-table-aligner",
    title: "Markdown Table Aligner & Beautifier",
    shortDesc: "Format and align columns in Markdown tables with proper header underlines and pipe padding.",
    keywords: ["markdown table aligner", "format markdown table", "pretty markdown table"],
    group: "Development Utilities",
    engine: "text",
    module: "dev-text",
    op: "markdown-table-aligner"
  },
  {
    slug: "graphql-query-prettifier",
    title: "GraphQL Query Prettifier & Formatter",
    shortDesc: "Format and indent GraphQL queries, mutations, and fragments with consistent nesting.",
    keywords: ["graphql prettifier", "format graphql", "beautify graphql query"],
    group: "Database & SQL",
    engine: "text",
    module: "dev-text",
    op: "graphql-query-prettifier"
  },
  {
    slug: "graphql-query-minifier",
    title: "GraphQL Query Minifier",
    shortDesc: "Compress GraphQL documents into single-line queries by removing whitespace and comments.",
    keywords: ["graphql minifier", "compress graphql query", "minify graphql"],
    group: "Database & SQL",
    engine: "text",
    module: "dev-text",
    op: "graphql-query-minifier"
  },
  {
    slug: "json-to-xml-converter",
    title: "JSON to XML Hierarchical Converter",
    shortDesc: "Convert nested JSON objects and arrays into clean, well-formed XML documents with custom tags.",
    keywords: ["json to xml converter", "json2xml", "convert json to xml"],
    group: "Database & SQL",
    engine: "text",
    module: "dev-text",
    op: "json-to-xml-converter"
  }
];

// 2. DATA TOOLS (25 tools)
const dataEntries = [
  {
    slug: "tsv-to-json-converter",
    title: "TSV to JSON Converter",
    shortDesc: "Convert tab-separated value (TSV) documents into structured JSON objects or arrays.",
    keywords: ["tsv to json", "convert tsv to json", "tsv parser"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "tsv-to-json-converter"
  },
  {
    slug: "json-to-tsv-converter",
    title: "JSON to TSV Converter",
    shortDesc: "Convert JSON arrays of objects into tab-separated values (TSV) for spreadsheets.",
    keywords: ["json to tsv", "export json to tsv", "tsv generator"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "json-to-tsv-converter"
  },
  {
    slug: "csv-to-latex-table",
    title: "CSV to LaTeX Table Converter",
    shortDesc: "Transform tabular CSV datasets into formatted LaTeX tabular environment code.",
    keywords: ["csv to latex", "latex table generator", "csv tabular"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "csv-to-latex-table"
  },
  {
    slug: "csv-to-yaml-objects",
    title: "CSV to YAML Objects Converter",
    shortDesc: "Convert CSV records into clean, indented YAML object lists.",
    keywords: ["csv to yaml", "convert csv to yaml", "yaml data export"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "csv-to-yaml-objects"
  },
  {
    slug: "csv-to-xml-rows",
    title: "CSV to XML Rows Converter",
    shortDesc: "Convert tabular CSV records into hierarchical XML document structures.",
    keywords: ["csv to xml", "xml data export", "csv2xml"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "csv-to-xml-rows"
  },
  {
    slug: "base64-csv-encoder",
    title: "CSV to Base64 Data URI Encoder",
    shortDesc: "Encode raw CSV text into Base64 format or browser-ready data:text/csv URIs.",
    keywords: ["csv to base64", "base64 csv encoder", "csv data uri"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "base64-csv-encoder"
  },
  {
    slug: "base64-csv-decoder",
    title: "Base64 to CSV Data Decoder",
    shortDesc: "Decode Base64 strings or data: URIs back into readable CSV tabular records.",
    keywords: ["base64 to csv", "decode base64 csv", "base64 data decoder"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "base64-csv-decoder"
  },
  {
    slug: "csv-duplicate-rows-isolator",
    title: "CSV Duplicate Rows Isolator",
    shortDesc: "Detect and isolate duplicate rows in CSV datasets by entire record or specific column.",
    keywords: ["csv duplicate rows", "dedupe csv", "find duplicate rows"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-duplicate-rows-isolator"
  },
  {
    slug: "csv-column-math-stats",
    title: "CSV Column Math & Summary Statistics",
    shortDesc: "Calculate sum, mean, median, standard deviation, min, and max for any numeric CSV column.",
    keywords: ["csv column stats", "csv math statistics", "mean median standard deviation csv"],
    group: "Data Analysis & Statistics",
    engine: "text",
    module: "data-text",
    op: "csv-column-math-stats"
  },
  {
    slug: "csv-tsv-markdown-table",
    title: "CSV / TSV to Markdown Table Formatter",
    shortDesc: "Convert CSV or TSV data into aligned GitHub-flavored Markdown tables.",
    keywords: ["csv to markdown table", "tsv to markdown", "markdown table generator"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "csv-tsv-markdown-table"
  },
  {
    slug: "csv-to-sql-update-generator",
    title: "CSV to SQL UPDATE Statement Generator",
    shortDesc: "Generate SQL UPDATE queries from CSV rows keyed by a primary column.",
    keywords: ["csv to sql update", "generate sql updates", "sql update statements"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-to-sql-update-generator"
  },
  {
    slug: "csv-header-slugifier",
    title: "CSV Header Normalizer & Slugifier",
    shortDesc: "Normalize CSV header column names to lowercase snake_case, camelCase, or kebab-case.",
    keywords: ["csv header normalizer", "slugify csv headers", "clean column names"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-header-slugifier"
  },
  {
    slug: "json-array-to-sql-inserts",
    title: "JSON Array to SQL INSERT Statements",
    shortDesc: "Convert JSON array items into parameterized SQL INSERT INTO queries.",
    keywords: ["json to sql insert", "convert json array to sql", "sql insert generator"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "json-array-to-sql-inserts"
  },
  {
    slug: "sql-inserts-to-json",
    title: "SQL INSERTs to JSON Array Parser",
    shortDesc: "Parse SQL INSERT INTO statements and extract the row records into a clean JSON array.",
    keywords: ["sql to json", "parse sql insert to json", "sql insert parser"],
    group: "Data Formats & Converters",
    engine: "text",
    module: "data-text",
    op: "sql-inserts-to-json"
  },
  {
    slug: "data-minmax-scaler",
    title: "Data Min-Max Normalizer (0-1 Scale)",
    shortDesc: "Normalize numerical datasets into scaled 0 to 1 ranges for machine learning and modeling.",
    keywords: ["min max scaler", "normalize numbers 0 1", "data feature scaling"],
    group: "Data Analysis & Statistics",
    engine: "text",
    module: "data-text",
    op: "data-minmax-scaler"
  },
  {
    slug: "data-zscore-scaler",
    title: "Data Z-Score Standardizer",
    shortDesc: "Standardize numerical data by calculating Z-scores based on population mean and standard deviation.",
    keywords: ["z score scaler", "standardize data", "statistical z score"],
    group: "Data Analysis & Statistics",
    engine: "text",
    module: "data-text",
    op: "data-zscore-scaler"
  },
  {
    slug: "csv-find-replace-column",
    title: "CSV Column-Targeted Find & Replace",
    shortDesc: "Perform search and replace modifications restricted to a specific column index or header in CSV.",
    keywords: ["csv find replace", "column search replace", "replace in csv column"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-find-replace-column"
  },
  {
    slug: "random-csv-mock-generator",
    title: "Random CSV Mock Data Generator",
    shortDesc: "Generate randomized sample CSV rows containing names, emails, roles, and cities for testing.",
    keywords: ["mock csv generator", "sample csv data", "test csv rows"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "random-csv-mock-generator"
  },
  {
    slug: "excel-formula-lookup-helper",
    title: "Excel / Sheets Formula Reference Guide",
    shortDesc: "Look up Excel and Google Sheets formula syntax, parameters, and examples for VLOOKUP, XLOOKUP, and INDEX/MATCH.",
    keywords: ["excel formula lookup", "vlookup helper", "xlookup syntax", "index match guide"],
    group: "Data Analysis & Statistics",
    engine: "text",
    module: "data-text",
    op: "excel-formula-lookup-helper"
  },
  {
    slug: "csv-column-splitter",
    title: "CSV Column Splitter",
    shortDesc: "Split a CSV column containing compound data (e.g., 'First Last') into separate columns.",
    keywords: ["split csv column", "csv column splitter", "split text to columns"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-column-splitter"
  },
  {
    slug: "csv-column-merger",
    title: "CSV Column Merger & Concatenator",
    shortDesc: "Merge two CSV columns together into a single combined column with custom delimiters.",
    keywords: ["merge csv columns", "combine csv columns", "concatenate csv fields"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-column-merger"
  },
  {
    slug: "csv-case-normalizer",
    title: "CSV Text Column Case Normalizer",
    shortDesc: "Batch convert text casing (UPPERCASE, lowercase, Title Case) across targeted CSV columns.",
    keywords: ["csv case normalizer", "normalize csv casing", "uppercase csv column"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-case-normalizer"
  },
  {
    slug: "csv-row-counter-profiler",
    title: "CSV Dataset Profiler & Dimension Metrics",
    shortDesc: "Inspect total row counts, column counts, missing value tallies, and estimated memory footprint.",
    keywords: ["csv profiler", "inspect csv dataset", "csv dimensions", "row counter"],
    group: "Data Analysis & Statistics",
    engine: "text",
    module: "data-text",
    op: "csv-row-counter-profiler"
  },
  {
    slug: "csv-null-empty-isolator",
    title: "CSV Null & Empty Cells Isolator",
    shortDesc: "Filter out or isolate records containing blank, null, or empty values across CSV data.",
    keywords: ["filter null csv", "find blank cells csv", "remove empty rows csv"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-null-empty-isolator"
  },
  {
    slug: "csv-transpose-table",
    title: "CSV Table Transposer (Swap Rows & Columns)",
    shortDesc: "Transpose CSV tabular datasets by swapping horizontal rows into vertical columns.",
    keywords: ["transpose csv", "swap rows and columns", "pivot csv table"],
    group: "Data Cleaning & Transformation",
    engine: "text",
    module: "data-text",
    op: "csv-transpose-table"
  }
];

// 3. TEXT TOOLS (45 tools)
const textEntries = [
  {
    slug: "nato-phonetic-speller",
    title: "NATO Phonetic Alphabet Speller",
    shortDesc: "Convert words and phrases into standard ICAO/NATO phonetic spelling words.",
    keywords: ["nato phonetic speller", "military alphabet", "icao phonetic alphabet", "alpha bravo charlie"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "nato-phonetic-speller"
  },
  {
    slug: "morse-code-translator",
    title: "Morse Code Translator & Decoder",
    shortDesc: "Translate text into International Morse Code audio/text patterns and decode back to text.",
    keywords: ["morse code translator", "morse decoder", "dots and dashes", "text to morse"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "morse-code-translator"
  },
  {
    slug: "braille-unicode-translator",
    title: "Braille Unicode Pattern Translator",
    shortDesc: "Convert alphanumeric text characters into standard Grade 1 Unicode Braille patterns.",
    keywords: ["braille translator", "braille unicode", "grade 1 braille", "text to braille"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "braille-unicode-translator"
  },
  {
    slug: "caesar-cipher-encoder",
    title: "Caesar Cipher Shift Tool",
    shortDesc: "Encrypt or decrypt messages using Caesar substitution cipher with customizable shift offsets.",
    keywords: ["caesar cipher", "rot cipher", "caesar shift encoder", "shift cipher"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "caesar-cipher-encoder"
  },
  {
    slug: "binary-to-text-converter",
    title: "Binary to Text Decoder",
    shortDesc: "Convert 8-bit binary character codes (0s and 1s) into readable ASCII and UTF-8 text.",
    keywords: ["binary to text", "decode binary", "binary translator"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "binary-to-text-converter"
  },
  {
    slug: "text-to-binary-converter",
    title: "Text to Binary String Encoder",
    shortDesc: "Convert text characters into standard 8-bit space-separated binary code strings.",
    keywords: ["text to binary", "encode binary", "binary string generator"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "text-to-binary-converter"
  },
  {
    slug: "hex-to-text-converter",
    title: "Hexadecimal to Text Decoder",
    shortDesc: "Decode space-separated or continuous hexadecimal strings into plain text characters.",
    keywords: ["hex to text", "decode hex", "hexadecimal string to text"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "hex-to-text-converter"
  },
  {
    slug: "text-to-hex-converter",
    title: "Text to Hexadecimal Encoder",
    shortDesc: "Convert plain text characters into byte-formatted hexadecimal numbers.",
    keywords: ["text to hex", "encode hex", "text to hexadecimal"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "text-to-hex-converter"
  },
  {
    slug: "leet-speak-generator",
    title: "1337 Leet Speak Generator",
    shortDesc: "Transform standard English text into stylized hacker 1337 (leet) speak with intensity levels.",
    keywords: ["leet speak generator", "1337 generator", "hacker text", "leetspeak"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "leet-speak-generator"
  },
  {
    slug: "zalgo-glitch-text",
    title: "Zalgo Glitch Text Generator",
    shortDesc: "Add creepy, corrupted Unicode combining diacritic marks to text for glitch effects.",
    keywords: ["zalgo text generator", "glitch text", "creepy text", "corrupted text"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "zalgo-glitch-text"
  },
  {
    slug: "upside-down-text",
    title: "Upside Down Text Flipper",
    shortDesc: "Flip text upside-down and backwards using inverted Unicode character mappings.",
    keywords: ["upside down text", "flip text", "inverted text", "backwards upside down"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "upside-down-text"
  },
  {
    slug: "small-caps-unicode",
    title: "Small Caps Unicode Text Generator",
    shortDesc: "Convert lowercase text into stylish Unicode small capital letter glyphs for social media bios.",
    keywords: ["small caps generator", "unicode small caps", "small capital letters"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "small-caps-unicode"
  },
  {
    slug: "strikethrough-text-formatter",
    title: "Strikethrough Unicode Text Generator",
    shortDesc: "Generate strikethrough crossed-out text using Unicode combining strike characters.",
    keywords: ["strikethrough text", "cross out text", "unicode strikethrough"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "strikethrough-text-formatter"
  },
  {
    slug: "underline-unicode-formatter",
    title: "Underline Unicode Text Generator",
    shortDesc: "Add underlined text styling using combining low line Unicode characters for social posts.",
    keywords: ["underline text", "unicode underline", "underlined text generator"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "underline-unicode-formatter"
  },
  {
    slug: "keyword-density-analyzer",
    title: "SEO Keyword Density Analyzer",
    shortDesc: "Analyze single, 2-word, and 3-word phrase density and frequency percentages in content.",
    keywords: ["keyword density analyzer", "seo keyword frequency", "content keyword density"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "keyword-density-analyzer"
  },
  {
    slug: "reading-speaking-time-estimator",
    title: "Reading & Speaking Time Estimator",
    shortDesc: "Calculate estimated silent reading and speech presentation duration based on word counts.",
    keywords: ["reading time estimator", "speaking time calculator", "speech duration"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "reading-speaking-time-estimator"
  },
  {
    slug: "text-readability-scorer",
    title: "Multi-Index Readability Consensus Scorer",
    shortDesc: "Calculate comprehensive Flesch-Kincaid, Gunning Fog, and SMOG reading scores in one pass.",
    keywords: ["readability scorer", "flesch kincaid score", "gunning fog index", "content readability"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "text-readability-scorer"
  },
  {
    slug: "syllable-counter-haiku",
    title: "Syllable Counter & Haiku Checker",
    shortDesc: "Count syllables per line and verify 5-7-5 poem structure conformity for haikus.",
    keywords: ["syllable counter", "haiku checker", "count syllables per line"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "syllable-counter-haiku"
  },
  {
    slug: "word-frequency-counter",
    title: "Word Frequency & Occurrence Counter",
    shortDesc: "Count individual word occurrences with optional stop-word filtering and case sensitivity.",
    keywords: ["word frequency counter", "word count breakdown", "common words analyzer"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "word-frequency-counter"
  },
  {
    slug: "passive-voice-highlighter",
    title: "Passive Voice Detector & Highlighter",
    shortDesc: "Detect auxiliary verb and past participle combinations indicating passive voice construction.",
    keywords: ["passive voice detector", "passive voice highlighter", "writing tone audit"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "passive-voice-highlighter"
  },
  {
    slug: "filler-words-highlighter",
    title: "Filler & Weasel Words Highlighter",
    shortDesc: "Detect redundant filler words (very, basically, actually, honestly) to tighten writing.",
    keywords: ["filler words detector", "weasel words finder", "improve writing conciseness"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "filler-words-highlighter"
  },
  {
    slug: "full-text-statistics",
    title: "Full Text Metrics & Statistical Overview",
    shortDesc: "Compute characters, words, sentences, paragraphs, syllables, and lexical density in one dashboard.",
    keywords: ["text statistics", "text metrics", "word character sentence count"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "full-text-statistics"
  },
  {
    slug: "email-address-extractor",
    title: "Email Address Harvester & Extractor",
    shortDesc: "Extract and deduplicate all valid email addresses found across raw unstructured text.",
    keywords: ["email extractor", "extract email addresses", "email harvester"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "email-address-extractor"
  },
  {
    slug: "url-link-extractor",
    title: "URL Web Link Extractor",
    shortDesc: "Detect, isolate, and list all web URL hyperlinks embedded within arbitrary text.",
    keywords: ["url extractor", "link harvester", "extract links from text"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "url-link-extractor"
  },
  {
    slug: "phone-number-extractor",
    title: "Phone Number Extractor & Cleaner",
    shortDesc: "Extract and normalize North American and international phone numbers from unstructured text.",
    keywords: ["phone number extractor", "extract phone numbers", "phone number parser"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "phone-number-extractor"
  },
  {
    slug: "hashtag-generator-cleaner",
    title: "Social Media Hashtag Generator",
    shortDesc: "Convert words and phrases into clean, alphanumeric social media hashtags for posts.",
    keywords: ["hashtag generator", "social media hashtags", "create hashtags"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "hashtag-generator-cleaner"
  },
  {
    slug: "markdown-to-plain-text",
    title: "Markdown to Plain Text Stripper",
    shortDesc: "Strip Markdown syntax (bold, links, headers, code fences) leaving pure readable prose.",
    keywords: ["markdown to plain text", "strip markdown", "markdown cleaner"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "markdown-to-plain-text"
  },
  {
    slug: "text-case-inverter",
    title: "Case Inverter & Swapper",
    shortDesc: "Invert character capitalization (turn lowercase into UPPERCASE and uppercase into lowercase).",
    keywords: ["case inverter", "swap case", "invert capitalization"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "text-case-inverter"
  },
  {
    slug: "lorem-ipsum-generator",
    title: "Lorem Ipsum Placeholder Generator",
    shortDesc: "Generate classic Latin dummy placeholder text by sentences, paragraphs, or word counts.",
    keywords: ["lorem ipsum generator", "dummy text", "placeholder text"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "lorem-ipsum-generator"
  },
  {
    slug: "bionic-reading-formatter",
    title: "Bionic Reading Speed Formatter",
    shortDesc: "Format text with bold leading fixation syllables to guide eye movement and increase reading speed.",
    keywords: ["bionic reading", "speed reading formatter", "bold fixation points"],
    group: "Stylized & Unicode Text",
    engine: "text",
    module: "seo-text",
    op: "bionic-reading-formatter"
  },
  {
    slug: "random-password-generator",
    title: "Secure Random Password Generator",
    shortDesc: "Generate high-entropy random passwords with configurable lengths, numbers, and symbols.",
    keywords: ["password generator", "random password", "secure password"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "random-password-generator"
  },
  {
    slug: "pii-redactor-masker",
    title: "PII & Sensitive Data Redactor",
    shortDesc: "Redact sensitive Personally Identifiable Information: emails, phone numbers, and SSNs.",
    keywords: ["pii redactor", "mask sensitive data", "redact pii text"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "pii-redactor-masker"
  },
  {
    slug: "reverse-text-words",
    title: "Word Order Reverser",
    shortDesc: "Reverse the sequence of words in a sentence or reverse each individual word's letters.",
    keywords: ["reverse words", "word order reverser", "reverse sentence"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "reverse-text-words"
  },
  {
    slug: "line-sorter-alphabetical",
    title: "Alphabetical Line Sorter",
    shortDesc: "Sort lines alphabetically in ascending (A-Z) or descending (Z-A) order.",
    keywords: ["line sorter", "sort lines a-z", "alphabetize lines"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "line-sorter-alphabetical"
  },
  {
    slug: "duplicate-line-remover",
    title: "Duplicate Line Remover",
    shortDesc: "Strip duplicate and repeated lines from text lists while preserving original ordering.",
    keywords: ["remove duplicate lines", "dedupe lines", "unique lines"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "duplicate-line-remover"
  },
  {
    slug: "blank-line-remover",
    title: "Blank & Empty Line Remover",
    shortDesc: "Remove blank, empty, and whitespace-only lines from text documents.",
    keywords: ["remove blank lines", "strip empty lines", "clean lines"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "blank-line-remover"
  },
  {
    slug: "prefix-suffix-line-adder",
    title: "Prefix & Suffix Line Prepender",
    shortDesc: "Prepend prefixes or append suffixes to every line across a text document.",
    keywords: ["add prefix to lines", "add suffix to lines", "line prefixer"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "prefix-suffix-line-adder"
  },
  {
    slug: "line-numbering-formatter",
    title: "Line Numbering Formatter",
    shortDesc: "Add sequential numbers to text lines with customizable delimiters and start offsets.",
    keywords: ["line numbering", "number lines", "add line numbers to text"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "line-numbering-formatter"
  },
  {
    slug: "text-wrap-column-formatter",
    title: "Text Wrap & Word Boundary Formatter",
    shortDesc: "Hard wrap long text lines at specific column width limits without breaking mid-word.",
    keywords: ["text wrap", "word wrap", "wrap text at column limit"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "text-wrap-column-formatter"
  },
  {
    slug: "slugify-string-generator",
    title: "URL Slugify String Generator",
    shortDesc: "Convert article titles and strings into clean, hyphenated SEO-friendly URL slugs.",
    keywords: ["slugify string", "url slug generator", "create permalink slug"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "slugify-string-generator"
  },
  {
    slug: "camel-to-kebab-snake-case",
    title: "camelCase to kebab-case & snake_case",
    shortDesc: "Convert JavaScript camelCase and PascalCase identifiers into kebab-case or snake_case.",
    keywords: ["camel to kebab", "camel to snake", "convert camelcase"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "camel-to-kebab-snake-case"
  },
  {
    slug: "base64-utf8-encoder",
    title: "Base64 UTF-8 Text Encoder",
    shortDesc: "Encode Unicode UTF-8 text strings into standard RFC 4648 Base64 representations.",
    keywords: ["base64 encoder", "utf8 to base64", "encode base64 text"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "base64-utf8-encoder"
  },
  {
    slug: "base64-utf8-decoder",
    title: "Base64 UTF-8 Text Decoder",
    shortDesc: "Decode Base64 encoded strings back into clean UTF-8 text characters.",
    keywords: ["base64 decoder", "base64 to utf8", "decode base64 text"],
    group: "Encoders & Ciphers",
    engine: "text",
    module: "seo-text",
    op: "base64-utf8-decoder"
  },
  {
    slug: "hex-color-extractor-text",
    title: "Hex Color Code Extractor",
    shortDesc: "Detect and isolate all #RGB and #RRGGBB hexadecimal color codes from text blocks.",
    keywords: ["hex color extractor", "find hex colors", "extract color codes"],
    group: "Text Utility & Cleaners",
    engine: "text",
    module: "seo-text",
    op: "hex-color-extractor-text"
  },
  {
    slug: "character-frequency-counter",
    title: "Character Frequency & Alphabet Counter",
    shortDesc: "Analyze individual character frequency distributions and percentage weights across text.",
    keywords: ["character frequency counter", "letter frequency", "character count breakdown"],
    group: "Content & Linguistic Analysis",
    engine: "text",
    module: "seo-text",
    op: "character-frequency-counter"
  }
];

// 4. IMAGE TOOLS (15 tools)
const imageEntries = [
  {
    slug: "css-mesh-gradient-generator",
    title: "CSS Mesh Gradient Generator",
    shortDesc: "Generate modern, colorful multi-point radial mesh gradients with smooth color blending.",
    keywords: ["css mesh gradient", "mesh gradient generator", "radial mesh background"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-mesh-gradient-generator"
  },
  {
    slug: "css-polygon-clip-path",
    title: "CSS Polygon Clip-Path Shape Generator",
    shortDesc: "Generate CSS clip-path polygon declarations for angled banners, chevrons, and trapezoids.",
    keywords: ["css clip path", "polygon clip path", "css shapes", "angled banner"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-polygon-clip-path"
  },
  {
    slug: "css-filter-effects-playground",
    title: "CSS Filter Effects Generator",
    shortDesc: "Adjust and combine CSS blur, contrast, brightness, and grayscale filter declarations.",
    keywords: ["css filter generator", "css blur contrast", "image filter playground"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-filter-effects-playground"
  },
  {
    slug: "svg-wave-divider-generator",
    title: "SVG Section Wave Divider Generator",
    shortDesc: "Generate responsive SVG wave section dividers for website headers and footers.",
    keywords: ["svg wave divider", "wave divider generator", "section divider svg"],
    group: "SVG & Vector Tools",
    engine: "text",
    module: "image-css",
    op: "svg-wave-divider-generator"
  },
  {
    slug: "svg-pattern-repeat-generator",
    title: "SVG Seamless Pattern Generator",
    shortDesc: "Generate repeating SVG dot grid, diagonal line, and square patterns for backgrounds.",
    keywords: ["svg pattern generator", "repeating svg pattern", "dot grid svg"],
    group: "SVG & Vector Tools",
    engine: "text",
    module: "image-css",
    op: "svg-pattern-repeat-generator"
  },
  {
    slug: "color-harmonies-generator",
    title: "Color Harmonies & Palette Generator",
    shortDesc: "Generate complementary, analogous, triadic, and tetradic color palettes from base hex values.",
    keywords: ["color harmonies", "color palette generator", "complementary colors", "triadic palette"],
    group: "Color Utilities",
    engine: "text",
    module: "image-css",
    op: "color-harmonies-generator"
  },
  {
    slug: "color-blindness-previewer",
    title: "Color Blindness Simulation Matrix",
    shortDesc: "Simulate color perception under Protanopia, Deuteranopia, Tritanopia, and Achromatopsia.",
    keywords: ["color blindness simulator", "protanopia preview", "accessible colors", "deuteranopia"],
    group: "Color Utilities",
    engine: "text",
    module: "image-css",
    op: "color-blindness-previewer"
  },
  {
    slug: "favicon-html-generator",
    title: "Favicon HTML Meta Tag Generator",
    shortDesc: "Generate complete HTML link meta tags for Apple Touch Icons, SVG favicons, and web manifests.",
    keywords: ["favicon html generator", "apple touch icon tags", "favicon meta tags"],
    group: "Layout & Dimensions",
    engine: "text",
    module: "image-css",
    op: "favicon-html-generator"
  },
  {
    slug: "aspect-ratio-dimension-calculator",
    title: "Aspect Ratio Dimension Calculator",
    shortDesc: "Calculate new width or height while preserving standard aspect ratios (16:9, 4:3, 1:1, 21:9).",
    keywords: ["aspect ratio calculator", "image dimension calculator", "preserve aspect ratio"],
    group: "Layout & Dimensions",
    engine: "text",
    module: "image-css",
    op: "aspect-ratio-dimension-calculator"
  },
  {
    slug: "print-dpi-resolution-calculator",
    title: "Print DPI & Resolution Calculator",
    shortDesc: "Calculate pixel dimensions required for high-quality printing at 300 DPI, 150 DPI, and 72 DPI.",
    keywords: ["print dpi calculator", "print resolution calculator", "pixels to inches print"],
    group: "Layout & Dimensions",
    engine: "text",
    module: "image-css",
    op: "print-dpi-resolution-calculator"
  },
  {
    slug: "css-button-styler-generator",
    title: "CSS Button Styler & CSS Code Generator",
    shortDesc: "Generate modern CSS button styles with padding, rounded corners, hover transitions, and shadows.",
    keywords: ["css button generator", "button styler", "css button code"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-button-styler-generator"
  },
  {
    slug: "css-squircle-border-radius",
    title: "CSS Squircle & Organic Radius Generator",
    shortDesc: "Generate organic squircle curves using 8-value CSS border-radius syntax.",
    keywords: ["css squircle", "organic border radius", "squircle generator"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-squircle-border-radius"
  },
  {
    slug: "color-shade-tint-generator",
    title: "Color Shade & Tint Scale Generator",
    shortDesc: "Generate a 10-step monochromatic shade (darker) and tint (lighter) scale from any hex color.",
    keywords: ["color shade tint generator", "monochromatic scale", "color tints and shades"],
    group: "Color Utilities",
    engine: "text",
    module: "image-css",
    op: "color-shade-tint-generator"
  },
  {
    slug: "css-glassmorphism-card",
    title: "CSS Glassmorphism Card Generator",
    shortDesc: "Generate frosted-glass card styles with background blur, semi-transparent borders, and shadows.",
    keywords: ["glassmorphism generator", "frosted glass css", "backdrop filter blur"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-glassmorphism-card"
  },
  {
    slug: "css-neumorphism-soft-ui",
    title: "CSS Neumorphism (Soft UI) Generator",
    shortDesc: "Generate tactile soft UI inset and outset shadows for modern neumorphic design.",
    keywords: ["neumorphism generator", "soft ui css", "neumorphic shadow"],
    group: "CSS Visual Effects",
    engine: "text",
    module: "image-css",
    op: "css-neumorphism-soft-ui"
  }
];

// 5. MEDIA TOOLS (15 tools)
const mediaEntries = [
  {
    slug: "audio-frequency-to-note",
    title: "Audio Frequency (Hz) to Musical Note",
    shortDesc: "Convert acoustic frequencies in Hertz (Hz) to scientific pitch notation and cents detune.",
    keywords: ["frequency to note", "hz to musical note", "pitch detector", "audio frequency calculator"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "audio-frequency-to-note"
  },
  {
    slug: "tempo-bpm-delay-reverb-calculator",
    title: "Tempo (BPM) Delay & Reverb Time Calculator",
    shortDesc: "Calculate musical delay times in milliseconds for 1/4, 1/8, and 1/16 notes based on BPM.",
    keywords: ["bpm delay calculator", "tempo to milliseconds", "reverb time calculator"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "tempo-bpm-delay-reverb-calculator"
  },
  {
    slug: "video-bitrate-file-size-calculator",
    title: "Video Bitrate & Target File Size Calculator",
    shortDesc: "Calculate required video bitrate or estimated file size based on duration and audio streams.",
    keywords: ["video bitrate calculator", "video file size estimator", "target bitrate"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "video-bitrate-file-size-calculator"
  },
  {
    slug: "video-aspect-ratio-crop-calculator",
    title: "Video Crop & Pillarbox Calculator",
    shortDesc: "Calculate letterbox, pillarbox, and pixel crop dimensions when converting between aspect ratios.",
    keywords: ["video crop calculator", "letterbox calculator", "aspect ratio converter video"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "video-aspect-ratio-crop-calculator"
  },
  {
    slug: "smpte-timecode-frame-calculator",
    title: "SMPTE Timecode to Frame Calculator",
    shortDesc: "Convert HH:MM:SS:FF timecode strings into absolute frame counts at 24, 29.97, and 60 FPS.",
    keywords: ["smpte timecode calculator", "timecode to frames", "video frame counter"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "smpte-timecode-frame-calculator"
  },
  {
    slug: "audio-sample-rate-calculator",
    title: "Audio Sample Rate & File Size Calculator",
    shortDesc: "Calculate raw uncompressed PCM audio file sizes and bitrates from bit depth and sample rate.",
    keywords: ["audio sample rate calculator", "wav file size calculator", "audio bitrate"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "audio-sample-rate-calculator"
  },
  {
    slug: "pitch-shift-semitone-calculator",
    title: "Pitch Shift Semitones & Frequency Ratio",
    shortDesc: "Calculate frequency multiplication ratios and speed changes when shifting musical pitch by semitones.",
    keywords: ["pitch shift calculator", "semitones to frequency ratio", "audio speed pitch change"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "pitch-shift-semitone-calculator"
  },
  {
    slug: "subtitle-timing-stretcher",
    title: "Subtitle Timing Stretcher & Speed Factor",
    shortDesc: "Scale subtitle timestamps by speed factors to synchronize subtitles after framerate conversions.",
    keywords: ["subtitle timing stretcher", "resync subtitles", "scale srt timestamps"],
    group: "Subtitles & Timing",
    engine: "text",
    module: "media-text",
    op: "subtitle-timing-stretcher"
  },
  {
    slug: "srt-to-vtt-converter-advanced",
    title: "SRT to WebVTT Subtitle Converter",
    shortDesc: "Convert SubRip (.srt) subtitle files into HTML5 WebVTT (.vtt) caption tracks.",
    keywords: ["srt to vtt converter", "convert srt to webvtt", "html5 captions"],
    group: "Subtitles & Timing",
    engine: "text",
    module: "media-text",
    op: "srt-to-vtt-converter-advanced"
  },
  {
    slug: "subtitle-word-pacing-cps",
    title: "Subtitle Reading Pacing (CPS) Checker",
    shortDesc: "Audit subtitle cues to detect excessive characters-per-second (CPS) violating reading guidelines.",
    keywords: ["subtitle reading pacing", "characters per second subtitles", "cps subtitle checker"],
    group: "Subtitles & Timing",
    engine: "text",
    module: "media-text",
    op: "subtitle-word-pacing-cps"
  },
  {
    slug: "audio-loudness-lufs-target",
    title: "Streaming Loudness (LUFS) Target Reference",
    shortDesc: "Look up target integrated LUFS and True Peak limits for YouTube, Spotify, Apple Music, and Netflix.",
    keywords: ["lufs target reference", "streaming loudness standards", "youtube lufs", "spotify loudness"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "audio-loudness-lufs-target"
  },
  {
    slug: "video-rendering-time-estimator",
    title: "Video Render Time Estimator",
    shortDesc: "Estimate export rendering duration and remaining time from progress percentage benchmarks.",
    keywords: ["video render time estimator", "export time calculator", "video rendering duration"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "video-rendering-time-estimator"
  },
  {
    slug: "anamorphic-lens-desqueeze-calculator",
    title: "Anamorphic Lens Desqueeze Calculator",
    shortDesc: "Calculate display aspect ratios and desqueezed horizontal resolutions for 1.33x, 1.5x, 1.8x, and 2.0x lenses.",
    keywords: ["anamorphic desqueeze calculator", "anamorphic lens resolution", "desqueeze aspect ratio"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "anamorphic-lens-desqueeze-calculator"
  },
  {
    slug: "timelapse-interval-calculator",
    title: "Timelapse Shooting Interval Calculator",
    shortDesc: "Calculate required shooting interval and total photos needed for target timelapse clip durations.",
    keywords: ["timelapse interval calculator", "timelapse shooting interval", "frame interval calculator"],
    group: "Video & Production",
    engine: "text",
    module: "media-text",
    op: "timelapse-interval-calculator"
  },
  {
    slug: "musical-bpm-to-hz-oscillator",
    title: "Musical BPM to Hz LFO Oscillator",
    shortDesc: "Convert beats per minute (BPM) into Low-Frequency Oscillator (LFO) modulation rates in Hertz.",
    keywords: ["bpm to hz", "lfo rate calculator", "modulator frequency bpm"],
    group: "Audio Utilities",
    engine: "text",
    module: "media-text",
    op: "musical-bpm-to-hz-oscillator"
  }
];

function appendEntries(filePath, newEntries) {
  const content = fs.readFileSync(filePath, "utf-8");
  const closingIndex = content.lastIndexOf("];");
  if (closingIndex === -1) {
    throw new Error(`Could not find closing bracket in ${filePath}`);
  }
  
  const formattedEntries = newEntries.map(e => `  ${JSON.stringify(e)},`).join("\n");
  const updated = content.slice(0, closingIndex) + formattedEntries + "\n" + content.slice(closingIndex);
  fs.writeFileSync(filePath, updated, "utf-8");
  console.log(`Appended ${newEntries.length} entries to ${path.basename(filePath)}`);
}

appendEntries(path.join(root, "src/lib/catalog/dev.ts"), devEntries);
appendEntries(path.join(root, "src/lib/catalog/data.ts"), dataEntries);
appendEntries(path.join(root, "src/lib/catalog/text.ts"), textEntries);
appendEntries(path.join(root, "src/lib/catalog/image.ts"), imageEntries);
appendEntries(path.join(root, "src/lib/catalog/media.ts"), mediaEntries);

console.log("Batch 6 Catalogs successfully appended!");
