#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const args = process.argv.slice(2);
const stageIndex = args.indexOf("--stage");
const stage = stageIndex === -1 ? "analysis" : args[stageIndex + 1];
const excluded = new Set(stageIndex === -1 ? [] : [stageIndex, stageIndex + 1]);
const input = args.find((arg, index) => !excluded.has(index));
if (!input || !["analysis", "realization"].includes(stage)) {
  console.error("Usage: node scripts/audit-traceability.mjs --stage <analysis|realization> <analysis-model.json>");
  process.exit(2);
}

const errors = [];
const warnings = [];
let model;

try {
  model = JSON.parse(fs.readFileSync(input, "utf8"));
} catch (error) {
  const message = error instanceof SyntaxError ? "Invalid JSON." : "Unable to read file.";
  console.log(JSON.stringify({ file: input, stage, errors: [message], warnings }, null, 2));
  process.exit(1);
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(fs.readFileSync(path.join(scriptDirectory, "../skills/mis-analysis-modeling/assets/analysis-model.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
if (!validate(model)) {
  for (const issue of validate.errors || []) errors.push(`Schema ${issue.instancePath || "/"}: ${issue.message}`);
  console.log(JSON.stringify({ file: input, stage, errors, warnings }, null, 2));
  process.exit(1);
}

const collections = [
  "requirements", "actors", "businessFlows", "processes", "diagrams", "dataFlows",
  "dataStores", "dataStructures", "dataItems", "states"
];

function index(name) {
  const map = new Map();
  for (const entry of model[name] || []) {
    if (!entry.id) continue;
    if (map.has(entry.id)) errors.push(`Duplicate ${name} id: ${entry.id}`);
    map.set(entry.id, entry);
  }
  return map;
}

const requirements = index("requirements");
const actors = index("actors");
const businessFlows = index("businessFlows");
const processes = index("processes");
const diagrams = index("diagrams");
const dataFlows = index("dataFlows");
const dataStores = index("dataStores");
const dataStructures = index("dataStructures");
const dataItems = index("dataItems");
const states = index("states");

const cardIds = new Map();
for (const [category, entries] of [
  ["actor", actors], ["process", processes], ["data flow", dataFlows],
  ["data store", dataStores], ["data structure", dataStructures], ["data item", dataItems]
]) {
  for (const entry of entries.values()) {
    if (!entry.cardId) continue;
    if (cardIds.has(entry.cardId)) errors.push(`Duplicate dictionary cardId ${entry.cardId} in ${category} and ${cardIds.get(entry.cardId)}.`);
    else cardIds.set(entry.cardId, category);
  }
}

const endpointIds = new Set([...actors.keys(), ...processes.keys(), ...dataStores.keys()]);
const processUsage = new Map([...processes.keys()].map((id) => [id, { in: 0, out: 0 }]));
const storeUsage = new Map([...dataStores.keys()].map((id) => [id, { read: 0, write: 0 }]));

for (const flow of dataFlows.values()) {
  if (!endpointIds.has(flow.source)) errors.push(`Data flow ${flow.id} has unknown source ${flow.source}.`);
  if (!endpointIds.has(flow.target)) errors.push(`Data flow ${flow.id} has unknown target ${flow.target}.`);
  if (!processes.has(flow.source) && !processes.has(flow.target)) errors.push(`Data flow ${flow.id} must connect to at least one process.`);
  for (const structureId of flow.structureIds || []) {
    if (!dataStructures.has(structureId)) errors.push(`Data flow ${flow.id} references unknown structure ${structureId}.`);
  }
  if (processes.has(flow.source)) processUsage.get(flow.source).out += 1;
  if (processes.has(flow.target)) processUsage.get(flow.target).in += 1;
  if (dataStores.has(flow.source)) storeUsage.get(flow.source).read += 1;
  if (dataStores.has(flow.target)) storeUsage.get(flow.target).write += 1;
}

for (const actor of actors.values()) {
  for (const flowId of actor.incomingFlowIds || []) {
    const flow = dataFlows.get(flowId);
    if (!flow) errors.push(`Actor ${actor.id} references unknown incoming flow ${flowId}.`);
    else if (flow.target !== actor.id) errors.push(`Actor ${actor.id} incoming flow ${flowId} does not target the actor.`);
  }
  for (const flowId of actor.outgoingFlowIds || []) {
    const flow = dataFlows.get(flowId);
    if (!flow) errors.push(`Actor ${actor.id} references unknown outgoing flow ${flowId}.`);
    else if (flow.source !== actor.id) errors.push(`Actor ${actor.id} outgoing flow ${flowId} does not originate from the actor.`);
  }
}

for (const process of processes.values()) {
  if (process.level === 0) continue;
  const usage = processUsage.get(process.id);
  if (!usage.in) errors.push(`Process ${process.id} has no input flow.`);
  if (!usage.out) errors.push(`Process ${process.id} has no output flow.`);
  for (const flowId of process.inputFlowIds || []) {
    const flow = dataFlows.get(flowId);
    if (!flow) errors.push(`Process ${process.id} references unknown input flow ${flowId}.`);
    else if (flow.target !== process.id) errors.push(`Process ${process.id} input flow ${flowId} does not target the process.`);
  }
  for (const flowId of process.outputFlowIds || []) {
    const flow = dataFlows.get(flowId);
    if (!flow) errors.push(`Process ${process.id} references unknown output flow ${flowId}.`);
    else if (flow.source !== process.id) errors.push(`Process ${process.id} output flow ${flowId} does not originate from the process.`);
  }
  for (const storeId of process.readStoreIds || []) {
    if (!dataStores.has(storeId)) errors.push(`Process ${process.id} references unknown read store ${storeId}.`);
    if (![...dataFlows.values()].some((flow) => flow.source === storeId && flow.target === process.id)) errors.push(`Process ${process.id} has no read flow from store ${storeId}.`);
  }
  for (const storeId of process.writeStoreIds || []) {
    if (!dataStores.has(storeId)) errors.push(`Process ${process.id} references unknown write store ${storeId}.`);
    if (![...dataFlows.values()].some((flow) => flow.source === process.id && flow.target === storeId)) errors.push(`Process ${process.id} has no write flow to store ${storeId}.`);
  }
}

for (const store of dataStores.values()) {
  for (const structureId of store.structureIds || []) {
    if (!dataStructures.has(structureId)) errors.push(`Store ${store.id} references unknown structure ${structureId}.`);
  }
  const usage = storeUsage.get(store.id);
  if (!usage.read) errors.push(`Logical store ${store.id} has no read flow.`);
  if (!usage.write) errors.push(`Logical store ${store.id} has no write flow.`);
  for (const processId of store.readProcessIds || []) {
    if (!processes.has(processId)) errors.push(`Store ${store.id} references unknown read process ${processId}.`);
    if (![...dataFlows.values()].some((flow) => flow.source === store.id && flow.target === processId)) errors.push(`Store ${store.id} has no declared read flow to ${processId}.`);
  }
  for (const processId of store.writeProcessIds || []) {
    if (!processes.has(processId)) errors.push(`Store ${store.id} references unknown write process ${processId}.`);
    if (![...dataFlows.values()].some((flow) => flow.source === processId && flow.target === store.id)) errors.push(`Store ${store.id} has no declared write flow from ${processId}.`);
  }
}

const visiting = new Set();
const visited = new Set();
function visitStructure(id, trail = []) {
  if (visiting.has(id)) {
    errors.push(`Data-structure cycle: ${[...trail, id].join(" -> ")}`);
    return false;
  }
  if (visited.has(id)) return true;
  const structure = dataStructures.get(id);
  if (!structure) return false;
  visiting.add(id);
  let hasLeaf = false;
  for (const itemId of structure.itemIds || []) {
    if (!dataItems.has(itemId)) errors.push(`Structure ${id} references unknown item ${itemId}.`);
    else hasLeaf = true;
  }
  for (const childId of structure.structureIds || []) {
    if (!dataStructures.has(childId)) errors.push(`Structure ${id} references unknown child structure ${childId}.`);
    else hasLeaf = visitStructure(childId, [...trail, id]) || hasLeaf;
  }
  if (!hasLeaf) errors.push(`Structure ${id} does not resolve to any data item.`);
  visiting.delete(id);
  visited.add(id);
  return hasLeaf;
}
for (const id of dataStructures.keys()) visitStructure(id);

function collectItems(structureId, seen = new Set()) {
  if (seen.has(structureId)) return new Set();
  seen.add(structureId);
  const structure = dataStructures.get(structureId);
  if (!structure) return new Set();
  const items = new Set(structure.itemIds || []);
  for (const childId of structure.structureIds || []) {
    for (const itemId of collectItems(childId, seen)) items.add(itemId);
  }
  return items;
}

const storeItems = new Map();
for (const store of dataStores.values()) {
  const items = new Set();
  for (const structureId of store.structureIds || []) for (const itemId of collectItems(structureId)) items.add(itemId);
  storeItems.set(store.id, items);
  for (const keyItemId of store.keyItemIds || []) {
    if (!items.has(keyItemId)) errors.push(`Store ${store.id} key item ${keyItemId} is not part of the store structure closure.`);
  }
}

for (const item of dataItems.values()) {
  if (item.stateId && !states.has(item.stateId)) errors.push(`Data item ${item.id} references unknown state ${item.stateId}.`);
}
for (const state of states.values()) {
  const seen = new Set();
  for (const value of state.values || []) {
    const key = String(value.code);
    if (seen.has(key)) errors.push(`State ${state.id} has duplicate code ${key}.`);
    seen.add(key);
  }
}

for (const diagram of diagrams.values()) {
  if (diagram.type === "tfd") {
    if (!diagram.businessFlowId) errors.push(`TFD diagram ${diagram.id} has no businessFlowId.`);
    else if (!businessFlows.has(diagram.businessFlowId)) errors.push(`TFD diagram ${diagram.id} references unknown business flow ${diagram.businessFlowId}.`);
  }
  for (const processId of diagram.processIds || []) if (!processes.has(processId)) errors.push(`Diagram ${diagram.id} references unknown process ${processId}.`);
  for (const storeId of diagram.storeIds || []) if (!dataStores.has(storeId)) errors.push(`Diagram ${diagram.id} references unknown store ${storeId}.`);
  if (diagram.type === "dfd" && diagram.level > 0) {
    const parent = diagrams.get(diagram.parentDiagramId);
    if (!parent) errors.push(`DFD diagram ${diagram.id} references unknown parent diagram ${diagram.parentDiagramId}.`);
    else {
      if (parent.type !== "dfd") errors.push(`DFD diagram ${diagram.id} parent ${parent.id} is not a DFD.`);
      if (diagram.level !== parent.level + 1) errors.push(`DFD diagram ${diagram.id} level must be exactly one greater than ${parent.id}.`);
      if (!(parent.processIds || []).includes(diagram.parentProcessId)) errors.push(`DFD diagram ${diagram.id} parent process ${diagram.parentProcessId} is not present in ${parent.id}.`);
    }
  }
  for (const boundary of diagram.boundaryFlows || []) {
    if (!dataFlows.has(boundary.flowId)) errors.push(`Diagram ${diagram.id} references unknown boundary flow ${boundary.flowId}.`);
    if (!actors.has(boundary.endpointId) && !processes.has(boundary.endpointId) && !dataStores.has(boundary.endpointId)) errors.push(`Diagram ${diagram.id} has unknown boundary endpoint ${boundary.endpointId}.`);
    if (boundary.processId && !processes.has(boundary.processId)) errors.push(`Diagram ${diagram.id} has unknown boundary process ${boundary.processId}.`);
  }
  const boundaryProcessIds = new Set();
  for (const processBoundary of diagram.processBoundaries || []) {
    if (boundaryProcessIds.has(processBoundary.processId)) errors.push(`Diagram ${diagram.id} has duplicate process boundary for ${processBoundary.processId}.`);
    boundaryProcessIds.add(processBoundary.processId);
    if (!(diagram.processIds || []).includes(processBoundary.processId)) errors.push(`Diagram ${diagram.id} boundary process ${processBoundary.processId} is not in processIds.`);
    const process = processes.get(processBoundary.processId);
    for (const boundary of processBoundary.boundaryFlows || []) {
      if (!dataFlows.has(boundary.flowId)) errors.push(`Diagram ${diagram.id} process ${processBoundary.processId} references unknown boundary flow ${boundary.flowId}.`);
      if (!actors.has(boundary.endpointId) && !processes.has(boundary.endpointId) && !dataStores.has(boundary.endpointId)) errors.push(`Diagram ${diagram.id} process ${processBoundary.processId} has unknown endpoint ${boundary.endpointId}.`);
      if (process) {
        const declaredFlows = boundary.direction === "input" ? process.inputFlowIds || [] : process.outputFlowIds || [];
        if (!declaredFlows.includes(boundary.flowId)) errors.push(`Diagram ${diagram.id} process ${process.id} ${boundary.direction} boundary ${boundary.flowId} is not declared by the process.`);
        if (process.level > 0) {
          const flow = dataFlows.get(boundary.flowId);
          if (flow) {
            const expectedEndpoint = boundary.direction === "input" ? flow.source : flow.target;
            const expectedProcess = boundary.direction === "input" ? flow.target : flow.source;
            if (expectedProcess !== process.id || expectedEndpoint !== boundary.endpointId) {
              errors.push(`Diagram ${diagram.id} process ${process.id} boundary ${boundary.flowId} contradicts the data-flow endpoints.`);
            }
          }
        }
      }
    }
  }
  for (const processId of diagram.processIds || []) {
    if (!boundaryProcessIds.has(processId)) errors.push(`Diagram ${diagram.id} process ${processId} has no processBoundaries entry.`);
  }
  for (const processBoundary of diagram.processBoundaries || []) {
    const process = processes.get(processBoundary.processId);
    if (!process) continue;
    const expected = new Set();
    for (const flowId of process.inputFlowIds || []) {
      const flow = dataFlows.get(flowId);
      if (flow) expected.add(`${flowId}|${flow.source}|input`);
    }
    for (const flowId of process.outputFlowIds || []) {
      const flow = dataFlows.get(flowId);
      if (flow) expected.add(`${flowId}|${flow.target}|output`);
    }
    const actual = new Set((processBoundary.boundaryFlows || []).map((boundary) => `${boundary.flowId}|${boundary.endpointId}|${boundary.direction}`));
    for (const key of expected) if (!actual.has(key)) errors.push(`Diagram ${diagram.id} process ${process.id} boundary is missing ${key}.`);
    for (const key of actual) if (!expected.has(key)) errors.push(`Diagram ${diagram.id} process ${process.id} boundary adds undeclared ${key}.`);
  }
  for (const boundary of diagram.boundaryFlows || []) {
    if (!boundary.processId) continue;
    const processBoundary = (diagram.processBoundaries || []).find((entry) => entry.processId === boundary.processId);
    const matches = processBoundary?.boundaryFlows?.some((candidate) =>
      candidate.flowId === boundary.flowId && candidate.endpointId === boundary.endpointId && candidate.direction === boundary.direction
    );
    if (!matches) errors.push(`Diagram ${diagram.id} boundary ${boundary.flowId} is not present in process ${boundary.processId} local boundary.`);
  }
  const diagramProcesses = new Set(diagram.processIds || []);
  const diagramStores = new Set(diagram.storeIds || []);
  const expectedDiagramBoundary = new Set();
  for (const processBoundary of diagram.processBoundaries || []) {
    for (const boundary of processBoundary.boundaryFlows || []) {
      if (!diagramProcesses.has(boundary.endpointId) && !diagramStores.has(boundary.endpointId)) {
        expectedDiagramBoundary.add(`${boundary.flowId}|${boundary.endpointId}|${boundary.direction}|${processBoundary.processId}`);
      }
    }
  }
  const actualDiagramBoundary = new Set((diagram.boundaryFlows || []).map((boundary) => `${boundary.flowId}|${boundary.endpointId}|${boundary.direction}|${boundary.processId || ""}`));
  for (const key of expectedDiagramBoundary) if (!actualDiagramBoundary.has(key)) errors.push(`Diagram ${diagram.id} boundary is missing ${key}.`);
  for (const key of actualDiagramBoundary) if (!expectedDiagramBoundary.has(key)) errors.push(`Diagram ${diagram.id} boundary adds undeclared ${key}.`);
}
for (const businessFlow of businessFlows.values()) {
  if (![...diagrams.values()].some((diagram) => diagram.type === "tfd" && diagram.businessFlowId === businessFlow.id)) {
    errors.push(`Business flow ${businessFlow.id} has no TFD diagram mapping.`);
  }
}

const mappings = model.mappings || {};
const requirementMappings = mappings.requirementToBusinessFlow || [];
for (const requirement of requirements.values()) {
  if (requirement.priority === "must" && requirement.status !== "excluded" &&
      !requirementMappings.some((mapping) => mapping.requirementId === requirement.id)) {
    errors.push(`Must requirement ${requirement.id} is not mapped to a business flow.`);
  }
}
for (const mapping of requirementMappings) {
  if (!requirements.has(mapping.requirementId)) errors.push(`Unknown requirement in mapping: ${mapping.requirementId}`);
  if (!businessFlows.has(mapping.businessFlowId)) errors.push(`Unknown business flow in mapping: ${mapping.businessFlowId}`);
}

const businessMappings = mappings.businessFlowToProcess || [];
for (const businessFlow of businessFlows.values()) {
  if (!businessMappings.some((mapping) => mapping.businessFlowId === businessFlow.id)) errors.push(`Business flow ${businessFlow.id} is not mapped to any process.`);
}
for (const mapping of businessMappings) {
  if (!businessFlows.has(mapping.businessFlowId)) errors.push(`Unknown business flow in process mapping: ${mapping.businessFlowId}`);
  if (!(mapping.processIds || []).length) errors.push(`Business flow mapping ${mapping.businessFlowId} has no processes.`);
  for (const processId of mapping.processIds || []) if (!processes.has(processId)) errors.push(`Unknown process in business-flow mapping: ${processId}`);
}

for (const refinement of mappings.dataFlowRefinements || []) {
  if (!dataFlows.has(refinement.parentFlowId)) errors.push(`Unknown parent flow in refinement: ${refinement.parentFlowId}`);
  for (const childId of refinement.childFlowIds || []) if (!dataFlows.has(childId)) errors.push(`Unknown child flow in refinement: ${childId}`);
}

const storeMappings = mappings.storeToTable || [];
const physicalTables = new Set();
const tablesByStore = new Map();
for (const mapping of storeMappings) {
  if (!dataStores.has(mapping.storeId)) errors.push(`Unknown store in physical mapping: ${mapping.storeId}`);
  if (!(mapping.tableNames || []).length) errors.push(`Store mapping ${mapping.storeId} has no physical table.`);
  const storeTables = tablesByStore.get(mapping.storeId) || new Set();
  for (const table of mapping.tableNames || []) {
    physicalTables.add(table);
    storeTables.add(table);
  }
  tablesByStore.set(mapping.storeId, storeTables);
}
if (stage === "realization") {
  for (const storeId of dataStores.keys()) {
    if (!storeMappings.some((mapping) => mapping.storeId === storeId)) errors.push(`Logical store ${storeId} has no physical table mapping.`);
  }
}

const itemMappings = mappings.itemToColumn || [];
for (const mapping of itemMappings) {
  if (!dataItems.has(mapping.itemId)) errors.push(`Unknown data item in column mapping: ${mapping.itemId}`);
  if (!dataStores.has(mapping.storeId)) errors.push(`Column mapping ${mapping.itemId} uses unknown store ${mapping.storeId}.`);
  else if (!storeItems.get(mapping.storeId)?.has(mapping.itemId)) errors.push(`Data item ${mapping.itemId} is not part of logical store ${mapping.storeId}.`);
  if (!physicalTables.has(mapping.tableName)) errors.push(`Column mapping ${mapping.itemId} uses unknown table ${mapping.tableName}.`);
  if (mapping.storeId && !tablesByStore.get(mapping.storeId)?.has(mapping.tableName)) errors.push(`Column mapping ${mapping.itemId} uses table ${mapping.tableName} outside store ${mapping.storeId}.`);
  if (!mapping.columnName) errors.push(`Column mapping ${mapping.itemId} has no column name.`);
}
if (stage === "realization") {
  for (const itemId of dataItems.keys()) {
    if (!itemMappings.some((mapping) => mapping.itemId === itemId)) errors.push(`Data item ${itemId} has no physical column mapping.`);
  }
}

const stateMappings = mappings.stateToPhysical || [];
for (const mapping of stateMappings) {
  if (!states.has(mapping.stateId)) errors.push(`Unknown state in physical mapping: ${mapping.stateId}`);
  const item = dataItems.get(mapping.itemId);
  if (!item) errors.push(`State mapping ${mapping.stateId} uses unknown item ${mapping.itemId}.`);
  else if (item.stateId !== mapping.stateId) errors.push(`State mapping ${mapping.stateId} does not match item ${mapping.itemId} state reference.`);
  if (!physicalTables.has(mapping.tableName)) errors.push(`State mapping ${mapping.stateId} uses unknown table ${mapping.tableName}.`);
  if (!mapping.columnName) errors.push(`State mapping ${mapping.stateId} has no column name.`);
  if (!itemMappings.some((itemMapping) => itemMapping.itemId === mapping.itemId && itemMapping.tableName === mapping.tableName && itemMapping.columnName === mapping.columnName)) {
    errors.push(`State mapping ${mapping.stateId} does not match the physical column mapping for item ${mapping.itemId}.`);
  }
}
if (stage === "realization") {
  for (const stateId of states.keys()) {
    if (!stateMappings.some((mapping) => mapping.stateId === stateId)) errors.push(`State ${stateId} has no physical mapping.`);
  }
}

for (const question of model.openQuestions || []) if (question.blocking) warnings.push(`Blocking open question: ${question.question || question.id}`);

console.log(JSON.stringify({
  file: input,
  stage,
  counts: Object.fromEntries(collections.map((name) => [name, model[name]?.length || 0])),
  errors: [...new Set(errors)],
  warnings,
  note: "Traceability closure does not replace domain review. Run audit-balance.mjs for DFD parent-child balance."
}, null, 2));
process.exit(errors.length ? 1 : 0);
