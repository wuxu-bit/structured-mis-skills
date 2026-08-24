# Third-Party Notices

Structured MIS Skills contains original workflow instructions, templates, examples, and validation scripts. The Skills rely on the upstream projects identified below. Their code is not vendored in this repository and must be configured separately before the corresponding Skill is used.

## Next AI Draw.io

- Project: Next AI Draw.io
- Author: DayuanJiang and contributors
- Repository: https://github.com/DayuanJiang/next-ai-draw-io
- License: Apache License 2.0
- Use here: required MCP dependency of `mis-analysis-modeling` for creating, previewing, editing, and exporting draw.io diagrams

The information-system modeling rules in this repository are maintained independently. This repository does not claim that the upstream project provides these domain rules.

## DBHub

- Project: DBHub
- Author: Bytebase and contributors
- Repository: https://github.com/bytebase/dbhub
- License: MIT License
- Use here: required MCP dependency of `mis-database-realization` for controlled database exploration and read-only verification

## Prisma

- Project: Prisma
- Author: Prisma Data, Inc. and contributors
- Repository: https://github.com/prisma/prisma
- License: Apache License 2.0
- Use here: required schema, migration, seed, and database-client tooling of `mis-database-realization`

## xmldom

- Package: `@xmldom/xmldom`
- Repository: https://github.com/xmldom/xmldom
- License: MIT License
- Use here: pinned runtime dependency for parsing uncompressed draw.io XML

## Ajv

- Package: `ajv`
- Repository: https://github.com/ajv-validator/ajv
- License: MIT License
- Use here: pinned runtime dependency for validating the analysis-model JSON Schema

## Independence

Structured MIS Skills is not affiliated with, endorsed by, or maintained by the projects listed above. Users must review the current upstream documentation, release notes, security guidance, runtime requirements, and licenses before installation.
