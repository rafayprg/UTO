import type { TextOp } from "./types";

export const advancedTextOps: Record<string, TextOp> = {
  "nato-phonetic-speller": {
    input: {
      label: "Text to Spell Phonetically",
      placeholder: "Hello 123",
      example: "Mission 42",
      rows: 2
    },
    outputLabel: "NATO / Aviation Phonetic Alphabet",
    outputExt: "txt",
    run(input) {
      const nato: Record<string, string> = {
        a: "Alfa", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot",
        g: "Golf", h: "Hotel", i: "India", j: "Juliett", k: "Kilo", l: "Lima",
        m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo",
        s: "Sierra", t: "Tango", u: "Uniform", v: "Victor", w: "Whiskey", x: "X-ray",
        y: "Yankee", z: "Zulu",
        "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four",
        "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner"
      };
      return input.split("").map(c => {
        const lower = c.toLowerCase();
        if (nato[lower]) return `${c} -> ${nato[lower]}`;
        if (c === " ") return "[Space]";
        return `${c} -> ${c}`;
      }).join("\n");
    }
  },

  "morse-code-translator": {
    input: {
      label: "Plain Text or Morse Code",
      placeholder: "SOS or ... --- ...",
      example: "MAYDAY MAYDAY",
      rows: 3
    },
    outputLabel: "Translated Output",
    outputExt: "txt",
    run(input) {
      const morse: Record<string, string> = {
        a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....",
        i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.",
        q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
        y: "-.--", z: "--..", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
        "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.", "0": "-----"
      };
      const text = input.trim();
      if (/^[.\-/\s]+$/.test(text)) {
        // Decode Morse
        const rev: Record<string, string> = Object.fromEntries(Object.entries(morse).map(([k, v]) => [v, k.toUpperCase()]));
        return text.split("/").map(word => word.trim().split(/\s+/).map(code => rev[code] || "?").join("")).join(" ");
      } else {
        // Encode to Morse
        return text.toLowerCase().split(" ").map(word => {
          return word.split("").map(c => morse[c] || c).join(" ");
        }).join(" / ");
      }
    }
  },

  "braille-unicode-translator": {
    input: {
      label: "English Text to Braille",
      placeholder: "Hello world",
      example: "Braille alphabet text",
      rows: 3
    },
    outputLabel: "Unicode Braille Representation",
    outputExt: "txt",
    run(input) {
      const brailleMap: Record<string, string> = {
        a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊", j: "⠚",
        k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗", s: "⠎", t: "⠞",
        u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵", " ": " "
      };
      return input.toLowerCase().split("").map(c => brailleMap[c] || c).join("");
    }
  },

  "caesar-cipher-encoder": {
    input: {
      label: "Text to Encrypt / Decrypt",
      placeholder: "Hello World",
      example: "The secret meet is at midnight",
      rows: 3
    },
    options: [
      { id: "shift", label: "Shift Key (1 - 25)", type: "number", default: 13, min: 1, max: 25 }
    ],
    outputLabel: "Caesar Cipher Result",
    outputExt: "txt",
    run(input, opts) {
      const shift = Number(opts.shift || 13);
      return input.split("").map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + shift) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
          return String.fromCharCode(((code - 97 + shift) % 26) + 97);
        }
        return char;
      }).join("");
    }
  },

  "binary-to-text-converter": {
    input: {
      label: "Binary 8-Bit String",
      placeholder: "01001000 01101001",
      example: "01001000 01100101 01101100 01101100 01101111",
      rows: 3
    },
    outputLabel: "Decoded Plain Text",
    outputExt: "txt",
    run(input) {
      const chunks = input.trim().split(/\s+/);
      const chars = chunks.map(bin => String.fromCharCode(parseInt(bin, 2)));
      return chars.join("");
    }
  },

  "text-to-binary-converter": {
    input: {
      label: "Plain Text String",
      placeholder: "Hello",
      example: "Antigravity",
      rows: 3
    },
    outputLabel: "8-Bit Binary Representation",
    outputExt: "txt",
    run(input) {
      return input.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    }
  },

  "hex-to-text-converter": {
    input: {
      label: "Hexadecimal String",
      placeholder: "48 65 6c 6c 6f",
      example: "48656c6c6f20576f726c64",
      rows: 3
    },
    outputLabel: "Decoded Text",
    outputExt: "txt",
    run(input) {
      const clean = input.replace(/\s+/g, "");
      let text = "";
      for (let i = 0; i < clean.length; i += 2) {
        text += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
      }
      return text;
    }
  },

  "text-to-hex-converter": {
    input: {
      label: "Plain Text String",
      placeholder: "Hello World",
      example: "Encode this string into hex",
      rows: 3
    },
    outputLabel: "Hexadecimal String",
    outputExt: "txt",
    run(input) {
      return input.split("").map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ");
    }
  },

  "leet-speak-generator": {
    input: {
      label: "Plain Text to 1337 Speak",
      placeholder: "Fear the hacker",
      example: "Leet speak cyber security hacker",
      rows: 3
    },
    outputLabel: "1337 (Leet) Spelled Text",
    outputExt: "txt",
    run(input) {
      const map: Record<string, string> = {
        a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", b: "8", g: "9"
      };
      return input.toLowerCase().split("").map(c => map[c] || c).join("");
    }
  },

  "zalgo-glitch-text": {
    input: {
      label: "Normal Text",
      placeholder: "Glitch text effect",
      example: "HE IS COMING",
      rows: 2
    },
    outputLabel: "Corrupted Zalgo Glitch Text",
    outputExt: "txt",
    run(input) {
      const diacritics = [
        "\u0300", "\u0301", "\u0302", "\u0303", "\u0304", "\u0305", "\u0306",
        "\u0310", "\u0311", "\u0312", "\u0313", "\u0314", "\u0315", "\u031b",
        "\u0320", "\u0321", "\u0322", "\u0327", "\u0328", "\u0329", "\u032a"
      ];
      return input.split("").map(c => {
        let res = c;
        for (let i = 0; i < 3; i++) {
          res += diacritics[Math.floor(Math.random() * diacritics.length)];
        }
        return res;
      }).join("");
    }
  },

  "upside-down-text": {
    input: {
      label: "Text to Flip Upside Down",
      placeholder: "Flip me upside down",
      example: "Hello World!",
      rows: 3
    },
    outputLabel: "Inverted / Upside Down Text",
    outputExt: "txt",
    run(input) {
      const flipMap: Record<string, string> = {
        a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ",
        j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ",
        s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z",
        "?": "¿", "!": "¡", ".": "˙", ",": "'", "(": ")", ")": "("
      };
      return input.toLowerCase().split("").reverse().map(c => flipMap[c] || c).join("");
    }
  },

  "small-caps-unicode": {
    input: {
      label: "Normal Lowercase Text",
      placeholder: "Small caps aesthetic text",
      example: "Clean aesthetic typography in small caps",
      rows: 3
    },
    outputLabel: "Small Caps Unicode Text",
    outputExt: "txt",
    run(input) {
      const smallCaps: Record<string, string> = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", i: "ɪ",
        j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
        s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
      };
      return input.toLowerCase().split("").map(c => smallCaps[c] || c).join("");
    }
  },

  "strikethrough-text-formatter": {
    input: {
      label: "Plain Text to Strike Through",
      placeholder: "This item is sold out",
      example: "Old price: $199 -> New price: $99",
      rows: 2
    },
    outputLabel: "Strikethrough Unicode Text",
    outputExt: "txt",
    run(input) {
      return input.split("").map(c => c + "\u0336").join("");
    }
  },

  "underline-unicode-formatter": {
    input: {
      label: "Plain Text to Underline",
      placeholder: "Important heading",
      example: "Underlined emphasis note",
      rows: 2
    },
    outputLabel: "Underlined Unicode Text",
    outputExt: "txt",
    run(input) {
      return input.split("").map(c => c + "\u0332").join("");
    }
  },

  "keyword-density-analyzer": {
    input: {
      label: "Article or Blog Copy",
      placeholder: "Paste article text to inspect keyword distribution...",
      example: "Search engine optimization improves website visibility. Good SEO practices include search keyword research and search content optimization.",
      rows: 6
    },
    outputLabel: "Top Keyword Density Breakdown",
    outputExt: "txt",
    run(input) {
      const words = input.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
      if (words.length === 0) return "No valid words found.";
      const counts: Record<string, number> = {};
      words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      return sorted.map(([w, count]) => {
        const pct = ((count / words.length) * 100).toFixed(1);
        return `• "${w}": ${count} times (${pct}%)`;
      }).join("\n");
    }
  },

  "reading-speaking-time-estimator": {
    input: {
      label: "Speech or Article Content",
      placeholder: "Paste your presentation or speech...",
      example: "Public speaking requires pacing yourself clearly. The average reading speed is roughly two hundred words per minute, while conversational speaking pace sits comfortably between one hundred thirty and one hundred fifty words per minute.",
      rows: 6
    },
    outputLabel: "Pacing & Duration Estimates",
    outputExt: "txt",
    run(input) {
      const words = input.trim().split(/\s+/).filter(Boolean).length;
      const readMins = words / 225;
      const speakMins = words / 140;
      return [
        `Word Count:            ${words.toLocaleString()} words`,
        `Silent Reading Time:   ${Math.ceil(readMins * 60)} seconds (~${readMins.toFixed(1)} mins at 225 WPM)`,
        `Speaking Presentation: ${Math.ceil(speakMins * 60)} seconds (~${speakMins.toFixed(1)} mins at 140 WPM)`
      ].join("\n");
    }
  },

  "text-readability-scorer": {
    input: {
      label: "Text to Score Readability",
      placeholder: "Paste sample text to calculate grade level...",
      example: "The quick brown fox jumps over the lazy dog. Simple writing ensures clear understanding for all audiences.",
      rows: 5
    },
    outputLabel: "Flesch Reading Ease & Grade Level",
    outputExt: "txt",
    run(input) {
      const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
      const words = input.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length || 1;
      // Approximate syllable count
      let syllables = 0;
      words.forEach(w => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, "");
        const matches = clean.match(/[aeiouy]{1,2}/g);
        syllables += matches ? matches.length : 1;
      });
      const asl = wordCount / sentences;
      const asw = syllables / wordCount;
      const flesch = 206.835 - (1.015 * asl) - (84.6 * asw);
      const grade = (0.39 * asl) + (11.8 * asw) - 15.59;
      return [
        `Flesch Reading Ease:     ${flesch.toFixed(1)} / 100 (${flesch >= 60 ? "Plain English" : "Academic / Difficult"})`,
        `Flesch-Kincaid Grade:    Grade ${Math.max(1, Math.round(grade))}`,
        `Average Sentence Length: ${asl.toFixed(1)} words/sentence`
      ].join("\n");
    }
  },

  "syllable-counter-haiku": {
    input: {
      label: "Haiku or Poetry Lines (3 lines)",
      placeholder: "An old silent pond\nA frog jumps into the pond\nSplash! Silence again.",
      example: "An old silent pond\nA frog jumps into the pond\nSplash! Silence again.",
      rows: 4
    },
    outputLabel: "Line Syllable Breakdown",
    outputExt: "txt",
    run(input) {
      const countSyllables = (text: string) => {
        const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
        return words.reduce((acc, w) => {
          const m = w.match(/[aeiouy]{1,2}/g);
          return acc + (m ? m.length : 1);
        }, 0);
      };
      const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
      return lines.map((l, i) => `Line ${i + 1} (${countSyllables(l)} syllables): "${l}"`).join("\n");
    }
  },

  "word-frequency-counter": {
    input: {
      label: "Text Body",
      placeholder: "Paste document text...",
      example: "Blue is my favorite color. Blue skies and blue ocean waters bring peace.",
      rows: 5
    },
    outputLabel: "Frequency Ranking",
    outputExt: "txt",
    run(input) {
      const words = input.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
      const map: Record<string, number> = {};
      words.forEach(w => { map[w] = (map[w] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w, c]) => `${w}: ${c}`).join("\n");
    }
  },

  "passive-voice-highlighter": {
    input: {
      label: "Writing Sample",
      placeholder: "The report was written by the manager...",
      example: "The decision was made by the board. The code was tested thoroughly.",
      rows: 4
    },
    outputLabel: "Passive Voice Verbs Detected",
    outputExt: "txt",
    run(input) {
      const passiveRegex = /\b(am|is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en)\b/gi;
      const matches = [...input.matchAll(passiveRegex)];
      if (matches.length === 0) return "✓ No obvious passive voice verb constructions detected.";
      return `Passive Voice Flagged (${matches.length} instances):\n` + matches.map(m => `• "${m[0]}"`).join("\n");
    }
  },

  "filler-words-highlighter": {
    input: {
      label: "Speech or Draft Copy",
      placeholder: "Basically, I just think that you know...",
      example: "Basically, I literally just think that, you know, we should actually move forward.",
      rows: 4
    },
    outputLabel: "Detected Filler & Clutter Words",
    outputExt: "txt",
    run(input) {
      const fillers = ["basically", "literally", "actually", "just", "you know", "like", "sort of", "kind of", "honestly"];
      const found: string[] = [];
      const lower = input.toLowerCase();
      fillers.forEach(f => {
        const count = (lower.match(new RegExp(`\\b${f}\\b`, "g")) || []).length;
        if (count > 0) found.push(`• "${f}": ${count} times`);
      });
      if (found.length === 0) return "✓ Clean draft: zero common filler words detected.";
      return `Detected Clutter Words:\n${found.join("\n")}`;
    }
  },

  "full-text-statistics": {
    input: {
      label: "Document Content",
      placeholder: "Paste document text...",
      example: "Hello world!\nThis is a complete statistical text inspection tool.\nIt counts words, lines, and characters accurately.",
      rows: 5
    },
    outputLabel: "Statistical Inventory",
    outputExt: "txt",
    run(input) {
      const chars = input.length;
      const charsNoSpaces = input.replace(/\s+/g, "").length;
      const words = input.trim().split(/\s+/).filter(Boolean).length;
      const lines = input.split("\n").length;
      const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim()).length;
      return [
        `Characters (with spaces):    ${chars.toLocaleString()}`,
        `Characters (without spaces): ${charsNoSpaces.toLocaleString()}`,
        `Words:                       ${words.toLocaleString()}`,
        `Lines:                       ${lines.toLocaleString()}`,
        `Paragraphs:                  ${paragraphs.toLocaleString()}`
      ].join("\n");
    }
  },

  "email-address-extractor": {
    input: {
      label: "Unstructured Raw Text",
      placeholder: "Contact team at support@example.com or lead@client.org...",
      example: "Staff: alice@corp.com, bob.smith@tech.io, and support@corp.com.",
      rows: 4
    },
    outputLabel: "Unique Emails & Domains",
    outputExt: "txt",
    run(input) {
      const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = Array.from(new Set(input.match(regex) || []));
      if (emails.length === 0) return "No email addresses found.";
      const domains = Array.from(new Set(emails.map(e => e.split("@")[1])));
      return [
        `Extracted Unique Emails (${emails.length}):`,
        ...emails,
        `\nUnique Associated Domains (${domains.length}):`,
        ...domains
      ].join("\n");
    }
  },

  "url-link-extractor": {
    input: {
      label: "Raw Text with Links",
      placeholder: "Visit https://google.com or check http://example.org/page",
      example: "Docs available at https://docs.github.com/en and repo at https://github.com/project",
      rows: 4
    },
    outputLabel: "Extracted URLs",
    outputExt: "txt",
    run(input) {
      const regex = /https?:\/\/[^\s"'<>]+/gi;
      const urls = Array.from(new Set(input.match(regex) || []));
      if (urls.length === 0) return "No URLs detected.";
      return urls.join("\n");
    }
  },

  "phone-number-extractor": {
    input: {
      label: "Raw Text with Phone Numbers",
      placeholder: "Call us at +1 (555) 123-4567 or 800-555-0199",
      example: "Office: (415) 555-2671 | Emergency: +1-800-555-0199",
      rows: 4
    },
    outputLabel: "Extracted Phone Numbers",
    outputExt: "txt",
    run(input) {
      const regex = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})/g;
      const matches = Array.from(new Set(input.match(regex) || []));
      if (matches.length === 0) return "No phone numbers found.";
      return matches.join("\n");
    }
  },

  "hashtag-generator-cleaner": {
    input: {
      label: "Topic, Keywords, or Caption",
      placeholder: "web development, modern react, typescript tips",
      example: "software engineering, modern react, typescript tips, ai platform",
      rows: 3
    },
    outputLabel: "Formatted Social Media Hashtags",
    outputExt: "txt",
    run(input) {
      const items = input.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      return items.map(w => "#" + w.replace(/[^a-zA-Z0-9]/g, "")).filter(h => h.length > 1).join(" ");
    }
  },

  "markdown-to-plain-text": {
    input: {
      label: "Markdown Formatted Text",
      placeholder: "# Heading\n**Bold** and *italic* with [Link](https://site.com)",
      example: "## Product Overview\n\nThis is a **top-tier** platform with [Documentation](https://example.com).\n\n- Feature A\n- Feature B",
      rows: 5
    },
    outputLabel: "Stripped Plain Text",
    outputExt: "txt",
    run(input) {
      return input
        .replace(/^#+\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/`([^`]+)`/g, "$1");
    }
  },

  "text-case-inverter": {
    input: {
      label: "Mixed Case Text",
      placeholder: "hELLO wORLD",
      example: "tHIS IS aN iNVERTED sTRING",
      rows: 3
    },
    outputLabel: "Inverted Letter Cases",
    outputExt: "txt",
    run(input) {
      return input.split("").map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join("");
    }
  },

  "lorem-ipsum-generator": {
    input: false,
    options: [
      { id: "paragraphs", label: "Number of Paragraphs", type: "number", default: 3, min: 1, max: 10 }
    ],
    outputLabel: "Generated Lorem Ipsum Placeholder Text",
    outputExt: "txt",
    run(_, opts) {
      const count = Number(opts.paragraphs || 3);
      const para = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
      return Array(count).fill(para).join("\n\n");
    }
  },

  "bionic-reading-formatter": {
    input: {
      label: "Text to Format for Fast Bionic Reading",
      placeholder: "Paste text to convert into bold-anchored reading...",
      example: "Bionic reading guides the eyes through text with artificial fixation points.",
      rows: 4
    },
    outputLabel: "Bionic Reading Formatted Text (HTML)",
    outputExt: "html",
    preview: "html-text",
    run(input) {
      return input.split(/\s+/).map(word => {
        const mid = Math.ceil(word.length / 2);
        return `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
      }).join(" ");
    }
  },

  "random-password-generator": {
    input: false,
    options: [
      { id: "length", label: "Password Length", type: "number", default: 16, min: 8, max: 64 },
      { id: "includeSymbols", label: "Include Symbols (!@#$)", type: "checkbox", default: true }
    ],
    outputLabel: "Cryptographically Strong Passwords",
    outputExt: "txt",
    run(_, opts) {
      const len = Number(opts.length || 16);
      const withSymbols = Boolean(opts.includeSymbols ?? true);
      let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      if (withSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const passwords: string[] = [];
      for (let p = 0; p < 5; p++) {
        let pass = "";
        for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
        passwords.push(pass);
      }
      return passwords.join("\n");
    }
  },

  "pii-redactor-masker": {
    input: {
      label: "Text Containing Sensitive PII",
      placeholder: "Contact Alice at alice@site.com or 415-555-1234",
      example: "Customer John at john.doe@example.com called from 212-555-0199 about account #4829.",
      rows: 4
    },
    outputLabel: "Redacted / Masked PII Safe Text",
    outputExt: "txt",
    run(input) {
      return input
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]")
        .replace(/(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})/g, "[PHONE REDACTED]");
    }
  },

  "reverse-text-words": {
    input: {
      label: "Input String",
      placeholder: "The quick brown fox",
      example: "Step on no pets",
      rows: 2
    },
    options: [
      { id: "mode", label: "Mode", type: "select", default: "characters", choices: [["characters", "Reverse All Characters"], ["words", "Reverse Word Order"]] }
    ],
    outputLabel: "Reversed Output",
    outputExt: "txt",
    run(input, opts) {
      if (opts.mode === "words") {
        return input.trim().split(/\s+/).reverse().join(" ");
      }
      return input.split("").reverse().join("");
    }
  },

  "line-sorter-alphabetical": {
    input: {
      label: "List of Lines to Sort",
      placeholder: "Zebra\nApple\nMango\nBanana",
      example: "Zebra\nApple\nMango\nBanana",
      rows: 5
    },
    outputLabel: "Alphabetically Sorted Lines",
    outputExt: "txt",
    run(input) {
      return input.split("\n").map(l => l.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b)).join("\n");
    }
  },

  "duplicate-line-remover": {
    input: {
      label: "Text with Duplicate Lines",
      placeholder: "Apple\nBanana\nApple\nOrange\nBanana",
      example: "Red\nGreen\nBlue\nGreen\nYellow\nRed",
      rows: 5
    },
    outputLabel: "Unique Lines",
    outputExt: "txt",
    run(input) {
      return Array.from(new Set(input.split("\n").map(l => l.trim()).filter(Boolean))).join("\n");
    }
  },

  "blank-line-remover": {
    input: {
      label: "Text with Excess Blank Lines",
      placeholder: "Line 1\n\n\nLine 2\n\n\n\nLine 3",
      example: "Paragraph 1\n\n\n\nParagraph 2\n\n\nParagraph 3",
      rows: 5
    },
    outputLabel: "Cleaned Text (Zero Blank Lines)",
    outputExt: "txt",
    run(input) {
      return input.split("\n").map(l => l.trim()).filter(Boolean).join("\n");
    }
  },

  "prefix-suffix-line-adder": {
    input: {
      label: "List of Items (One per line)",
      placeholder: "item1\nitem2\nitem3",
      example: "apple\nbanana\ncherry",
      rows: 4
    },
    options: [
      { id: "prefix", label: "Prefix to prepend", type: "text", default: "• " },
      { id: "suffix", label: "Suffix to append", type: "text", default: ";" }
    ],
    outputLabel: "Formatted Lines",
    outputExt: "txt",
    run(input, opts) {
      const p = String(opts.prefix ?? "");
      const s = String(opts.suffix ?? "");
      return input.split("\n").map(l => l.trim()).filter(Boolean).map(l => `${p}${l}${s}`).join("\n");
    }
  },

  "line-numbering-formatter": {
    input: {
      label: "Lines to Number",
      placeholder: "First step\nSecond step\nThird step",
      example: "Install dependencies\nConfigure environment\nRun development server",
      rows: 4
    },
    outputLabel: "Numbered Lines",
    outputExt: "txt",
    run(input) {
      return input.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n");
    }
  },

  "text-wrap-column-formatter": {
    input: {
      label: "Long Paragraph Text",
      placeholder: "Paste unwrapped text...",
      example: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      rows: 4
    },
    options: [
      { id: "width", label: "Max Characters per Line", type: "number", default: 40, min: 20, max: 120 }
    ],
    outputLabel: "Hard-Wrapped Text",
    outputExt: "txt",
    run(input, opts) {
      const max = Number(opts.width || 40);
      const words = input.trim().split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > max) {
          lines.push(cur.trim());
          cur = w;
        } else {
          cur += " " + w;
        }
      }
      if (cur) lines.push(cur.trim());
      return lines.join("\n");
    }
  },

  "slugify-string-generator": {
    input: {
      label: "Page Title or Headline",
      placeholder: "My Awesome Blog Post #24!",
      example: "10 Incredible Tips for Modern Web Development!",
      rows: 2
    },
    outputLabel: "Clean Kebab-Case URL Slug",
    outputExt: "txt",
    run(input) {
      return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }
  },

  "camel-to-kebab-snake-case": {
    input: {
      label: "Identifier Name",
      placeholder: "myVariableName",
      example: "userProfileSettingsManager",
      rows: 2
    },
    outputLabel: "Case Conversion Variants",
    outputExt: "txt",
    run(input) {
      const clean = input.trim();
      const kebab = clean.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      const snake = clean.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
      const constant = snake.toUpperCase();
      const pascal = clean.charAt(0).toUpperCase() + clean.slice(1);
      return [
        `kebab-case:    ${kebab}`,
        `snake_case:    ${snake}`,
        `CONSTANT_CASE: ${constant}`,
        `PascalCase:    ${pascal}`
      ].join("\n");
    }
  },

  "base64-utf8-encoder": {
    input: {
      label: "UTF-8 Text (with emojis & unicode)",
      placeholder: "Hello 🌍 World 🚀",
      example: "Hello 🌍 World 🚀 Unicode Test",
      rows: 3
    },
    outputLabel: "Base64 Encoded Output",
    outputExt: "txt",
    run(input) {
      return Buffer.from(input, "utf-8").toString("base64");
    }
  },

  "base64-utf8-decoder": {
    input: {
      label: "Base64 String",
      placeholder: "SGVsbG8g8J+MiyBXb3JsZCA=...",
      example: "SGVsbG8g8J+MiyBXb3JsZCA=",
      rows: 3
    },
    outputLabel: "Decoded UTF-8 Text",
    outputExt: "txt",
    run(input) {
      return Buffer.from(input.trim(), "base64").toString("utf-8");
    }
  },

  "hex-color-extractor-text": {
    input: {
      label: "CSS or Text Containing Hex Codes",
      placeholder: "border: 1px solid #e2e8f0; background: #ffffff; color: #1e293b;",
      example: "color: #3b82f6; background-color: #f8fafc; border: 1px solid #e2e8f0;",
      rows: 4
    },
    outputLabel: "Extracted Hex Color Swatches",
    outputExt: "txt",
    run(input) {
      const matches = Array.from(new Set(input.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g) || []));
      if (matches.length === 0) return "No hex color codes detected.";
      return matches.join("\n");
    }
  },

  "character-frequency-counter": {
    input: {
      label: "String Input",
      placeholder: "Type text to inspect letter counts...",
      example: "Mississippi river",
      rows: 3
    },
    outputLabel: "Character Distribution",
    outputExt: "txt",
    run(input) {
      const counts: Record<string, number> = {};
      for (const char of input) {
        if (char === " " || char === "\n") continue;
        counts[char] = (counts[char] || 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([char, n]) => `'${char}': ${n}`).join("\n");
    }
  }
};
