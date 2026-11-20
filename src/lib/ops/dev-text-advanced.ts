import type { TextOp } from "./types";

export const advancedDevOps: Record<string, TextOp> = {
  "sql-formatter": {
    input: {
      label: "Raw SQL Query",
      placeholder: "SELECT u.id, u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' ORDER BY o.created_at DESC LIMIT 10",
      example: "SELECT u.id, u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed' ORDER BY o.created_at DESC LIMIT 10",
      rows: 5
    },
    outputLabel: "Formatted SQL Query",
    outputExt: "sql",
    run(input) {
      if (!input.trim()) return "";
      const keywords = ["SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "UNION", "AND", "OR"];
      let sql = input.replace(/\s+/g, " ").trim();
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, "gi");
        sql = sql.replace(regex, (match) => `\n${match.toUpperCase()}`);
      }
      return sql.split("\n").map(l => l.trim()).filter(Boolean).join("\n");
    }
  },

  "sql-minifier": {
    input: {
      label: "Formatted SQL Query",
      placeholder: "SELECT *\nFROM users\nWHERE active = 1",
      example: "SELECT u.id, u.email\nFROM users u\nWHERE u.active = 1\nORDER BY u.id DESC",
      rows: 5
    },
    outputLabel: "Minified SQL",
    outputExt: "sql",
    run(input) {
      return input.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
    }
  },

  "jwt-decoder": {
    input: {
      label: "Encoded JWT Token (Header.Payload.Signature)",
      placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      rows: 4
    },
    outputLabel: "Decoded JWT Claims (Header & Payload)",
    outputExt: "json",
    run(input) {
      const parts = input.trim().split(".");
      if (parts.length < 2) throw new Error("Invalid JWT token. Expected at least two dot-separated segments.");
      const b64decode = (str: string) => {
        let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (b64.length % 4) b64 += "=";
        if (typeof atob === "function") return atob(b64);
        return Buffer.from(b64, "base64").toString("utf-8");
      };
      try {
        const header = JSON.parse(b64decode(parts[0]));
        const payload = JSON.parse(b64decode(parts[1]));
        return JSON.stringify({ HEADER: header, PAYLOAD: payload }, null, 2);
      } catch {
        throw new Error("Unable to parse JWT segments as JSON.");
      }
    }
  },

  "uuid-v4-generator": {
    input: false,
    options: [
      { id: "count", label: "Number of UUIDs", type: "number", default: 5, min: 1, max: 100 },
      { id: "uppercase", label: "Uppercase", type: "checkbox", default: false },
      { id: "hyphens", label: "Include Hyphens", type: "checkbox", default: true }
    ],
    outputLabel: "Generated UUID v4 Identifiers",
    outputExt: "txt",
    run(_, opts) {
      const count = Number(opts.count || 5);
      const isUpper = Boolean(opts.uppercase);
      const withHyphens = Boolean(opts.hyphens ?? true);
      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        let u = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
        if (!withHyphens) u = u.replace(/-/g, "");
        if (isUpper) u = u.toUpperCase();
        list.push(u);
      }
      return list.join("\n");
    }
  },

  "nanoid-generator": {
    input: false,
    options: [
      { id: "length", label: "String Length", type: "number", default: 21, min: 6, max: 64 },
      { id: "count", label: "Number of IDs", type: "number", default: 5, min: 1, max: 50 },
      { id: "alphabet", label: "Alphabet", type: "text", default: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-" }
    ],
    outputLabel: "Generated NanoIDs",
    outputExt: "txt",
    run(_, opts) {
      const len = Number(opts.length || 21);
      const count = Number(opts.count || 5);
      const alpha = String(opts.alphabet || "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-");
      const list: string[] = [];
      for (let i = 0; i < count; i++) {
        let s = "";
        for (let j = 0; j < len; j++) s += alpha[(Math.random() * alpha.length) | 0];
        list.push(s);
      }
      return list.join("\n");
    }
  },

  "cron-expression-explainer": {
    input: {
      label: "Crontab Expression (5 fields: Min Hour Day Month DayOfWeek)",
      placeholder: "0 12 * * 1-5",
      example: "*/15 9-17 * * 1-5",
      rows: 2
    },
    outputLabel: "Human Readable Schedule",
    outputExt: "txt",
    run(input) {
      const parts = input.trim().split(/\s+/);
      if (parts.length !== 5) throw new Error("Expected 5 crontab fields: minute hour day-of-month month day-of-week.");
      const [m, h, dom, mon, dow] = parts;
      const desc = [];
      desc.push(`Minutes: ${m === "*" ? "every minute" : m.startsWith("*/") ? `every ${m.slice(2)} minutes` : m}`);
      desc.push(`Hours: ${h === "*" ? "every hour" : h.includes("-") ? `between hours ${h}` : h}`);
      desc.push(`Day of Month: ${dom === "*" ? "every day" : dom}`);
      desc.push(`Month: ${mon === "*" ? "every month" : mon}`);
      desc.push(`Day of Week: ${dow === "*" ? "every day" : dow === "1-5" ? "Monday through Friday" : dow}`);
      return `Schedule Breakdown:\n${desc.join("\n")}`;
    }
  },

  "cron-expression-builder": {
    input: false,
    options: [
      { id: "frequency", label: "Frequency Preset", type: "select", default: "daily-midnight", choices: [["every-minute", "Every Minute (* * * * *)"], ["hourly", "Every Hour at :00 (0 * * * *)"], ["daily-midnight", "Daily at Midnight (0 0 * * *)"], ["weekly-monday", "Weekly on Monday at 09:00 (0 9 * * 1)"], ["monthly-first", "Monthly on the 1st at Midnight (0 0 1 * *)"]] }
    ],
    outputLabel: "Crontab Expression",
    outputExt: "txt",
    run(_, opts) {
      const map: Record<string, string> = {
        "every-minute": "* * * * *\n# Runs every minute",
        "hourly": "0 * * * *\n# Runs at minute 0 past every hour",
        "daily-midnight": "0 0 * * *\n# Runs at midnight 00:00 every day",
        "weekly-monday": "0 9 * * 1\n# Runs at 09:00 AM every Monday",
        "monthly-first": "0 0 1 * *\n# Runs at 00:00 on day 1 of every month"
      };
      return map[String(opts.frequency)] || "0 0 * * *";
    }
  },

  "regex-tester-extractor": {
    input: {
      label: "Target Text to Match",
      placeholder: "Contact us at support@example.com or sales@company.org",
      example: "Order #1042 was placed by user@domain.com, ref: #1043 by admin@site.org",
      rows: 4
    },
    second: {
      label: "Regular Expression Pattern",
      placeholder: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      example: "#([0-9]+)"
    },
    outputLabel: "Matched Results & Capture Groups",
    outputExt: "txt",
    run(input, _, pattern) {
      if (!pattern) return "Provide a regex pattern in the second input box.";
      try {
        const regex = new RegExp(pattern, "g");
        const matches = [...input.matchAll(regex)];
        if (matches.length === 0) return "No matches found.";
        return matches.map((m, i) => `Match ${i + 1}: "${m[0]}" at index ${m.index}${m.length > 1 ? ` | Groups: ${m.slice(1).map(g => `"${g}"`).join(", ")}` : ""}`).join("\n");
      } catch (e) {
        throw new Error(`Invalid regex: ${(e as Error).message}`);
      }
    }
  },

  "user-agent-parser": {
    input: {
      label: "User-Agent String",
      placeholder: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
      example: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      rows: 3
    },
    outputLabel: "Parsed Client Details",
    outputExt: "json",
    run(input) {
      const ua = input.trim();
      let os = "Unknown OS";
      if (/Windows/i.test(ua)) os = "Windows";
      else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
      else if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
      else if (/Linux/i.test(ua)) os = "Linux";

      let browser = "Unknown Browser";
      if (/Edg/i.test(ua)) browser = "Microsoft Edge";
      else if (/Chrome/i.test(ua)) browser = "Google Chrome";
      else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";
      else if (/Safari/i.test(ua)) browser = "Apple Safari";

      const device = /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : /iPad|Tablet/i.test(ua) ? "Tablet" : "Desktop";
      return JSON.stringify({ os, browser, device, rawLength: ua.length }, null, 2);
    }
  },

  "url-parser-inspector": {
    input: {
      label: "URL String",
      placeholder: "https://example.com:8080/products/item?category=electronics&sort=price#reviews",
      example: "https://api.example.com:443/v1/users?status=active&limit=50#page-2",
      rows: 3
    },
    outputLabel: "Parsed URL Components & Parameters",
    outputExt: "json",
    run(input) {
      try {
        const u = new URL(input.trim());
        const params: Record<string, string> = {};
        u.searchParams.forEach((v, k) => { params[k] = v; });
        return JSON.stringify({
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || "(default)",
          pathname: u.pathname,
          search: u.search,
          hash: u.hash,
          parameters: params
        }, null, 2);
      } catch {
        throw new Error("Invalid URL format. Ensure protocol (e.g. https://) is included.");
      }
    }
  },

  "cidr-subnet-calculator": {
    input: {
      label: "IPv4 CIDR Notation (e.g. 192.168.1.0/24)",
      placeholder: "10.0.0.0/16",
      example: "192.168.1.50/24",
      rows: 2
    },
    outputLabel: "Subnet Network Details",
    outputExt: "txt",
    run(input) {
      const [ipStr, prefixStr] = input.trim().split("/");
      const prefix = Number(prefixStr);
      if (!ipStr || isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error("Format must be IP/prefix (e.g. 192.168.1.0/24).");
      const octets = ipStr.split(".").map(Number);
      if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) throw new Error("Invalid IPv4 address.");
      const ipNum = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
      const maskNum = prefix === 0 ? 0 : ((0xFFFFFFFF << (32 - prefix)) >>> 0);
      const networkNum = (ipNum & maskNum) >>> 0;
      const broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0;
      const toIp = (num: number) => [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
      const totalHosts = Math.pow(2, 32 - prefix);
      const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : totalHosts - 2;
      return [
        `Network Address:    ${toIp(networkNum)}`,
        `Broadcast Address:  ${toIp(broadcastNum)}`,
        `Subnet Netmask:     ${toIp(maskNum)}`,
        `Usable Host Range:  ${prefix >= 31 ? toIp(networkNum) : toIp(networkNum + 1)} - ${prefix >= 31 ? toIp(broadcastNum) : toIp(broadcastNum - 1)}`,
        `Total Addresses:    ${totalHosts.toLocaleString()}`,
        `Usable Host Count:  ${usableHosts.toLocaleString()}`
      ].join("\n");
    }
  },

  "ipv4-to-ipv6-converter": {
    input: {
      label: "IPv4 Address",
      placeholder: "192.168.1.1",
      example: "172.16.254.1",
      rows: 2
    },
    outputLabel: "IPv6 & Alternative Formats",
    outputExt: "txt",
    run(input) {
      const octets = input.trim().split(".").map(Number);
      if (octets.length !== 4 || octets.some(o => isNaN(o) || o < 0 || o > 255)) throw new Error("Enter a valid IPv4 address.");
      const hex = octets.map(o => o.toString(16).padStart(2, "0"));
      const intVal = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
      const binary = octets.map(o => o.toString(2).padStart(8, "0")).join(".");
      return [
        `IPv4-Mapped IPv6: ::ffff:${octets.join(".")}`,
        `IPv6 Hex Format:   ::ffff:${hex[0]}${hex[1]}:${hex[2]}${hex[3]}`,
        `Hexadecimal:       0x${hex.join("")}`,
        `Decimal Integer:   ${intVal}`,
        `Binary Format:     ${binary}`
      ].join("\n");
    }
  },

  "mac-address-formatter": {
    input: {
      label: "MAC Address (Any format)",
      placeholder: "001422012345 or 00:14:22:01:23:45",
      example: "00-1a-2b-3c-4d-5e",
      rows: 2
    },
    outputLabel: "Standard Formatted MAC Addresses",
    outputExt: "txt",
    run(input) {
      const clean = input.replace(/[^a-fA-F0-9]/g, "");
      if (clean.length !== 12) throw new Error("A MAC address must contain exactly 12 hexadecimal characters.");
      const pairs = clean.match(/.{1,2}/g) || [];
      const quads = clean.match(/.{1,4}/g) || [];
      return [
        `Colon Format (Linux/IEEE):     ${pairs.join(":").toUpperCase()}`,
        `Hyphen Format (Windows):        ${pairs.join("-").toUpperCase()}`,
        `Cisco Dot Format:              ${quads.join(".").toLowerCase()}`,
        `Lowercase Colon:               ${pairs.join(":").toLowerCase()}`,
        `Bare Hexadecimal:              ${clean.toUpperCase()}`
      ].join("\n");
    }
  },

  "dockerfile-linter": {
    input: {
      label: "Dockerfile Content",
      placeholder: "FROM node:latest\nWORKDIR /app...",
      example: "FROM node:latest\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD [\"node\", \"server.js\"]",
      rows: 6
    },
    outputLabel: "Linting & Best Practice Audit",
    outputExt: "txt",
    run(input) {
      const issues: string[] = [];
      const lines = input.split("\n").map(l => l.trim());
      if (lines.some(l => /FROM\s+\w+:latest/i.test(l))) {
        issues.push("• [WARNING] Avoid ':latest' tag in FROM. Pin to an explicit version (e.g. node:20-alpine).");
      }
      if (!lines.some(l => /USER\s+/i.test(l))) {
        issues.push("• [SECURITY] Container runs as root. Consider adding 'USER node' or a non-root UID.");
      }
      if (lines.some(l => /^RUN\s+apt-get\s+update\s*$/i.test(l))) {
        issues.push("• [EFFICIENCY] Combine 'apt-get update' with 'apt-get install' in a single RUN command.");
      }
      if (issues.length === 0) return "✓ No common Dockerfile anti-patterns detected!";
      return `Dockerfile Audit Findings:\n${issues.join("\n")}`;
    }
  },

  "nginx-config-formatter": {
    input: {
      label: "Nginx Configuration",
      placeholder: "server { listen 80; server_name example.com; location / { proxy_pass http://localhost:3000; } }",
      example: "server { listen 80; server_name site.com; location / { try_files $uri $uri/ =404; } }",
      rows: 5
    },
    outputLabel: "Beautified Nginx Config",
    outputExt: "conf",
    run(input) {
      const clean = input.replace(/\s+/g, " ").replace(/;\s*/g, ";\n").replace(/\{\s*/g, "{\n").replace(/\}\s*/g, "\n}\n");
      let indent = 0;
      return clean.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
        if (line.includes("}")) indent = Math.max(0, indent - 1);
        const res = "  ".repeat(indent) + line;
        if (line.includes("{")) indent++;
        return res;
      }).join("\n");
    }
  },

  "git-command-cheatsheet": {
    input: false,
    options: [
      { id: "action", label: "Git Scenario", type: "select", default: "undo-commit", choices: [["undo-commit", "Undo Last Commit (Keep Staged Changes)"], ["hard-reset", "Discard All Uncommitted Changes"], ["rename-branch", "Rename Current Branch"], ["squash-commits", "Interactive Rebase Last N Commits"], ["delete-remote-branch", "Delete Remote Branch"]] }
    ],
    outputLabel: "Git Command Execution",
    outputExt: "sh",
    run(_, opts) {
      const commands: Record<string, string> = {
        "undo-commit": "git reset --soft HEAD~1\n# Undoes commit but leaves files staged in index",
        "hard-reset": "git reset --hard HEAD\ngit clean -fd\n# Permanently discards uncommitted changes and untracked files",
        "rename-branch": "git branch -m new-branch-name\ngit push origin -u new-branch-name\n# Renames branch locally and upstream",
        "squash-commits": "git rebase -i HEAD~3\n# Rebase last 3 commits interactively",
        "delete-remote-branch": "git push origin --delete branch-name\n# Removes branch from remote repository"
      };
      return commands[String(opts.action)] || "git status";
    }
  },

  "semver-calculator": {
    input: {
      label: "Current Version (e.g. 1.2.3)",
      placeholder: "1.4.2",
      example: "2.1.0",
      rows: 2
    },
    options: [
      { id: "bump", label: "Release Type", type: "select", default: "patch", choices: [["patch", "Patch Release (1.2.x -> Bug fixes)"], ["minor", "Minor Release (1.x.0 -> Backwards compatible features)"], ["major", "Major Release (x.0.0 -> Breaking changes)"]] }
    ],
    outputLabel: "Bumped Semver Version",
    outputExt: "txt",
    run(input, opts) {
      const match = input.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
      if (!match) throw new Error("Version must follow Semantic Versioning format (e.g. 1.2.3).");
      let [, maj, min, pat] = match.map(Number);
      if (opts.bump === "major") { maj++; min = 0; pat = 0; }
      else if (opts.bump === "minor") { min++; pat = 0; }
      else { pat++; }
      return `${maj}.${min}.${pat}`;
    }
  },

  "robots-txt-validator": {
    input: {
      label: "Robots.txt Content",
      placeholder: "User-agent: *\nDisallow: /admin/\nSitemap: https://example.com/sitemap.xml",
      example: "User-agent: Googlebot\nDisallow: /private/\n\nUser-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml",
      rows: 6
    },
    outputLabel: "Robots.txt Analysis",
    outputExt: "txt",
    run(input) {
      const lines = input.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));
      const hasUserAgent = lines.some(l => /^User-agent:/i.test(l));
      const hasSitemap = lines.some(l => /^Sitemap:/i.test(l));
      const results = [];
      results.push(hasUserAgent ? "✓ User-agent declaration found." : "✗ Missing 'User-agent:' declaration.");
      results.push(hasSitemap ? "✓ Sitemap XML directive specified." : "ℹ Tip: Adding a 'Sitemap: https://...' directive aids search crawlers.");
      results.push(`Total Directives Parsed: ${lines.length}`);
      return results.join("\n");
    }
  },

  "sitemap-xml-validator": {
    input: {
      label: "Sitemap XML Snippet",
      placeholder: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url>\n    <loc>https://example.com/</loc>\n  </url>\n</urlset>",
      example: "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>https://example.com/</loc><lastmod>2025-01-01</lastmod></url></urlset>",
      rows: 6
    },
    outputLabel: "Sitemap Validation Summary",
    outputExt: "txt",
    run(input) {
      const hasUrlset = /<urlset[\s>]/i.test(input) && /<\/urlset>/i.test(input);
      const urlCount = (input.match(/<loc>/gi) || []).length;
      if (!hasUrlset) return "✗ Root <urlset> element missing or unclosed.";
      return `✓ Valid XML Sitemap structure.\nTotal URL entries detected: ${urlCount}`;
    }
  },

  "html-entity-encoder": {
    input: {
      label: "Plain Text with HTML Characters",
      placeholder: "<h1>Welcome & \"Hello\" 'World'!</h1>",
      example: "<div class=\"hero\">Tom & Jerry > Sylvester</div>",
      rows: 4
    },
    outputLabel: "HTML Entity Encoded Text",
    outputExt: "html",
    run(input) {
      const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return input.replace(/[&<>"']/g, c => map[c]);
    }
  },

  "html-entity-decoder": {
    input: {
      label: "HTML Entities Text",
      placeholder: "&lt;div class=&quot;hero&quot;&gt;Tom &amp; Jerry&lt;/div&gt;",
      example: "&lt;h1&gt;Tom &amp; Jerry &gt; Sylvester&#39;s&lt;/h1&gt;",
      rows: 4
    },
    outputLabel: "Decoded Plain Text",
    outputExt: "txt",
    run(input) {
      return input
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'");
    }
  },

  "string-escape-unescape": {
    input: {
      label: "Raw String Input",
      placeholder: "Hello \"World\"\nNew line \t tab",
      example: "Path: C:\\Users\\Name\n\"Quoted text\"",
      rows: 4
    },
    options: [
      { id: "mode", label: "Mode", type: "select", default: "escape", choices: [["escape", "Escape String (Add backslashes)"], ["unescape", "Unescape String (Remove backslashes)"]] }
    ],
    outputLabel: "Result String",
    outputExt: "txt",
    run(input, opts) {
      if (opts.mode === "escape") {
        return JSON.stringify(input).slice(1, -1);
      } else {
        try {
          return JSON.parse(`"${input}"`);
        } catch {
          return input.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        }
      }
    }
  },

  "chmod-permissions-calculator": {
    input: {
      label: "Chmod Notation (e.g. 755 or rwxr-xr-x)",
      placeholder: "755",
      example: "755",
      rows: 2
    },
    outputLabel: "Permissions Breakdown",
    outputExt: "txt",
    run(input) {
      const val = input.trim();
      const octalMap: Record<number, string> = {
        0: "---", 1: "--x", 2: "-w-", 3: "-wx",
        4: "r--", 5: "r-x", 6: "rw-", 7: "rwx"
      };
      if (/^[0-7]{3}$/.test(val)) {
        const [u, g, o] = val.split("").map(Number);
        return [
          `Octal:      ${val}`,
          `Symbolic:   ${octalMap[u]}${octalMap[g]}${octalMap[o]}`,
          `User:       Read (${Boolean(u & 4)}) Write (${Boolean(u & 2)}) Execute (${Boolean(u & 1)})`,
          `Group:      Read (${Boolean(g & 4)}) Write (${Boolean(g & 2)}) Execute (${Boolean(g & 1)})`,
          `Others:     Read (${Boolean(o & 4)}) Write (${Boolean(o & 2)}) Execute (${Boolean(o & 1)})`
        ].join("\n");
      }
      return "Enter a 3-digit octal number (e.g. 755, 644, 777).";
    }
  },

  "base32-encoder": {
    input: {
      label: "Text to Encode in Base32",
      placeholder: "Hello World",
      example: "Hello, Base32!",
      rows: 3
    },
    outputLabel: "Base32 Encoded Output",
    outputExt: "txt",
    run(input) {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const bytes = new TextEncoder().encode(input);
      let bits = 0;
      let value = 0;
      let output = "";
      for (const b of bytes) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 5) {
          output += alphabet[(value >>> (bits - 5)) & 31];
          bits -= 5;
        }
      }
      if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
      while (output.length % 8 !== 0) output += "=";
      return output;
    }
  },

  "base32-decoder": {
    input: {
      label: "Base32 String to Decode",
      placeholder: "JBSWY3DPEBLW64TMMQ======",
      example: "JBSWY3DPEBLW64TMMQ======",
      rows: 3
    },
    outputLabel: "Decoded Text",
    outputExt: "txt",
    run(input) {
      const clean = input.trim().toUpperCase().replace(/=+$/, "");
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      let bits = 0;
      let value = 0;
      const bytes: number[] = [];
      for (let i = 0; i < clean.length; i++) {
        const idx = alphabet.indexOf(clean[i]);
        if (idx === -1) continue;
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
          bytes.push((value >>> (bits - 8)) & 255);
          bits -= 8;
        }
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    }
  },

  "base58-encoder": {
    input: {
      label: "Text to Encode in Base58",
      placeholder: "Hello World",
      example: "Bitcoin Base58 Test",
      rows: 3
    },
    outputLabel: "Base58 Encoded Output",
    outputExt: "txt",
    run(input) {
      const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const bytes = new TextEncoder().encode(input);
      const digits = [0];
      for (let i = 0; i < bytes.length; i++) {
        for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
        digits[0] += bytes[i];
        let carry = 0;
        for (let j = 0; j < digits.length; j++) {
          digits[j] += carry;
          carry = (digits[j] / 58) | 0;
          digits[j] %= 58;
        }
        while (carry) {
          digits.push(carry % 58);
          carry = (carry / 58) | 0;
        }
      }
      let str = "";
      for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str += "1";
      for (let i = digits.length - 1; i >= 0; i--) str += ALPHABET[digits[i]];
      return str;
    }
  },

  "base58-decoder": {
    input: {
      label: "Base58 String to Decode",
      placeholder: "JxF12TrwUP45BMd",
      example: "JxF12TrwUP45BMd",
      rows: 3
    },
    outputLabel: "Decoded Text",
    outputExt: "txt",
    run(input) {
      const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
      const str = input.trim();
      const bytes = [0];
      for (let i = 0; i < str.length; i++) {
        const c = ALPHABET.indexOf(str[i]);
        if (c === -1) continue;
        for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
        bytes[0] += c;
        let carry = 0;
        for (let j = 0; j < bytes.length; j++) {
          bytes[j] += carry;
          carry = bytes[j] >> 8;
          bytes[j] &= 255;
        }
        while (carry) {
          bytes.push(carry & 255);
          carry >>= 8;
        }
      }
      return new TextDecoder().decode(new Uint8Array(bytes.reverse()));
    }
  },

  "base85-encoder": {
    input: {
      label: "Text to Encode in Ascii85 / Base85",
      placeholder: "Hello World",
      example: "Ascii85 Test String",
      rows: 3
    },
    outputLabel: "Base85 Output",
    outputExt: "txt",
    run(input) {
      const bytes = new TextEncoder().encode(input);
      let output = "<~";
      let tuple = 0;
      let count = 0;
      for (let i = 0; i < bytes.length; i++) {
        tuple |= bytes[i] << (24 - (count * 8));
        count++;
        if (count === 4) {
          tuple = tuple >>> 0;
          if (tuple === 0) output += "z";
          else {
            let s = "";
            for (let j = 0; j < 5; j++) {
              s = String.fromCharCode((tuple % 85) + 33) + s;
              tuple = (tuple / 85) | 0;
            }
            output += s;
          }
          tuple = 0;
          count = 0;
        }
      }
      if (count > 0) {
        tuple = tuple >>> 0;
        let s = "";
        for (let j = 0; j < 5; j++) {
          s = String.fromCharCode((tuple % 85) + 33) + s;
          tuple = (tuple / 85) | 0;
        }
        output += s.slice(0, count + 1);
      }
      return output + "~>";
    }
  },

  "base85-decoder": {
    input: {
      label: "Base85 Encoded String",
      placeholder: "<~87cURD]j7BEbo80~>",
      example: "<~87cURD]j7BEbo80~>",
      rows: 3
    },
    outputLabel: "Decoded Text",
    outputExt: "txt",
    run(input) {
      let clean = input.trim();
      if (clean.startsWith("<~") && clean.endsWith("~>")) clean = clean.slice(2, -2);
      clean = clean.replace(/\s+/g, "");
      const bytes: number[] = [];
      let tuple = 0;
      let count = 0;
      for (let i = 0; i < clean.length; i++) {
        const c = clean.charCodeAt(i);
        if (c === 122 && count === 0) { // 'z'
          bytes.push(0, 0, 0, 0);
          continue;
        }
        if (c < 33 || c > 117) continue;
        tuple = tuple * 85 + (c - 33);
        count++;
        if (count === 5) {
          bytes.push((tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255);
          tuple = 0;
          count = 0;
        }
      }
      if (count > 1) {
        for (let i = count; i < 5; i++) tuple = tuple * 85 + 84;
        for (let i = 0; i < count - 1; i++) bytes.push((tuple >>> (24 - i * 8)) & 255);
      }
      return new TextDecoder().decode(new Uint8Array(bytes));
    }
  },

  "hex-dump-generator": {
    input: {
      label: "Plain Text String",
      placeholder: "Type text to view memory hex dump...",
      example: "Hello, World!\nBinary Hex Dump Test",
      rows: 4
    },
    outputLabel: "Formatted Hex Dump",
    outputExt: "txt",
    run(input) {
      const bytes = new TextEncoder().encode(input);
      const lines: string[] = [];
      for (let i = 0; i < bytes.length; i += 16) {
        const chunk = bytes.slice(i, i + 16);
        const offset = i.toString(16).padStart(8, "0");
        const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, "0")).join(" ");
        const ascii = Array.from(chunk).map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : ".")).join("");
        lines.push(`${offset}  ${hex.padEnd(48, " ")}  |${ascii}|`);
      }
      return lines.join("\n");
    }
  },

  "css-box-shadow-stacker": {
    input: false,
    options: [
      { id: "elevation", label: "Elevation Level", type: "select", default: "medium", choices: [["low", "Low Elevation (Subtle Card)"], ["medium", "Medium Elevation (Dropdown / Modal)"], ["high", "High Elevation (Floating Popover)"], ["ambient", "Smooth Multi-Layer Ambient Shadow"]] }
    ],
    outputLabel: "CSS Box Shadow Code",
    outputExt: "css",
    preview: "css",
    run(_, opts) {
      const map: Record<string, string> = {
        low: "box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);",
        medium: "box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);",
        high: "box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);",
        ambient: "box-shadow: 0 2px 4px rgba(0,0,0,0.02), 0 6px 12px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06);"
      };
      return map[String(opts.elevation)] || map.medium;
    }
  },

  "css-flexbox-code-generator": {
    input: false,
    options: [
      { id: "direction", label: "Flex Direction", type: "select", default: "row", choices: [["row", "row"], ["column", "column"], ["row-reverse", "row-reverse"]] },
      { id: "justify", label: "Justify Content", type: "select", default: "space-between", choices: [["center", "center"], ["space-between", "space-between"], ["space-around", "space-around"], ["flex-start", "flex-start"]] },
      { id: "align", label: "Align Items", type: "select", default: "center", choices: [["center", "center"], ["flex-start", "flex-start"], ["stretch", "stretch"]] },
      { id: "gap", label: "Gap (px)", type: "number", default: 16 }
    ],
    outputLabel: "Generated Flexbox CSS",
    outputExt: "css",
    run(_, opts) {
      return [
        "display: flex;",
        `flex-direction: ${opts.direction};`,
        `justify-content: ${opts.justify};`,
        `align-items: ${opts.align};`,
        `gap: ${opts.gap}px;`
      ].join("\n");
    }
  },

  "css-grid-code-generator": {
    input: false,
    options: [
      { id: "columns", label: "Columns Count", type: "number", default: 3, min: 1, max: 12 },
      { id: "gap", label: "Grid Gap (px)", type: "number", default: 24 },
      { id: "autoFit", label: "Responsive Auto-Fit Grid", type: "checkbox", default: true }
    ],
    outputLabel: "Generated CSS Grid Declarations",
    outputExt: "css",
    run(_, opts) {
      const cols = Number(opts.columns || 3);
      const gap = Number(opts.gap || 24);
      if (opts.autoFit) {
        return [
          "display: grid;",
          "grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));",
          `gap: ${gap}px;`
        ].join("\n");
      }
      return [
        "display: grid;",
        `grid-template-columns: repeat(${cols}, 1fr);`,
        `gap: ${gap}px;`
      ].join("\n");
    }
  },

  "css-clamp-typography": {
    input: false,
    options: [
      { id: "minSizePx", label: "Minimum Font Size (px)", type: "number", default: 16 },
      { id: "maxSizePx", label: "Maximum Font Size (px)", type: "number", default: 24 },
      { id: "minViewportPx", label: "Min Viewport Width (px)", type: "number", default: 375 },
      { id: "maxViewportPx", label: "Max Viewport Width (px)", type: "number", default: 1280 }
    ],
    outputLabel: "CSS Fluid Font Size clamp()",
    outputExt: "css",
    run(_, opts) {
      const minFs = Number(opts.minSizePx || 16);
      const maxFs = Number(opts.maxSizePx || 24);
      const minVw = Number(opts.minViewportPx || 375);
      const maxVw = Number(opts.maxViewportPx || 1280);
      const slope = (maxFs - minFs) / (maxVw - minVw);
      const yAxisIntersection = -minVw * slope + minFs;
      const vwVal = (slope * 100).toFixed(2);
      const remBase = (yAxisIntersection / 16).toFixed(4);
      return `font-size: clamp(${minFs / 16}rem, ${remBase}rem + ${vwVal}vw, ${maxFs / 16}rem);`;
    }
  },

  "css-triangle-generator": {
    input: false,
    options: [
      { id: "direction", label: "Triangle Direction", type: "select", default: "up", choices: [["up", "Pointing Up"], ["down", "Pointing Down"], ["left", "Pointing Left"], ["right", "Pointing Right"]] },
      { id: "sizePx", label: "Triangle Width/Height (px)", type: "number", default: 20 },
      { id: "color", label: "Color Hex", type: "text", default: "#3b82f6" }
    ],
    outputLabel: "CSS Pure Border Triangle",
    outputExt: "css",
    run(_, opts) {
      const s = Number(opts.sizePx || 20);
      const color = String(opts.color || "#3b82f6");
      const d = String(opts.direction || "up");
      const lines = ["width: 0;", "height: 0;"];
      if (d === "up") lines.push(`border-left: ${s / 2}px solid transparent;`, `border-right: ${s / 2}px solid transparent;`, `border-bottom: ${s}px solid ${color};`);
      else if (d === "down") lines.push(`border-left: ${s / 2}px solid transparent;`, `border-right: ${s / 2}px solid transparent;`, `border-top: ${s}px solid ${color};`);
      else if (d === "left") lines.push(`border-top: ${s / 2}px solid transparent;`, `border-bottom: ${s / 2}px solid transparent;`, `border-right: ${s}px solid ${color};`);
      else lines.push(`border-top: ${s / 2}px solid transparent;`, `border-bottom: ${s / 2}px solid transparent;`, `border-left: ${s}px solid ${color};`);
      return lines.join("\n");
    }
  },

  "svg-path-optimizer": {
    input: {
      label: "SVG Path Data (d attribute)",
      placeholder: "M 10.000 20.000 L 30.500 40.250 Z",
      example: "M 10.2543 20.9123 L 30.4999 40.2501 Z",
      rows: 4
    },
    options: [
      { id: "decimals", label: "Coordinate Decimal Precision", type: "number", default: 2, min: 0, max: 4 }
    ],
    outputLabel: "Optimized Path String",
    outputExt: "txt",
    run(input, opts) {
      const dec = Number(opts.decimals ?? 2);
      return input.replace(/([0-9]+\.[0-9]+)/g, m => Number(m).toFixed(dec)).replace(/\s+/g, " ").trim();
    }
  },

  "markdown-table-aligner": {
    input: {
      label: "Rough Markdown Table",
      placeholder: "|Name|Role|City|\n|Alice|Dev|NYC|\n|Bob|Designer|London|",
      example: "| Feature | Basic | Pro |\n| Storage | 5GB | 50GB |\n| Users | 1 | Unlimited |",
      rows: 5
    },
    outputLabel: "Aligned Markdown Table",
    outputExt: "md",
    run(input) {
      const rows = input.trim().split("\n").map(line => line.split("|").slice(1, -1).map(cell => cell.trim()));
      if (rows.length < 2) return input;
      const colCount = Math.max(...rows.map(r => r.length));
      const colWidths = Array(colCount).fill(0);
      rows.forEach(r => {
        r.forEach((cell, i) => { colWidths[i] = Math.max(colWidths[i], cell.length); });
      });
      return rows.map((r, rowIndex) => {
        const padded = r.map((cell, i) => cell.padEnd(colWidths[i], rowIndex === 1 && /^-+$/.test(cell) ? "-" : " "));
        return `| ${padded.join(" | ")} |`;
      }).join("\n");
    }
  },

  "graphql-query-prettifier": {
    input: {
      label: "Minified GraphQL Query",
      placeholder: "query GetUser{user(id:1){id name email orders{id total}}}",
      example: "query GetUser{user(id:1){id name email orders{id total}}}",
      rows: 4
    },
    outputLabel: "Prettified GraphQL Query",
    outputExt: "graphql",
    run(input) {
      const clean = input.replace(/\s+/g, " ").replace(/\{\s*/g, " {\n").replace(/\}\s*/g, "\n}\n");
      let indent = 0;
      return clean.split("\n").map(l => l.trim()).filter(Boolean).map(l => {
        if (l.includes("}")) indent = Math.max(0, indent - 1);
        const res = "  ".repeat(indent) + l;
        if (l.includes("{")) indent++;
        return res;
      }).join("\n");
    }
  },

  "graphql-query-minifier": {
    input: {
      label: "Formatted GraphQL Query",
      placeholder: "query GetUser {\n  user(id: 1) {\n    id\n    name\n  }\n}",
      example: "query GetUser {\n  user(id: 1) {\n    id\n    name\n    email\n  }\n}",
      rows: 5
    },
    outputLabel: "Minified GraphQL",
    outputExt: "graphql",
    run(input) {
      return input.replace(/#.*$/gm, "").replace(/\s+/g, " ").replace(/\s*([{}():])\s*/g, "$1").trim();
    }
  },

  "json-to-xml-converter": {
    input: {
      label: "JSON String",
      placeholder: "{\"user\": {\"name\": \"Alice\", \"age\": 30}}",
      example: "{\"user\": {\"id\": 101, \"name\": \"Alice\", \"active\": true}}",
      rows: 5
    },
    outputLabel: "Hierarchical XML Output",
    outputExt: "xml",
    run(input) {
      const data = JSON.parse(input);
      const toXml = (obj: unknown, tag = "root"): string => {
        if (typeof obj !== "object" || obj === null) return `<${tag}>${String(obj)}</${tag}>`;
        if (Array.isArray(obj)) return obj.map(item => toXml(item, tag)).join("\n");
        const inner = Object.entries(obj as Record<string, unknown>).map(([k, v]) => toXml(v, k)).join("\n  ");
        return `<${tag}>\n  ${inner}\n</${tag}>`;
      };
      return `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(data)}`;
    }
  }
};
