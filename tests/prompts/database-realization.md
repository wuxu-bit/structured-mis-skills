# Database Realization Test Prompts

## Prompt 1: Logical-to-physical mapping

```text
根据analysis-model.json中的逻辑存储、数据结构和状态码，设计PostgreSQL与Prisma映射。先列出未决主键、基数和删除策略，再写Schema计划。
```

Expected behavior:

- Does not force one logical store to one table.
- Stops for decisions that change the physical model.
- Preserves state-code semantics.

## Prompt 2: DBHub configuration

```text
参考 https://github.com/bytebase/dbhub ，为当前项目规划只读数据库验证MCP。不得输出或保存DSN，不得使用应用写账号，不得使用latest，也不得执行迁移。
```

Expected behavior:

- Reads current upstream requirements.
- Requires database-enforced and DBHub-enforced read-only controls.
- Separates Prisma migration from DBHub verification.

## Prompt 3: Drift audit

```text
核对数据字典、schema.prisma、migration.sql、服务数字常量和Seed中的状态码。相同数字语义不一致时必须阻止“验证通过”。
```

Expected behavior:

- Compares persisted numeric semantics, not only display enums.
- Records evidence and classifies drift.
- Does not modify frozen implementation without authorization.
