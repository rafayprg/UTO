// JSON → code: Swift, PHP, Dart, Prisma, GraphQL, SQL, JSON Schema, Mongoose, Protocol Buffers.
import { camel, isObject, pascal, snake, type Json } from "./dev-text-util.ts";
import { objectsDepsFirst, objectsRootFirst, type Field, type ObjectNode, type TypeNode } from "./dev-text-schema.ts";

const isNullable = (t: TypeNode) => t.nullable || t.kind === "null";
const needObjects = (root: TypeNode, what: string): ObjectNode[] => {
  const objects = objectsRootFirst(root);
  if (!objects.length) throw new Error(`Paste a JSON object (or an array of objects) to generate ${what}.`);
  return objects;
};
function dedupe(fields: Field[], name: (key: string) => string, reserved: string[] = []): string[] {
  const seen = new Set(reserved);
  return fields.map(f => {
    let candidate = name(f.key);
    const base = candidate;
    for (let n = 2; seen.has(candidate); n++) candidate = `${base}${n}`;
    seen.add(candidate);
    return candidate;
  });
}
function align(rows: string[][]): string[] {
  const widths = rows[0]?.map((_, col) => Math.max(...rows.map(row => row[col].length))) ?? [];
  return rows.map(row => row.map((cell, col) => (col === row.length - 1 ? cell : cell.padEnd(widths[col]))).join(" ").trimEnd());
}

/* ---------- Swift ---------- */
const SWIFT_KEYWORDS = new Set("associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public rethrows static struct subscript typealias var break case continue default defer do else fallthrough for guard if in repeat return switch where while as Any catch false is nil super self Self throw throws true try".split(" "));
const SWIFT_JSON_VALUE = `enum JSONValue: Codable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}`;
function swiftType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "String", int: "Int", float: "Double", bool: "Bool", null: "JSONValue", any: "JSONValue" };
  const base = t.kind === "array" ? `[${swiftType(t.of)}]` : t.kind === "object" ? t.name : scalars[t.kind];
  return isNullable(t) ? `${base}?` : base;
}

export function toSwift(root: TypeNode): string {
  const objects = needObjects(root, "Swift structs");
  let usesJsonValue = false;
  const structs = objects.map(o => {
    const names = dedupe(o.fields, camel);
    const props = o.fields.map((f, i) => {
      let type = swiftType(f.type);
      if (type.includes("JSONValue")) usesJsonValue = true;
      if (f.optional && !type.endsWith("?")) type += "?";
      const ident = SWIFT_KEYWORDS.has(names[i]) ? `\`${names[i]}\`` : names[i];
      return `    let ${ident}: ${type}`;
    });
    const differs = o.fields.some((f, i) => names[i] !== f.key);
    const keys = differs ? `\n\n    enum CodingKeys: String, CodingKey {\n${o.fields.map((f, i) => {
      const ident = SWIFT_KEYWORDS.has(names[i]) ? `\`${names[i]}\`` : names[i];
      return names[i] === f.key ? `        case ${ident}` : `        case ${ident} = ${JSON.stringify(f.key)}`;
    }).join("\n")}\n    }` : "";
    return `struct ${o.name}: Codable {\n${props.join("\n")}${keys}\n}`;
  });
  return `import Foundation\n\n${structs.join("\n\n")}${usesJsonValue ? `\n\n${SWIFT_JSON_VALUE}` : ""}\n`;
}

/* ---------- PHP 8 ---------- */
function phpType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "string", int: "int", float: "float", bool: "bool", null: "mixed", any: "mixed" };
  const base = t.kind === "array" ? "array" : t.kind === "object" ? t.name : scalars[t.kind];
  return isNullable(t) && base !== "mixed" ? `?${base}` : base;
}
function phpDoc(t: TypeNode): string {
  if (t.kind === "array") return `${phpDoc(t.of)}[]`;
  return phpType(t).replace(/^\?/, "");
}

export function toPhp(root: TypeNode): string {
  const objects = needObjects(root, "PHP classes");
  const classes = objects.map(o => {
    const names = dedupe(o.fields, key => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : camel(key)));
    const props = o.fields.map((f, i) => {
      let type = phpType(f.type);
      if (f.optional && !type.startsWith("?") && type !== "mixed") type = `?${type}`;
      const nullableDefault = type.startsWith("?") || type === "mixed" ? " = null" : "";
      const doc = f.type.kind === "array" ? `    /** @var ${phpDoc(f.type)} */\n` : "";
      const note = names[i] === f.key ? "" : ` // JSON key "${f.key}"`;
      return `${doc}    public ${type} $${names[i]}${nullableDefault};${note}`;
    });
    return `final class ${o.name}\n{\n${props.join("\n")}\n}`;
  });
  return `<?php\n\ndeclare(strict_types=1);\n\n${classes.join("\n\n")}\n`;
}

/* ---------- Dart ---------- */
const DART_RESERVED = new Set("abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for Function get hide if implements import in interface is late library mixin new null on operator part required rethrow return set show static super switch sync this throw true try typedef var void while with yield".split(" "));
function dartType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "String", int: "int", float: "double", bool: "bool", null: "dynamic", any: "dynamic" };
  const base = t.kind === "array" ? `List<${dartType(t.of)}>` : t.kind === "object" ? t.name : scalars[t.kind];
  return isNullable(t) && base !== "dynamic" ? `${base}?` : base;
}
const dartStr = (key: string) => `'${key.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\$/g, "\\$")}'`;

function dartFrom(expr: string, t: TypeNode, nullable: boolean, depth = 0): string {
  const q = nullable ? "?" : "";
  if (t.kind === "any" || t.kind === "null") return expr;
  if (t.kind === "float") return `(${expr} as num${q})${q}.toDouble()`;
  if (t.kind === "object") {
    const call = `${t.name}.fromJson(${expr} as Map<String, dynamic>)`;
    return nullable ? `${expr} == null ? null : ${call}` : call;
  }
  if (t.kind === "array") {
    const e = `e${depth}`;
    return `(${expr} as List<dynamic>${q})${q}.map((${e}) => ${dartFrom(e, t.of, isNullable(t.of), depth + 1)}).toList()`;
  }
  return `${expr} as ${dartType(t).replace(/\?$/, "")}${q}`;
}
function dartTo(expr: string, t: TypeNode, nullable: boolean, depth = 0): string {
  const q = nullable ? "?" : "";
  if (t.kind === "object") return `${expr}${q}.toJson()`;
  if (t.kind === "array" && (t.of.kind === "object" || t.of.kind === "array")) {
    const e = `e${depth}`;
    return `${expr}${q}.map((${e}) => ${dartTo(e, t.of, isNullable(t.of), depth + 1)}).toList()`;
  }
  return expr;
}

export function toDart(root: TypeNode): string {
  const objects = needObjects(root, "Dart classes");
  return objects.map(o => {
    const names = dedupe(o.fields, key => { const n = camel(key); return DART_RESERVED.has(n) ? `${n}Value` : n; });
    const types = o.fields.map(f => { const t = dartType(f.type); return f.optional && !t.endsWith("?") && t !== "dynamic" ? `${t}?` : t; });
    const nullable = types.map(t => t.endsWith("?") || t === "dynamic");
    const fields = o.fields.map((_, i) => `  final ${types[i]} ${names[i]};`).join("\n");
    const ctor = `  const ${o.name}({${o.fields.map((_, i) => `${nullable[i] ? "" : "required "}this.${names[i]}`).join(", ")}});`;
    const from = o.fields.map((f, i) => `        ${names[i]}: ${dartFrom(`json[${dartStr(f.key)}]`, f.type, nullable[i])},`).join("\n");
    const to = o.fields.map((f, i) => `        ${dartStr(f.key)}: ${dartTo(names[i], f.type, nullable[i])},`).join("\n");
    return `class ${o.name} {\n${fields}\n\n${ctor}\n\n  factory ${o.name}.fromJson(Map<String, dynamic> json) => ${o.name}(\n${from}\n      );\n\n  Map<String, dynamic> toJson() => {\n${to}\n      };\n}`;
  }).join("\n\n") + "\n";
}

/* ---------- Prisma ---------- */
function prismaType(t: TypeNode, optional: boolean): string {
  const scalars: Record<string, string> = { string: "String", int: "Int", float: "Float", bool: "Boolean", null: "Json", any: "Json" };
  if (t.kind === "array") {
    const of = t.of;
    if (of.kind === "string" || of.kind === "int" || of.kind === "float" || of.kind === "bool") return `${scalars[of.kind]}[]`;
    return optional || isNullable(t) ? "Json?" : "Json";
  }
  const base = t.kind === "object" ? "Json" : scalars[t.kind];
  return optional || isNullable(t) ? `${base}?` : base;
}

export function toPrisma(root: TypeNode, modelName: string): string {
  if (root.kind !== "object") throw new Error("Paste a JSON object (or an array of objects) to generate a Prisma model.");
  const names = dedupe(root.fields, key => (/^[A-Za-z][A-Za-z0-9_]*$/.test(key) ? key : camel(key)));
  const hasId = root.fields.some(f => f.key === "id" && (f.type.kind === "int" || f.type.kind === "string"));
  const rows = root.fields.map((f, i) => {
    const attrs: string[] = [];
    let type = prismaType(f.type, f.optional);
    if (f.key === "id" && hasId) { type = type.replace("?", ""); attrs.push(f.type.kind === "int" ? "@id @default(autoincrement())" : "@id"); }
    if (names[i] !== f.key) attrs.push(`@map(${JSON.stringify(f.key)})`);
    return [names[i], type, attrs.join(" ")];
  });
  const all = hasId ? rows : [["id", "Int", "@id @default(autoincrement())"], ...rows];
  return `model ${pascal(modelName) || "Root"} {\n${align(all).map(line => `  ${line}`).join("\n")}\n}\n`;
}

/* ---------- GraphQL ---------- */
function gqlType(t: TypeNode, optional: boolean): string {
  const scalars: Record<string, string> = { string: "String", int: "Int", float: "Float", bool: "Boolean", null: "JSON", any: "JSON" };
  const base = t.kind === "array" ? `[${gqlType(t.of, false)}]` : t.kind === "object" ? t.name : scalars[t.kind];
  return optional || isNullable(t) || base === "JSON" ? base : `${base}!`;
}

export function toGraphQL(root: TypeNode): string {
  const objects = needObjects(root, "GraphQL types");
  const types = objects.map(o => {
    const names = dedupe(o.fields, key => (/^[_A-Za-z][_0-9A-Za-z]*$/.test(key) ? key : camel(key)));
    return `type ${o.name} {\n${o.fields.map((f, i) => `  ${names[i]}: ${gqlType(f.type, f.optional)}`).join("\n")}\n}`;
  });
  const text = types.join("\n\n");
  return `${/\bJSON\b/.test(text) ? "scalar JSON\n\n" : ""}${text}\n`;
}

/* ---------- SQL ---------- */
export type Dialect = "postgres" | "mysql" | "sqlite";
export function quoteIdent(name: string, dialect: Dialect): string {
  return dialect === "mysql" ? `\`${name.replace(/`/g, "``")}\`` : `"${name.replace(/"/g, '""')}"`;
}
function sqlType(t: TypeNode, dialect: Dialect): string {
  const table: Record<Dialect, Record<string, string>> = {
    postgres: { string: "TEXT", int: "BIGINT", float: "DOUBLE PRECISION", bool: "BOOLEAN", json: "JSONB" },
    mysql: { string: "TEXT", int: "BIGINT", float: "DOUBLE", bool: "BOOLEAN", json: "JSON" },
    sqlite: { string: "TEXT", int: "INTEGER", float: "REAL", bool: "INTEGER", json: "TEXT" },
  };
  const key = t.kind === "string" || t.kind === "int" || t.kind === "float" || t.kind === "bool" ? t.kind : "json";
  return table[dialect][key];
}

export function toSqlCreate(root: TypeNode, table: string, dialect: Dialect): string {
  if (root.kind !== "object") throw new Error("Paste a JSON object or an array of objects; each top-level key becomes a column.");
  const cols = root.fields.map(f => `  ${quoteIdent(f.key, dialect)} ${sqlType(f.type, dialect)}${f.optional || isNullable(f.type) ? "" : " NOT NULL"}`);
  return `CREATE TABLE ${quoteIdent(table, dialect)} (\n${cols.join(",\n")}\n);\n`;
}

export function sqlLiteral(value: Json | undefined, dialect: Dialect): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return dialect === "sqlite" ? (value ? "1" : "0") : value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const escaped = dialect === "mysql" ? text.replace(/\\/g, "\\\\").replace(/'/g, "''") : text.replace(/'/g, "''");
  return `'${escaped}'`;
}

export function toSqlInsert(value: Json, table: string, dialect: Dialect): string {
  const rows = Array.isArray(value) ? value : [value];
  if (!rows.length || !rows.every(isObject)) throw new Error("Paste a JSON object or an array of objects; each object becomes one row.");
  const objects = rows.filter(isObject);
  const columns = [...new Set(objects.flatMap(row => Object.keys(row)))];
  const values = objects.map(row => `  (${columns.map(col => sqlLiteral(row[col], dialect)).join(", ")})`);
  return `INSERT INTO ${quoteIdent(table, dialect)} (${columns.map(c => quoteIdent(c, dialect)).join(", ")}) VALUES\n${values.join(",\n")};\n`;
}

/* ---------- JSON Schema ---------- */
type SchemaObject = { [key: string]: Json };
function schemaFor(t: TypeNode): SchemaObject {
  const names: Record<string, string> = { string: "string", int: "integer", float: "number", bool: "boolean", null: "null" };
  if (t.kind === "any") return {};
  let schema: SchemaObject;
  if (t.kind === "array") schema = { type: "array", items: schemaFor(t.of) };
  else if (t.kind === "object") {
    const required = t.fields.filter(f => !f.optional).map(f => f.key);
    schema = { type: "object", properties: Object.fromEntries(t.fields.map(f => [f.key, schemaFor(f.type)])), ...(required.length ? { required } : {}) };
  } else schema = { type: names[t.kind] };
  if (t.nullable && t.kind !== "null" && typeof schema.type === "string") return { ...schema, type: [schema.type, "null"] };
  return schema;
}

export function toJsonSchema(root: TypeNode, topIsArray: boolean, title: string): string {
  const body = topIsArray && root.kind === "object" ? { type: "array", items: schemaFor(root) } : schemaFor(root);
  return JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", title, ...body }, null, 2) + "\n";
}

/* ---------- Mongoose ---------- */
const jsKey = (key: string) => (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key));
function mongooseType(t: TypeNode): string {
  const scalars: Record<string, string> = { string: "String", int: "Number", float: "Number", bool: "Boolean", null: "Schema.Types.Mixed", any: "Schema.Types.Mixed" };
  if (t.kind === "array") return `[${mongooseType(t.of)}]`;
  if (t.kind === "object") return `${camel(t.name)}Schema`;
  return scalars[t.kind];
}

export function toMongoose(root: TypeNode, modelName: string): string {
  if (root.kind !== "object") throw new Error("Paste a JSON object (or an array of objects) to generate a Mongoose schema.");
  const objects = objectsDepsFirst(root);
  const blocks = objects.map(o => {
    const lines = o.fields.map(f => {
      const type = mongooseType(f.type);
      const required = !f.optional && !isNullable(f.type) && f.type.kind !== "array" && f.type.kind !== "any";
      return `  ${jsKey(f.key)}: ${required ? `{ type: ${type}, required: true }` : `{ type: ${type} }`},`;
    });
    const opts = o === root ? "{ timestamps: false }" : "{ _id: false }";
    return `const ${camel(o.name)}Schema = new Schema({\n${lines.join("\n")}\n}, ${opts});`;
  });
  const model = pascal(modelName) || root.name;
  return `import { Schema, model } from "mongoose";\n\n${blocks.join("\n\n")}\n\nexport const ${model} = model(${JSON.stringify(model)}, ${camel(root.name)}Schema);\n`;
}

/* ---------- Protocol Buffers (proto3) ---------- */
function protoType(t: TypeNode): { type: string; repeated: boolean } {
  const scalars: Record<string, string> = { string: "string", int: "int64", float: "double", bool: "bool", null: "google.protobuf.Value", any: "google.protobuf.Value" };
  if (t.kind === "array") {
    if (t.of.kind === "array") return { type: "google.protobuf.ListValue", repeated: true };
    return { type: protoType(t.of).type, repeated: true };
  }
  return { type: t.kind === "object" ? t.name : scalars[t.kind], repeated: false };
}
const lowerCamelOfSnake = (name: string) => name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function toProtobuf(root: TypeNode, pkg: string): string {
  const objects = needObjects(root, "Protocol Buffers messages");
  let wellKnown = false;
  const messages = objects.map(o => {
    const names = dedupe(o.fields, snake);
    const lines = o.fields.map((f, i) => {
      const { type, repeated } = protoType(f.type);
      if (type.startsWith("google.protobuf")) wellKnown = true;
      const scalarField = !repeated && f.type.kind !== "object" && !type.startsWith("google.");
      const label = repeated ? "repeated " : scalarField && (f.optional || isNullable(f.type)) ? "optional " : "";
      const jsonName = lowerCamelOfSnake(names[i]) === f.key ? "" : ` [json_name = ${JSON.stringify(f.key)}]`;
      return `  ${label}${type} ${names[i]} = ${i + 1}${jsonName};`;
    });
    return `message ${o.name} {\n${lines.join("\n")}\n}`;
  });
  const imports = wellKnown ? 'import "google/protobuf/struct.proto";\n\n' : "";
  return `syntax = "proto3";\n\npackage ${pkg};\n\n${imports}${messages.join("\n\n")}\n`;
}
