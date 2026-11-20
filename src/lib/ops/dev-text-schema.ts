// Infers a type tree from sample JSON. Every code generator (TypeScript, Go, Rust…) reads this tree.
// Rules: arrays merge the shapes of all their items; a key missing from some objects becomes optional;
// a null value makes the field nullable; int + float merge to float; any other mix becomes "any".
import { isObject, pascal, singular, type Json } from "./dev-text-util.ts";

export type Scalar = "string" | "int" | "float" | "bool" | "null" | "any";
export type TypeNode =
  | { kind: Scalar; nullable: boolean }
  | { kind: "array"; of: TypeNode; nullable: boolean }
  | { kind: "object"; name: string; fields: Field[]; nullable: boolean };
export interface Field { key: string; type: TypeNode; optional: boolean }
export type ObjectNode = Extract<TypeNode, { kind: "object" }>;

const scalar = (kind: Scalar, nullable = false): TypeNode => ({ kind, nullable });

function inferValue(value: Json, name: string): TypeNode {
  if (value === null) return scalar("null", true);
  if (typeof value === "boolean") return scalar("bool");
  if (typeof value === "number") return scalar(Number.isInteger(value) ? "int" : "float");
  if (typeof value === "string") return scalar("string");
  if (Array.isArray(value)) {
    const itemName = singular(name) === name ? `${name}Item` : singular(name);
    const items = value.map(item => inferValue(item, itemName));
    const of = items.length ? items.reduce((a, b) => merge(a, b)) : scalar("any");
    return { kind: "array", of, nullable: false };
  }
  const fields = Object.entries(value).map(([key, child]) => ({ key, type: inferValue(child, pascal(key)), optional: false }));
  return { kind: "object", name, fields, nullable: false };
}

function mergeFields(a: Field[], b: Field[]): Field[] {
  const keys = [...a.map(f => f.key), ...b.map(f => f.key).filter(key => !a.some(f => f.key === key))];
  return keys.map(key => {
    const left = a.find(f => f.key === key);
    const right = b.find(f => f.key === key);
    if (left && right) return { key, type: merge(left.type, right.type), optional: left.optional || right.optional };
    const only = (left ?? right) as Field;
    return { ...only, optional: true };
  });
}

export function merge(a: TypeNode, b: TypeNode): TypeNode {
  const nullable = a.nullable || b.nullable;
  if (a.kind === "null") return { ...b, nullable: true };
  if (b.kind === "null") return { ...a, nullable: true };
  if (a.kind === "array" && b.kind === "array") {
    const of = a.of.kind === "any" && !a.of.nullable ? b.of : b.of.kind === "any" && !b.of.nullable ? a.of : merge(a.of, b.of);
    return { kind: "array", of, nullable };
  }
  if (a.kind === "object" && b.kind === "object") return { kind: "object", name: a.name, fields: mergeFields(a.fields, b.fields), nullable };
  if (a.kind === b.kind) return { ...a, nullable };
  if ((a.kind === "int" && b.kind === "float") || (a.kind === "float" && b.kind === "int")) return scalar("float", nullable);
  return scalar("any", nullable);
}

/** Renames nested object types so every name is unique, and returns the root node. */
function uniqueNames(root: TypeNode): TypeNode {
  const used = new Map<string, number>();
  const rename = (node: TypeNode): TypeNode => {
    if (node.kind === "array") return { ...node, of: rename(node.of) };
    if (node.kind !== "object") return node;
    const base = pascal(node.name);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    const name = count === 1 ? base : `${base}${count}`;
    return { ...node, name, fields: node.fields.map(field => ({ ...field, type: rename(field.type) })) };
  };
  return rename(root);
}

/** Infers the type tree. A top-level array of objects is described by its item type. */
export function inferSchema(value: Json, rootName: string): { root: TypeNode; topIsArray: boolean } {
  const name = pascal(rootName) || "Root";
  if (Array.isArray(value)) {
    const tree = inferValue(value, name);
    if (tree.kind === "array" && tree.of.kind === "object") return { root: uniqueNames({ ...tree.of, name }), topIsArray: true };
    return { root: uniqueNames(tree), topIsArray: true };
  }
  return { root: uniqueNames(inferValue(value, name)), topIsArray: false };
}

/** All object types, dependencies first (nested types before the types that use them). */
export function objectsDepsFirst(root: TypeNode): ObjectNode[] {
  const out: ObjectNode[] = [];
  const visit = (node: TypeNode) => {
    if (node.kind === "array") visit(node.of);
    if (node.kind !== "object") return;
    node.fields.forEach(field => visit(field.type));
    if (!out.some(existing => existing.name === node.name)) out.push(node);
  };
  visit(root);
  return out;
}

/** Root first, then nested types – the usual reading order for declarations. */
export function objectsRootFirst(root: TypeNode): ObjectNode[] {
  return objectsDepsFirst(root).reverse();
}

export function requireObjectRoot(root: TypeNode, language: string): ObjectNode {
  if (root.kind !== "object") throw new Error(`Paste a JSON object (or an array of objects) to generate ${language} types.`);
  return root;
}

export function rootValue(input: Json): Json {
  if (!isObject(input) && !Array.isArray(input)) throw new Error("Paste a JSON object or an array of objects, not a single value.");
  return input;
}
