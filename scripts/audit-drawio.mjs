#!/usr/bin/env node

import fs from "node:fs";
import { DOMParser } from "@xmldom/xmldom";

function usage() {
  console.error("Usage: node scripts/audit-drawio.mjs --type <tfd|dfd> --profile academic <file.drawio>");
  process.exit(2);
}

const args = process.argv.slice(2);
const typeIndex = args.indexOf("--type");
if (typeIndex === -1 || !args[typeIndex + 1]) usage();
const diagramType = args[typeIndex + 1].toLowerCase();
const profileIndex = args.indexOf("--profile");
const profile = profileIndex === -1 ? "academic" : args[profileIndex + 1];
const excluded = new Set([typeIndex, typeIndex + 1]);
if (profileIndex !== -1) {
  excluded.add(profileIndex);
  excluded.add(profileIndex + 1);
}
const file = args.find((arg, index) => !excluded.has(index));
if (!file || !["tfd", "dfd"].includes(diagramType) || profile !== "academic") usage();

const errors = [];
const warnings = [];
let xml;

try {
  xml = fs.readFileSync(file, "utf8");
} catch (error) {
  console.log(JSON.stringify({ file, type: diagramType, profile, errors: ["Unable to read file."], warnings }, null, 2));
  process.exit(1);
}

try {
  new DOMParser({
    onError(level, message) {
      if (level === "error" || level === "fatalError") throw new Error(message);
    }
  }).parseFromString(xml, "application/xml");
} catch (error) {
  errors.push(`XML parse error: ${error.message}`);
}

if (!/<mxGraphModel\b/.test(xml) || !/<root\b/.test(xml)) {
  errors.push("Missing uncompressed mxGraphModel/root structure. The academic validator does not decode compressed draw.io payloads.");
}

function decode(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&#xa;|&#10;/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function attributes(source) {
  const result = {};
  const pattern = /([:\w.-]+)\s*=\s*(["'])(.*?)\2/gs;
  for (const match of source.matchAll(pattern)) result[match[1]] = match[3];
  return result;
}

const cells = new Map();
for (const match of xml.matchAll(/<mxCell\b([^>]*)>/gs)) {
  const attrs = attributes(match[1]);
  if (!attrs.id) {
    errors.push("mxCell without id.");
    continue;
  }
  if (cells.has(attrs.id)) errors.push(`Duplicate mxCell id: ${attrs.id}`);
  cells.set(attrs.id, attrs);
}

for (const cell of cells.values()) {
  if (cell.parent && !["0", "1"].includes(cell.parent) && !cells.has(cell.parent)) {
    errors.push(`Missing parent ${cell.parent} referenced by ${cell.id}`);
  }
}

const children = new Map();
for (const cell of cells.values()) {
  if (!cell.parent) continue;
  if (!children.has(cell.parent)) children.set(cell.parent, []);
  children.get(cell.parent).push(cell);
}

function styleHas(style = "", key) {
  return new RegExp(`(?:^|;)${key}(?:=|;)`).test(style);
}

function kind(cell) {
  const style = cell.style || "";
  const childValues = (children.get(cell.id) || []).map((child) => decode(child.value));
  if (cell.misType) return cell.misType;
  if (/shape=ellipse/.test(style)) return "external";
  if (/shape=partialRectangle/.test(style)) return "store";
  if (/shape=document/.test(style)) return "document";
  if (/shape=mxgraph\.flowchart\.stored_data/.test(style)) return "archive";
  if (childValues.some((value) => /^P\d+(?:\.\d+)*$/.test(value))) return "process";
  if (diagramType === "tfd" && /shape=rectangle/.test(style) && decode(cell.value)) return "process";
  return "other";
}

function internalCell(cell) {
  const style = cell.style || "";
  return cell.parent && !["0", "1"].includes(cell.parent) &&
    (styleHas(style, "text") || /strokeWidth=0/.test(style));
}

const edges = [...cells.values()].filter((cell) => cell.edge === "1");
const degree = new Map();
for (const edge of edges) {
  if (!edge.source || !edge.target) {
    errors.push(`Edge ${edge.id} must have source and target.`);
    continue;
  }
  const source = cells.get(edge.source);
  const target = cells.get(edge.target);
  if (!source) errors.push(`Edge ${edge.id} references missing source ${edge.source}.`);
  if (!target) errors.push(`Edge ${edge.id} references missing target ${edge.target}.`);
  if (!source || !target) continue;
  if (internalCell(source) || internalCell(target)) {
    errors.push(`Edge ${edge.id} connects an internal text/divider cell.`);
  }
  const style = edge.style || "";
  for (const anchor of ["exitX", "exitY", "entryX", "entryY"]) {
    if (!new RegExp(`(?:^|;)${anchor}=`).test(style)) {
      errors.push(`Edge ${edge.id} is missing ${anchor}.`);
    }
  }
  degree.set(source.id, { ...(degree.get(source.id) || {}), out: (degree.get(source.id)?.out || 0) + 1 });
  degree.set(target.id, { ...(degree.get(target.id) || {}), in: (degree.get(target.id)?.in || 0) + 1 });

  const sourceKind = kind(source);
  const targetKind = kind(target);
  if (diagramType === "dfd") {
    if (sourceKind === "other" || targetKind === "other") {
      errors.push(`DFD edge ${edge.id} has an unclassified endpoint; use the academic profile or add misType metadata.`);
    }
    if (!decode(edge.value)) errors.push(`DFD edge ${edge.id} has no data-flow name.`);
    const validProcessEndpoint = sourceKind === "process" || targetKind === "process";
    if (!validProcessEndpoint) {
      errors.push(`DFD edge ${edge.id} must connect to at least one process (${sourceKind} -> ${targetKind}).`);
    }
  } else if (decode(edge.value)) {
    errors.push(`TFD edge ${edge.id} must not have a label in the selected profile.`);
  }
}

const processCells = [...cells.values()].filter((cell) => kind(cell) === "process");
for (const process of processCells) {
  const counts = degree.get(process.id) || {};
  if (!counts.in) errors.push(`Process ${process.id} has no input.`);
  if (!counts.out) errors.push(`Process ${process.id} has no output.`);
}

if (diagramType === "dfd") {
  const stores = [...cells.values()].filter((cell) => kind(cell) === "store");
  const logicalStores = new Map();
  for (const store of stores) {
    const labels = (children.get(store.id) || []).map((child) => decode(child.value)).filter(Boolean);
    const logicalId = labels.find((label) => /^F\d+$/.test(label)) || store.id;
    const counts = degree.get(store.id) || {};
    const aggregate = logicalStores.get(logicalId) || { in: 0, out: 0 };
    aggregate.in += counts.in || 0;
    aggregate.out += counts.out || 0;
    logicalStores.set(logicalId, aggregate);
  }
  for (const [logicalId, counts] of logicalStores) {
    if (!counts.in || !counts.out) warnings.push(`Logical store ${logicalId} is not both read and written in this diagram.`);
  }
}

for (const cell of cells.values()) {
  const semanticKind = kind(cell);
  const style = cell.style || "";
  if (semanticKind === "external" && !/shape=ellipse/.test(style)) errors.push(`Academic external entity ${cell.id} must use shape=ellipse.`);
  if (semanticKind === "store" && !/shape=partialRectangle/.test(style)) errors.push(`Academic data store ${cell.id} must use shape=partialRectangle.`);
  if (diagramType === "dfd" && semanticKind === "process") {
    const childCells = children.get(cell.id) || [];
    const childValues = childCells.map((child) => decode(child.value));
    const hasCode = childValues.some((value) => /^P\d+(?:\.\d+)*$/.test(value));
    const hasName = childValues.some((value) => value && !/^P\d+(?:\.\d+)*$/.test(value));
    const hasDivider = childCells.some((child) => /strokeWidth=0/.test(child.style || ""));
    if (!/shape=rectangle/.test(style) || !hasCode || !hasName || !hasDivider) {
      errors.push(`Academic DFD process ${cell.id} must be a divided rectangle with code, name, and divider children.`);
    }
  }
}

if (!edges.length) errors.push("Diagram contains no edges.");

const result = {
  file,
  type: diagramType,
  profile,
  counts: { cells: cells.size, edges: edges.length, processes: processCells.length },
  errors,
  warnings,
  note: "Structural checks do not prove semantic correctness or visual readability."
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
