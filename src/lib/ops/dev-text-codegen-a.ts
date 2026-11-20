// JSON → code: TypeScript, Zod, Yup, JSDoc, Go, Rust, Python (dataclass + Pydantic), Java, C#, Kotlin.
import { camel, pascal, snake } from "./dev-text-util.ts";
import { objectsDepsFirst, objectsRootFirst, type Field, type ObjectNode, type TypeNode } from "./dev-text-schema.ts";

const JS_IDENT = /^[A-Za-z_$][\w$]*$/;
const jsKey = (key: string) => (JS_IDENT.test(key) ? key : JSON.stringify(key));
const isNullable = (t: TypeNode) => t.nullable || t.kind === "null";

/* ---------- TypeScript ---------- */
function tsType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "string", int: "number", float: "number", bool: "boolean", null: "null", any: "unknown" };
  let base: string;
  if (t.kind === "array") { const inner = tsType(t.of); base = /[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`; }
  else if (t.kind === "object") base = t.name;
  else base = scalars[t.kind];
  return t.nullable && t.kind !== "null" && t.kind !== "any" ? `${base} | null` : base;
}

export function toTypeScript(root: TypeNode, style: string, exported: boolean): string {
  const prefix = exported ? "export " : "";
  const objects = objectsRootFirst(root);
  if (!objects.length) return `${prefix}type Root = ${tsType(root)};\n`;
  return objects.map(o => {
    const body = o.fields.map(f => `  ${jsKey(f.key)}${f.optional ? "?" : ""}: ${tsType(f.type)};`).join("\n");
    return style === "type" ? `${prefix}type ${o.name} = {\n${body}\n};` : `${prefix}interface ${o.name} {\n${body}\n}`;
  }).join("\n\n") + "\n";
}

/* ---------- Zod ---------- */
function zodType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "z.string()", int: "z.number().int()", float: "z.number()", bool: "z.boolean()", null: "z.null()", any: "z.unknown()" };
  let base: string;
  if (t.kind === "array") base = `z.array(${zodType(t.of)})`;
  else if (t.kind === "object") base = `${t.name}Schema`;
  else base = scalars[t.kind];
  return t.nullable && t.kind !== "null" && t.kind !== "any" ? `${base}.nullable()` : base;
}

export function toZod(root: TypeNode): string {
  const objects = objectsDepsFirst(root);
  const head = 'import { z } from "zod";\n\n';
  if (!objects.length) return `${head}export const RootSchema = ${zodType(root)};\n`;
  return head + objects.map(o => {
    const body = o.fields.map(f => `  ${jsKey(f.key)}: ${zodType(f.type)}${f.optional ? ".optional()" : ""},`).join("\n");
    return `export const ${o.name}Schema = z.object({\n${body}\n});\nexport type ${o.name} = z.infer<typeof ${o.name}Schema>;`;
  }).join("\n\n") + "\n";
}

/* ---------- Yup ---------- */
function yupType(t: TypeNode, optional: boolean): string {
  const scalars: Record<string, string> = { string: "yup.string()", int: "yup.number().integer()", float: "yup.number()", bool: "yup.boolean()", null: "yup.mixed()", any: "yup.mixed()" };
  let base: string;
  if (t.kind === "array") base = `yup.array().of(${yupType(t.of, false)})`;
  else if (t.kind === "object") base = `${camel(t.name)}Schema`;
  else base = scalars[t.kind];
  const nullable = isNullable(t) ? ".nullable()" : "";
  return `${base}${nullable}${optional || t.kind === "any" ? "" : ".defined()"}`;
}

export function toYup(root: TypeNode): string {
  const objects = objectsDepsFirst(root);
  const head = 'import * as yup from "yup";\n\n';
  if (!objects.length) return `${head}export const rootSchema = ${yupType(root, false)};\n`;
  return head + objects.map(o => {
    const body = o.fields.map(f => `  ${jsKey(f.key)}: ${yupType(f.type, f.optional)},`).join("\n");
    return `export const ${camel(o.name)}Schema = yup.object({\n${body}\n});`;
  }).join("\n\n") + "\n";
}

/* ---------- JSDoc ---------- */
function jsdocType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "string", int: "number", float: "number", bool: "boolean", null: "null", any: "*" };
  let base: string;
  if (t.kind === "array") base = `Array<${jsdocType(t.of)}>`;
  else if (t.kind === "object") base = t.name;
  else base = scalars[t.kind];
  return t.nullable && t.kind !== "null" && t.kind !== "any" ? `(${base}|null)` : base;
}

export function toJsDoc(root: TypeNode): string {
  const objects = objectsRootFirst(root);
  if (!objects.length) return `/** @typedef {${jsdocType(root)}} Root */\n`;
  return objects.map(o => {
    const props = o.fields.map(f => {
      const name = JS_IDENT.test(f.key) ? f.key : camel(f.key);
      const note = name === f.key ? "" : ` - JSON key "${f.key}"`;
      return ` * @property {${jsdocType(f.type)}} ${f.optional ? `[${name}]` : name}${note}`;
    });
    return ["/**", ` * @typedef {Object} ${o.name}`, ...props, " */"].join("\n");
  }).join("\n\n") + "\n";
}

/* ---------- Go ---------- */
const GO_INITIALISMS = ["Id", "Url", "Uri", "Api", "Http", "Https", "Json", "Xml", "Html", "Ip", "Sql", "Uuid", "Css"];
function goName(key: string): string {
  const name = pascal(key);
  return name.replace(/[A-Z][a-z]*/g, part => (GO_INITIALISMS.includes(part) ? part.toUpperCase() : part));
}

function goType(t: TypeNode, optional: boolean): string {
  const scalars: Record<string, string> = { string: "string", int: "int64", float: "float64", bool: "bool", null: "any", any: "any" };
  if (t.kind === "array") return `[]${goType(t.of, false)}`;
  const base = t.kind === "object" ? t.name : scalars[t.kind];
  const pointer = (t.nullable || optional) && t.kind !== "any" && t.kind !== "null";
  return pointer ? `*${base}` : base;
}

function uniqueNamesFor(fields: Field[], name: (key: string) => string, reserved: string[] = []): string[] {
  const seen = new Set(reserved);
  return fields.map(f => {
    const base = name(f.key);
    let candidate = base;
    for (let n = 2; seen.has(candidate); n++) candidate = `${base}${n}`;
    seen.add(candidate);
    return candidate;
  });
}

function alignColumns(rows: string[][]): string[] {
  const widths = rows[0]?.map((_, col) => Math.max(...rows.map(row => row[col].length))) ?? [];
  return rows.map(row => row.map((cell, col) => (col === row.length - 1 ? cell : cell.padEnd(widths[col]))).join(" ").trimEnd());
}

export function toGo(root: TypeNode, pkg: string): string {
  const objects = objectsRootFirst(root);
  const head = `package ${pkg}\n\n`;
  if (!objects.length) return `${head}type Root ${goType(root, false)}\n`;
  return head + objects.map(o => {
    const names = uniqueNamesFor(o.fields, goName);
    const rows = o.fields.map((f, i) => [names[i], goType(f.type, f.optional), `\`json:"${f.key}${f.optional ? ",omitempty" : ""}"\``]);
    const body = alignColumns(rows).map(line => `\t${line}`).join("\n");
    return `type ${o.name} struct {\n${body}\n}`;
  }).join("\n\n") + "\n";
}

/* ---------- Rust ---------- */
const RUST_KEYWORDS = new Set("as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return static struct super trait true type unsafe use where while async await dyn abstract become box do final macro override priv typeof unsized virtual yield try".split(" "));
function rustType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "String", int: "i64", float: "f64", bool: "bool", null: "serde_json::Value", any: "serde_json::Value" };
  const base = t.kind === "array" ? `Vec<${rustType(t.of)}>` : t.kind === "object" ? t.name : scalars[t.kind];
  return t.nullable && t.kind !== "null" && t.kind !== "any" ? `Option<${base}>` : base;
}

export function toRust(root: TypeNode): string {
  const objects = objectsRootFirst(root);
  const head = "use serde::{Deserialize, Serialize};\n\n";
  if (!objects.length) return `${head}pub type Root = ${rustType(root)};\n`;
  return head + objects.map(o => {
    const names = uniqueNamesFor(o.fields, snake);
    const lines = o.fields.flatMap((f, i) => {
      const ident = RUST_KEYWORDS.has(names[i]) ? `r#${names[i]}` : names[i];
      let type = rustType(f.type);
      if (f.optional && !type.startsWith("Option<")) type = `Option<${type}>`;
      const rename = names[i] === f.key ? [] : [`    #[serde(rename = ${JSON.stringify(f.key)})]`];
      return [...rename, `    pub ${ident}: ${type},`];
    });
    return `#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct ${o.name} {\n${lines.join("\n")}\n}`;
  }).join("\n\n") + "\n";
}

/* ---------- Python ---------- */
const PY_KEYWORDS = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
function pyType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "str", int: "int", float: "float", bool: "bool", null: "Any", any: "Any" };
  const base = t.kind === "array" ? `List[${pyType(t.of)}]` : t.kind === "object" ? t.name : scalars[t.kind];
  return t.nullable && t.kind !== "null" && t.kind !== "any" ? `Optional[${base}]` : base;
}
const pyIdent = (key: string) => {
  const name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : snake(key);
  return PY_KEYWORDS.has(name) ? `${name}_` : name;
};

export function toDataclass(root: TypeNode): string {
  const objects = objectsDepsFirst(root);
  const head = "from __future__ import annotations\n\nfrom dataclasses import dataclass\nfrom typing import Any, List, Optional\n\n";
  if (!objects.length) return `${head}Root = ${pyType(root)}\n`;
  return head + objects.map(o => {
    const names = uniqueNamesFor(o.fields, pyIdent);
    const rows = o.fields.map((f, i) => {
      const optional = f.optional || isNullable(f.type);
      let type = pyType(f.type);
      if (f.optional && !type.startsWith("Optional[") && type !== "Any") type = `Optional[${type}]`;
      const note = names[i] === f.key ? "" : `  # JSON key "${f.key}"`;
      return { optional, line: `    ${names[i]}: ${type}${optional ? " = None" : ""}${note}` };
    });
    const ordered = [...rows.filter(r => !r.optional), ...rows.filter(r => r.optional)].map(r => r.line);
    return `\n@dataclass\nclass ${o.name}:\n${ordered.join("\n") || "    pass"}`;
  }).join("\n\n") + "\n";
}

export function toPydantic(root: TypeNode): string {
  const objects = objectsDepsFirst(root);
  const head = "from __future__ import annotations\n\nfrom typing import Any, List, Optional\n\nfrom pydantic import BaseModel, Field\n\n";
  if (!objects.length) return `${head}Root = ${pyType(root)}\n`;
  return head + objects.map(o => {
    const names = uniqueNamesFor(o.fields, pyIdent, ["model_config"]);
    const lines = o.fields.map((f, i) => {
      const optional = f.optional || isNullable(f.type);
      let type = pyType(f.type);
      if (f.optional && !type.startsWith("Optional[") && type !== "Any") type = `Optional[${type}]`;
      const alias = names[i] === f.key ? "" : `alias=${JSON.stringify(f.key)}`;
      if (alias) return `    ${names[i]}: ${type} = Field(${optional ? "default=None, " : ""}${alias})`;
      return `    ${names[i]}: ${type}${optional ? " = None" : ""}`;
    });
    return `\nclass ${o.name}(BaseModel):\n${lines.join("\n") || "    pass"}`;
  }).join("\n\n") + "\n";
}

/* ---------- Java records ---------- */
const JAVA_KEYWORDS = new Set("abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while record var yield".split(" "));
function javaType(t: TypeNode, boxed: boolean): string {
  const prim: Record<string, [string, string]> = { string: ["String", "String"], int: ["long", "Long"], float: ["double", "Double"], bool: ["boolean", "Boolean"], null: ["Object", "Object"], any: ["Object", "Object"] };
  if (t.kind === "array") return `List<${javaType(t.of, true)}>`;
  if (t.kind === "object") return t.name;
  return prim[t.kind][boxed || t.nullable ? 1 : 0];
}

export function toJava(root: TypeNode): string {
  const objects = objectsRootFirst(root);
  if (!objects.length) throw new Error("Paste a JSON object (or an array of objects) to generate Java records.");
  return objects.map(o => {
    const names = uniqueNamesFor(o.fields, key => { const n = camel(key); return JAVA_KEYWORDS.has(n) ? `${n}Value` : n; });
    const params = o.fields.map((f, i) => {
      const annotation = names[i] === f.key ? "" : `@JsonProperty(${JSON.stringify(f.key)}) `;
      return `    ${annotation}${javaType(f.type, f.optional)} ${names[i]}`;
    });
    const imports = [
      ...(o.fields.some((f, i) => names[i] !== f.key) ? ["import com.fasterxml.jackson.annotation.JsonProperty;"] : []),
      ...(o.fields.some(f => f.type.kind === "array") ? ["import java.util.List;"] : []),
    ];
    const head = `// ${o.name}.java\n${imports.length ? imports.join("\n") + "\n\n" : ""}`;
    return `${head}public record ${o.name}(\n${params.join(",\n")}\n) {}`;
  }).join("\n\n") + "\n";
}

/* ---------- C# ---------- */
function csType(t: TypeNode, optional: boolean): string {
  const scalars: Record<string, string> = { string: "string", int: "long", float: "double", bool: "bool", null: "object", any: "object" };
  const base = t.kind === "array" ? `List<${csType(t.of, false)}>` : t.kind === "object" ? t.name : scalars[t.kind];
  return isNullable(t) || optional || t.kind === "any" ? `${base}?` : base;
}
function csDefault(type: string, t: TypeNode): string {
  if (type.endsWith("?")) return "";
  if (t.kind === "string") return " = string.Empty;";
  if (t.kind === "array" || t.kind === "object") return " = new();";
  return "";
}

export function toCSharp(root: TypeNode, namespace: string): string {
  const objects = objectsRootFirst(root);
  if (!objects.length) throw new Error("Paste a JSON object (or an array of objects) to generate C# classes.");
  const classes = objects.map(o => {
    const names = uniqueNamesFor(o.fields, pascal, [o.name]);
    const props = o.fields.map((f, i) => {
      const type = csType(f.type, f.optional);
      return `    [JsonPropertyName(${JSON.stringify(f.key)})]\n    public ${type} ${names[i]} { get; set; }${csDefault(type, f.type)}`;
    });
    return `public class ${o.name}\n{\n${props.join("\n\n")}\n}`;
  });
  return `#nullable enable\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\nnamespace ${namespace};\n\n${classes.join("\n\n")}\n`;
}

/* ---------- Kotlin ---------- */
const KOTLIN_KEYWORDS = new Set("as break class continue do else false for fun if in interface is null object package return super this throw true try typealias typeof val var when while".split(" "));
function ktType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "String", int: "Long", float: "Double", bool: "Boolean", null: "JsonElement", any: "JsonElement" };
  const base = t.kind === "array" ? `List<${ktType(t.of)}>` : t.kind === "object" ? t.name : scalars[t.kind];
  return isNullable(t) ? `${base}?` : base;
}

export function toKotlin(root: TypeNode): string {
  const objects = objectsRootFirst(root);
  if (!objects.length) throw new Error("Paste a JSON object (or an array of objects) to generate Kotlin data classes.");
  const usesJson = objects.some(o => o.fields.some(f => /JsonElement/.test(ktType(f.type))));
  const imports = ["import kotlinx.serialization.SerialName", "import kotlinx.serialization.Serializable", ...(usesJson ? ["import kotlinx.serialization.json.JsonElement"] : [])];
  const classes = objects.map((o: ObjectNode) => {
    const names = uniqueNamesFor(o.fields, camel);
    const params = o.fields.map((f, i) => {
      let type = ktType(f.type);
      if (f.optional && !type.endsWith("?")) type += "?";
      const ident = KOTLIN_KEYWORDS.has(names[i]) ? `\`${names[i]}\`` : names[i];
      const serial = names[i] === f.key ? "" : `    @SerialName(${JSON.stringify(f.key)})\n`;
      return `${serial}    val ${ident}: ${type}${type.endsWith("?") ? " = null" : ""},`;
    });
    return `@Serializable\ndata class ${o.name}(\n${params.join("\n")}\n)`;
  });
  return `${imports.join("\n")}\n\n${classes.join("\n\n")}\n`;
}
