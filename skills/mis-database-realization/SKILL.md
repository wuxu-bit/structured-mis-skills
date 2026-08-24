---
name: mis-database-realization
description: Use when an information-system analysis model must be traced from DFD logical stores and complete data dictionaries into PostgreSQL/Prisma, migration evidence, read-only DBHub validation, or implementation-drift records. Trigger on 逻辑存储到Prisma映射, 数据字典与数据库一致性, DBHub只读验证, and 分析设计实现追踪; do not trigger for generic PostgreSQL, migration, seed, or Prisma coding tasks.
license: Apache-2.0
compatibility: Cross-platform Agent Skills format. Requires an MCP-capable client, PostgreSQL, Prisma, and DBHub configured with database-enforced read-only access.
metadata:
  author: structured-mis-skills
  version: 0.1.0
---

# MIS Database Realization

把结构化分析阶段的逻辑数据存储、数据结构、数据项和状态码落实为可审查的PostgreSQL/Prisma实现，并保存验证证据和设计—实现差异。

## 适用边界

使用本 Skill：

- 将DFD逻辑存储映射为关系表。
- 从完整数据字典设计或审查Prisma Schema。
- 生成迁移计划、审查迁移SQL和验证应用结果。
- 设计可复现的合成Seed数据。
- 通过只读DBHub检查表、字段、索引、外键、迁移记录和模拟数据。
- 核对逻辑模型、数据库设计和实际实现的偏差。

不要使用本 Skill：

- 绕过Prisma直接用DBHub生成或执行迁移。
- 使用生产写账号做“只读验证”。
- 未经确认执行seed、reset、DDL、DML或生产迁移。
- 把未验证的Schema或日志写成“数据库已构建完成”。

## 输入契约

优先读取 `mis-analysis-modeling` 生成的分析基线。最低输入：

- 数据存储字典；
- 数据结构和数据项字典；
- 状态码和值域；
- 主处理对存储的读写关系；
- 业务唯一性、并发和审计要求；
- 未解决问题；
- 当前数据库设计、Schema和迁移（若存在）。

缺少关键业务主键、状态含义、金额精度或关系基数时，暂停并询问。

## Gate -1：前置依赖

使用本 Skill 前必须具备并验证：

1. PostgreSQL目标环境；
2. 项目中锁定版本的Prisma CLI与Client；
3. 以项目级MCP方式配置的DBHub；
4. DBHub使用数据库专用只读账号，并启用只读限制、行数限制和查询超时；
5. Prisma和DBHub均能完成最小连通性检查，且不会输出真实DSN或密码。

上游项目：

- Prisma：https://github.com/prisma/prisma
- DBHub：https://github.com/bytebase/dbhub

依赖缺失或验证失败时停止本 Skill，只返回相应官方项目链接和安全配置引导。不得在没有DBHub实际查询证据时声称数据库结构已经验证。

## 必读 References

- 建模：`references/logical-to-physical-mapping.md`
- Prisma和迁移：`references/prisma-workflow.md`
- DBHub：`references/dbhub-readonly-validation.md`
- Seed：`references/seed-data-safety.md`
- 差异审计：`references/implementation-drift.md`

## 端到端工作流

### Gate 0：验证分析输入

确认：

- 每个逻辑存储有组成和业务关键字；
- 数据结构最终闭包到数据项；
- 状态码语义唯一；
- 读写处理清晰；
- 逻辑模型中的未决问题不会使物理设计产生两种不同结论。

先运行：

```bash
node scripts/audit-traceability.mjs --stage realization <analysis-model.json>
```

该命令只随完整仓库安装提供。仅复制本Skill目录时，按reference人工完成Gate，不得声称执行过验证器。

### Gate 1：逻辑到物理映射

为每个逻辑存储记录：

- 拆分出的表；
- 主键；
- 外键和基数；
- 唯一约束；
- 状态字段；
- 金额和时间字段；
- 索引理由；
- 级联或限制策略；
- 未落地逻辑字段。

一个逻辑存储可以拆成多张表。不能为了“一一对应”牺牲范式、生命周期或权限边界。

### Gate 2：Schema建模

在 `schema.prisma` 中实现经过确认的映射。至少审查：

- provider确实是PostgreSQL；
- ID类型统一；
- 金额使用Decimal/Numeric，不使用浮点；
- 手机号、学号和业务编码使用字符串；
- 密码只保存哈希；
- 时间类型和时区策略明确；
- 图片保存URL或对象标识；
- 表名和字段映射一致；
- 关系、唯一约束和索引覆盖业务规则；
- 状态默认值与字典一致。

### Gate 3：静态校验与迁移计划

先执行不会修改数据库的格式和Schema校验。随后生成迁移前：

1. 确认目标数据库和环境；
2. 说明命令会修改什么；
3. 获得明确授权；
4. 生成迁移；
5. 人工审查SQL；
6. 检查删除、重命名、默认值、外键动作和潜在数据损失。

迁移生成成功不代表SQL安全。

### Gate 4：迁移应用

开发环境和部署环境使用不同流程：

- 开发：生成并应用新迁移；
- 部署：只应用已经审查、已经提交的迁移；
- 禁止在生产环境使用开发式迁移或reset；
- 运行时连接与迁移直连需要分开时，明确记录用途。

应用迁移属于写操作，必须得到明确确认。

### Gate 5：只读结构验证

DBHub只负责验证：

- 数据库身份和只读状态；
- 表、列和类型；
- 主键、外键和唯一约束；
- 索引；
- 迁移历史；
- Seed后的计数和关系完整性。

DBHub不得负责迁移生成、DDL应用、业务修复或Seed写入。

### Gate 6：Seed计划与执行

Seed必须：

- 只包含合成数据；
- 可说明来源；
- 覆盖核心状态和关系；
- 处理重复运行；
- 不依赖不稳定的自增ID；
- 明确是否删除现有数据；
- 在失败时避免留下无法解释的半成品。

任何删除、重建或重置式Seed都视为破坏性操作。

### Gate 7：差异审计

比较：

```text
逻辑存储/数据项/状态
↔ 数据库设计
↔ schema.prisma
↔ migration.sql
↔ 服务中的持久化常量
↔ seed数据
↔ 实际数据库
```

不一致写入 `implementation-differences.md`，区分：

- 已接受的物理拆分；
- 待修复缺陷；
- 有意简化；
- 待实现功能；
- 文档过时；
- 尚未验证。

### Gate 8：证据归档

保存：

- 工具和数据库版本；
- 环境类别，不保存连接秘密；
- 执行命令和时间；
- 迁移名称；
- 结构查询摘要；
- Seed计数；
- 测试结果；
- 未覆盖边界。

命令计划不等于执行证据，绿色CI也不等于数据库结构已经核对。

## DBHub依赖策略

本Skill依托DBHub完成实际数据库的只读核对，但不内置DBHub，也不保存DSN。使用前必须按上游文档完成配置：

https://github.com/bytebase/dbhub

配置请求必须包含：项目级配置、固定版本、专用只读账号、DBHub只读限制、行数限制、查询超时和本地秘密来源。不要使用`latest`，不要回退到应用写账号。最小权限和连通性检查未通过时不得进入Gate 0。

## 安全停点

以下动作必须暂停并获得明确授权：

- 创建或应用迁移；
- Seed、reset、truncate、delete；
- DDL或DML；
- 连接生产数据库；
- 使用具有写权限的数据库账号；
- 把Schema变化推送到远端；
- 标记实现为“完成”。

## 默认交付

- 逻辑到物理映射表；
- Prisma Schema审查结果；
- 迁移SQL审查表；
- DBHub只读配置清单；
- 结构和数据验证证据；
- Seed安全说明；
- 设计—实现差异记录；
- 未验证项和后续工作。
