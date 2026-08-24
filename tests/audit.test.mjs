import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

function run(args) {
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

test("synthetic traceability model passes", () => {
  const result = run(["scripts/audit-traceability.mjs", "examples/library-lending/analysis-model.json"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("synthetic TFD passes", () => {
  const result = run(["scripts/audit-drawio.mjs", "--type", "tfd", "examples/library-lending/tfd-borrow.drawio"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("synthetic context DFD passes", () => {
  const result = run(["scripts/audit-drawio.mjs", "--type", "dfd", "examples/library-lending/dfd-context.drawio"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("invalid DFD fails", () => {
  const result = run(["scripts/audit-drawio.mjs", "--type", "dfd", "tests/fixtures/invalid-dfd.drawio"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /must connect to at least one process/);
});

test("malformed XML fails", () => {
  const result = run(["scripts/audit-drawio.mjs", "--type", "dfd", "tests/fixtures/malformed.drawio"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /XML parse error/);
});

test("Skill frontmatter passes", () => {
  const result = run(["scripts/validate-skills.mjs", "."]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("traceability audit rejects cyclic structures and missing physical mappings", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-model-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.dataStructures[0].itemIds = [];
  model.dataStructures[0].structureIds = [model.dataStructures[0].id];
  model.mappings.itemToColumn = [];
  const file = path.join(directory, "invalid.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", "--stage", "realization", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Data-structure cycle/);
  assert.match(result.stdout, /has no physical column mapping/);
});

test("analysis stage allows deferred physical mappings while realization rejects them", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-stage-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.mappings.storeToTable = [];
  model.mappings.itemToColumn = [];
  model.mappings.stateToPhysical = [];
  const file = path.join(directory, "analysis-only.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const analysis = run(["scripts/audit-traceability.mjs", "--stage", "analysis", file]);
  const realization = run(["scripts/audit-traceability.mjs", "--stage", "realization", file]);
  assert.equal(analysis.status, 0, analysis.stdout + analysis.stderr);
  assert.notEqual(realization.status, 0);
  assert.match(realization.stdout, /has no physical table mapping/);
});

test("balance audit rejects reversed child boundary flows", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-balance-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.diagrams[2].boundaryFlows[0].direction = "output";
  const file = path.join(directory, "reversed.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-balance.mjs", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /reverses boundary flows/);
});

test("balance audit compares the expanded process boundary, not the whole parent diagram", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-local-balance-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.diagrams.push({
    id: "DFD-2-P1",
    type: "dfd",
    level: 2,
    parentDiagramId: "DFD-1",
    parentProcessId: "P1",
    processIds: ["P1.1"],
    storeIds: [],
    boundaryFlows: [
      { flowId: "D-001", endpointId: "S1", direction: "input", processId: "P1.1" },
      { flowId: "D-002", endpointId: "P2", direction: "output", processId: "P1.1" }
    ],
    processBoundaries: []
  });
  const file = path.join(directory, "local-boundary.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-balance.mjs", file]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("traceability audit rejects an orphan non-root DFD", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-orphan-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  delete model.diagrams[2].parentDiagramId;
  delete model.diagrams[2].parentProcessId;
  const file = path.join(directory, "orphan.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /must have required property 'parentDiagramId'/);
});

test("traceability audit rejects a fabricated process boundary", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-fake-boundary-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.diagrams[2].processBoundaries[0].boundaryFlows = [
    { flowId: "D-005", endpointId: "S1", direction: "output" }
  ];
  const file = path.join(directory, "fake-boundary.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /is not declared by the process|contradicts the data-flow endpoints/);
});

test("traceability audit rejects a process boundary that omits a real flow", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-missing-boundary-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.diagrams[2].processBoundaries[0].boundaryFlows = model.diagrams[2].processBoundaries[0].boundaryFlows.filter((boundary) => boundary.flowId !== "D-002");
  const file = path.join(directory, "missing-boundary.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /boundary is missing D-002/);
});

test("realization audit rejects a data item mapped through the wrong logical store", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-store-map-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.dataStores.push({
    cardId: "ST-02",
    id: "F2",
    name: "Result archive",
    description: "Separate result archive used only by this negative fixture.",
    structureIds: ["DS-003"],
    keyItemIds: ["I-003"],
    readProcessIds: ["P2"],
    writeProcessIds: ["P2"],
    retention: "Test only"
  });
  model.dataFlows.push(
    { cardId: "DF-06", id: "D-006", name: "Archived result", description: "Negative fixture write.", source: "P2", target: "F2", structureIds: ["DS-003"], frequency: "Test" },
    { cardId: "DF-07", id: "D-007", name: "Stored result", description: "Negative fixture read.", source: "F2", target: "P2", structureIds: ["DS-003"], frequency: "Test" }
  );
  model.processes[2].inputFlowIds.push("D-007");
  model.processes[2].outputFlowIds.push("D-006");
  model.processes[2].readStoreIds.push("F2");
  model.processes[2].writeStoreIds.push("F2");
  model.mappings.storeToTable.push({ storeId: "F2", tableNames: ["result_archive"] });
  model.mappings.itemToColumn[0] = { itemId: "I-001", storeId: "F2", tableName: "result_archive", columnName: "reader_id" };
  const file = path.join(directory, "wrong-store.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", "--stage", "realization", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /I-001 is not part of logical store F2/);
});

test("schema type errors return structured output without stack traces", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-schema-"));
  const model = JSON.parse(fs.readFileSync("examples/library-lending/analysis-model.json", "utf8"));
  model.requirements = {};
  const file = path.join(directory, "wrong-type.json");
  fs.writeFileSync(file, JSON.stringify(model));
  const result = run(["scripts/audit-traceability.mjs", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /must be array/);
  assert.doesNotMatch(result.stderr, /TypeError|audit-traceability/);
});

test("academic DFD rejects a non-rectangular process disguised with metadata", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-process-shape-"));
  const file = path.join(directory, "bad-process.drawio");
  fs.writeFileSync(file, `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="s1" value="Reader" style="shape=ellipse;" vertex="1" parent="1"/><mxCell id="p1" misType="process" value="Bad process" style="shape=ellipse;" vertex="1" parent="1"/><mxCell id="e1" value="Request" style="exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1" source="s1" target="p1"/><mxCell id="e2" value="Result" style="exitX=0;exitY=0.5;entryX=1;entryY=0.5;" edge="1" parent="1" source="p1" target="s1"/></root></mxGraphModel>`);
  const result = run(["scripts/audit-drawio.mjs", "--type", "dfd", "--profile", "academic", file]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /must be a divided rectangle/);
});

test("portability scanner detects multiple secret and path classes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-secret-"));
  const token = ["ghp", "_", "A".repeat(30)].join("");
  const dsn = ["mongodb", "://user:password@example.invalid/database"].join("");
  const windowsPath = ["C:", "\\", "Users", "\\", "private-user", "\\", "file.txt"].join("");
  fs.writeFileSync(path.join(directory, ".env"), `TOKEN=${token}\nDATABASE_URL=${dsn}\nPATH_HINT=${windowsPath}\n`);
  const result = run(["scripts/scan-portability.mjs", directory]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /GitHub token/);
  assert.match(result.stdout, /credential-bearing DSN/);
  assert.match(result.stdout, /Windows personal path/);
});

test("portability scanner does not skip large text files", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mis-large-secret-"));
  const token = ["ghp", "_", "B".repeat(30)].join("");
  fs.writeFileSync(path.join(directory, "large.txt"), `${"x".repeat(2_100_000)}\n${token}\n`);
  const result = run(["scripts/scan-portability.mjs", directory]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /GitHub token/);
});

test("missing input returns stable error without stack trace", () => {
  const result = run(["scripts/audit-traceability.mjs", "does-not-exist.json"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Unable to read file/);
  assert.doesNotMatch(result.stderr, /at .*audit-traceability/);
});
