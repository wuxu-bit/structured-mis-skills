# AGENTS.md

This repository contains two public Agent Skills for structured information-system analysis and database realization.

## Product Boundary

1. `mis-analysis-modeling` owns requirements baselining, TFD, DFD, complete data dictionaries, traceability, and diagram audits.
2. `mis-database-realization` owns logical-to-physical mapping, Prisma workflow, migration review, read-only database verification, seed boundaries, and implementation-drift records.
3. `analysis-model.json` is the handoff contract. Do not infer missing decisions silently.
4. Report excerpts are derived outputs. They never replace complete analysis sources.

## Safety

1. Never request, print, store, or commit model API keys, access tokens, cookies, database passwords, or real DSNs.
2. Never add machine-specific absolute paths to tracked files.
3. Treat migration, seed, reset, DDL, DML, Git push, visibility changes, tags, and releases as state-changing actions requiring explicit confirmation.
4. DBHub is a verification tool, not a migration engine. Require a database-enforced read-only account and DBHub read-only guardrails.
5. Do not copy course handbooks, textbooks, prior student work, private reports, screenshots, or real user data into examples.

## Source Discipline

When sources disagree, record the conflict and use this order:

1. User-confirmed current requirements and scope.
2. Actual editable artifacts and machine-readable models.
3. Complete data-dictionary sources.
4. Current schema, migrations, and implementation behavior.
5. Derived reports, summaries, screenshots, and historical prose.

Do not turn a derived claim into a fact when the underlying artifact contradicts it.

## Quality Gates

1. Establish system boundary and unresolved questions before drawing.
2. Model semantics before generating XML.
3. Validate each TFD and DFD structurally and semantically.
4. Validate DFD parent-child balance using endpoint, direction, and flow semantics.
5. Keep all six dictionary categories complete.
6. Validate dictionary leaf fields and state-code closure.
7. Record every logical-to-physical split and every implementation deviation.
8. Run `npm test`, `npm run audit:example`, and `npm run scan:portable` before release.

## Third-Party Tools

External tools are optional integrations. Link to their official repositories and licenses; do not vendor them without an explicit licensing review.

- Next AI Draw.io: https://github.com/DayuanJiang/next-ai-draw-io
- DBHub: https://github.com/bytebase/dbhub
- Prisma: https://github.com/prisma/prisma
