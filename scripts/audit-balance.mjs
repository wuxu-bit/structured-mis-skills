#!/usr/bin/env node

import fs from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/audit-balance.mjs <analysis-model.json>");
  process.exit(2);
}

let model;
try {
  model = JSON.parse(fs.readFileSync(input, "utf8"));
} catch (error) {
  const message = error instanceof SyntaxError ? "Invalid JSON." : "Unable to read file.";
  console.log(JSON.stringify({ file: input, errors: [message] }, null, 2));
  process.exit(1);
}

const errors = [];
const results = [];
const diagrams = new Map((model.diagrams || []).filter((diagram) => diagram.type === "dfd").map((diagram) => [diagram.id, diagram]));
const refinements = new Map();
for (const mapping of model.mappings?.dataFlowRefinements || []) {
  for (const childId of mapping.childFlowIds || []) refinements.set(childId, mapping.parentFlowId);
}

function canonical(boundary, child = false) {
  const flowId = child ? (refinements.get(boundary.flowId) || boundary.flowId) : boundary.flowId;
  return `${flowId}|${boundary.endpointId}|${boundary.direction}`;
}

for (const child of diagrams.values()) {
  if (!child.parentDiagramId) continue;
  const parent = diagrams.get(child.parentDiagramId);
  if (!parent) {
    errors.push(`Child diagram ${child.id} references missing parent diagram ${child.parentDiagramId}.`);
    continue;
  }
  if (!child.parentProcessId || !(parent.processIds || []).includes(child.parentProcessId)) {
    errors.push(`Child diagram ${child.id} does not expand a process present in ${parent.id}.`);
  }
  const parentProcessBoundary = (parent.processBoundaries || []).find((entry) => entry.processId === child.parentProcessId);
  if (!parentProcessBoundary) {
    errors.push(`Parent diagram ${parent.id} has no boundary definition for process ${child.parentProcessId}.`);
    continue;
  }
  const parentSet = new Set((parentProcessBoundary.boundaryFlows || []).map((boundary) => canonical(boundary)));
  const childSet = new Set((child.boundaryFlows || []).map((boundary) => canonical(boundary, true)));
  const missing = [...parentSet].filter((key) => !childSet.has(key));
  const added = [...childSet].filter((key) => !parentSet.has(key));
  const reversed = [];
  for (const key of missing) {
    const [flowId, endpointId, direction] = key.split("|");
    const opposite = `${flowId}|${endpointId}|${direction === "input" ? "output" : "input"}`;
    if (childSet.has(opposite)) reversed.push(key);
  }
  for (const key of reversed) {
    missing.splice(missing.indexOf(key), 1);
    const [flowId, endpointId, direction] = key.split("|");
    added.splice(added.indexOf(`${flowId}|${endpointId}|${direction === "input" ? "output" : "input"}`), 1);
  }
  if (missing.length) errors.push(`${child.id} is missing parent boundary flows: ${missing.join(", ")}`);
  if (added.length) errors.push(`${child.id} adds unexplained boundary flows: ${added.join(", ")}`);
  if (reversed.length) errors.push(`${child.id} reverses boundary flows: ${reversed.join(", ")}`);
  results.push({ parent: parent.id, child: child.id, missing, added, reversed, passed: !missing.length && !added.length && !reversed.length });
}

console.log(JSON.stringify({ file: input, results, errors }, null, 2));
process.exit(errors.length ? 1 : 0);
