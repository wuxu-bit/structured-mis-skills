# Structured MIS Skills

> Turn information-system requirements into traceable TFD, DFD, data dictionaries, and database evidence instead of disconnected diagrams and schemas.

[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-111827)](https://agentskills.io)
[![skills.sh](https://skills.sh/b/wuxu-bit/structured-mis-skills)](https://skills.sh/wuxu-bit/structured-mis-skills)
[![Validate](https://github.com/wuxu-bit/structured-mis-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/wuxu-bit/structured-mis-skills/actions/workflows/validate.yml)

Structured MIS Skills 是一套面向信息系统分析、课程设计和原型实施的 Agent Skills。它把需求、业务流程图（TFD）、数据流程图（DFD）、完整数据字典、Prisma Schema、数据库迁移和只读验证组织成一条可追踪的工作链。

两个Skill遵循开放的[Agent Skills规范](https://agentskills.io/specification)，不绑定OpenCode。可以安装到OpenCode、Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、Cline、OpenClaw及其他兼容Agent Skills的客户端。Skill可以跨平台安装；完整执行仍要求客户端支持并配置对应MCP依赖。

本仓库不附带模型 API key、数据库凭据或第三方 MCP 服务。两个 Skill 依托下列上游项目运行，使用对应 Skill 前必须先按上游文档完成配置；本仓库只提供配置引导，不复制第三方代码或秘密。

## Skills

| Skill | 何时使用 | 主要交付 |
|---|---|---|
| [`mis-analysis-modeling`](skills/mis-analysis-modeling/SKILL.md) | 从需求建立或审查 TFD、DFD 和数据字典 | 分析基线、可编辑图、六类完整字典、追踪矩阵、审计报告 |
| [`mis-database-realization`](skills/mis-database-realization/SKILL.md) | 将逻辑数据模型落实为 PostgreSQL/Prisma 实现并验证 | 逻辑到物理映射、Schema、迁移审查、只读验证证据、差异记录 |

两个 Skill 可以独立使用。若串联使用，前一个 Skill 生成的 `analysis-model.json` 是后一个 Skill 的输入契约。

## 核心区别

- 先建立语义模型，再生成 draw.io XML，不把自然语言机械翻译成图。
- TFD、DFD 和数据字典共同来自一个分析基线，而不是分别编写。
- 完整数据字典是正式源，报告节选只是派生产物。
- 父子 DFD 平衡按端点、方向和数据流语义核对，不用“看起来差不多”代替验证。
- Prisma 负责定义和迁移数据库；DBHub 只用于受控、只读的结构与数据验证。
- 任何设计与实现偏差都进入差异记录，不静默修改事实。

## 前置依赖

| Skill | 使用前必须配置 | 用途 |
|---|---|---|
| `mis-analysis-modeling` | [DayuanJiang/next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io) | 通过 MCP 创建、预览、编辑和导出可编辑 draw.io 图 |
| `mis-database-realization` | [prisma/prisma](https://github.com/prisma/prisma)、PostgreSQL、[bytebase/dbhub](https://github.com/bytebase/dbhub) | 定义和迁移数据库，并通过只读 MCP 核对实际结构与数据 |

依赖未配置，或最小连通性测试未通过时，Skill 必须停止在前置检查阶段。不得把只完成的文字规划描述成已经生成图表或已经验证数据库。

## 快速开始

### 通用安装器（推荐）

使用[Vercel Skills CLI](https://github.com/vercel-labs/skills)自动发现当前环境中的Agent并选择Skill：

```bash
npx skills add wuxu-bit/structured-mis-skills
```

列出本仓库的两个Skill：

```bash
npx skills add wuxu-bit/structured-mis-skills --list
```

安装指定Skill到一个或多个Agent：

```bash
npx skills add wuxu-bit/structured-mis-skills \
  --skill mis-analysis-modeling \
  --agent claude-code \
  --agent opencode
```

安装两个Skill到安装器支持的所有Agent：

```bash
npx skills add wuxu-bit/structured-mis-skills --all
```

加`--global`可安装到用户级目录；默认安装到当前项目。安装器默认使用符号链接维护单一副本，不支持符号链接的平台可以选择`--copy`。

无需安装即可生成Skill提示或启动受支持Agent：

```bash
npx skills use wuxu-bit/structured-mis-skills@mis-analysis-modeling
```

### 主流平台

| 平台 | `--agent`名称 | 项目级路径 | 用户级路径 |
|---|---|---|---|
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| Cline | `cline` | `.agents/skills/` | `~/.agents/skills/` |
| OpenClaw | `openclaw` | `skills/` | `~/.openclaw/skills/` |

平台路径由Skills CLI维护，完整列表及变化以其[Supported Agents](https://github.com/vercel-labs/skills#supported-agents)为准。更多说明见[`docs/platform-installation.md`](docs/platform-installation.md)。

### 完整仓库（含开发验证器）

克隆完整仓库并使用Node.js 22.20或更高版本安装锁定依赖：

```bash
git clone https://github.com/wuxu-bit/structured-mis-skills.git
cd structured-mis-skills
npm ci
npm test
```

随后先按“前置依赖”完成对应上游项目配置。完整仓库用于运行根目录验证脚本、Skill内置Schema和合成fixtures；普通用户只安装Skill时不要求克隆开发工具。

### 手动安装

无法使用`npx`时，把完整Skill目录复制到目标平台的Skill路径。必须保留`SKILL.md`、`references/`和`templates/`，不能只复制一个Markdown文件：

```text
<agent-skill-path>/mis-analysis-modeling/
<agent-skill-path>/mis-database-realization/
```

手动安装后重启或重新加载对应Agent。若平台不原生支持Agent Skills，可将`SKILL.md`作为项目指令加载，但这种回退方式不具备标准的自动发现和渐进加载能力。

### 直接触发

```text
根据这份信息系统需求，先建立分析基线，再生成业务流程图、分层数据流程图和完整数据字典。所有产物必须做一致性审查。
```

```text
根据 analysis-model.json 和数据字典，把逻辑数据存储映射为 PostgreSQL + Prisma Schema，审查迁移，并用只读方式验证数据库结构。
```

## 依托的上游项目

| 上游项目 | 用途 | 许可证 | 本仓库的关系 |
|---|---|---|---|
| [DayuanJiang/next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io) | 创建、预览和导出可编辑 draw.io 图 | Apache-2.0 | `mis-analysis-modeling` 的必需 MCP 依赖，不随本仓库分发 |
| [bytebase/dbhub](https://github.com/bytebase/dbhub) | 通过 MCP 探索和验证数据库 | MIT | `mis-database-realization` 的必需只读验证依赖，不随本仓库分发 |
| [prisma/prisma](https://github.com/prisma/prisma) | Schema、迁移和类型安全数据库访问 | Apache-2.0 | `mis-database-realization` 的必需数据库工具，不随本仓库分发 |

详细归属见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

### 使用前请求 Agent 配置 draw.io MCP

```text
请帮我把 Next AI Draw.io MCP 配置到当前项目中。

上游项目：
https://github.com/DayuanJiang/next-ai-draw-io

要求：
1. 先阅读官方安装说明并确认当前版本和 Node.js 要求。
2. 只创建项目级配置，不修改用户级全局配置。
3. 不要求、不生成、不记录任何模型 API key。
4. 配置完成后生成一张最小测试图并导出 .drawio。
5. 不把本机绝对路径、Token 或秘密写进 Git。
```

### 使用前请求 Agent 配置 DBHub

```text
请帮我把 DBHub 配置为当前项目的数据库验证 MCP。

上游项目：
https://github.com/bytebase/dbhub

要求：
1. 先阅读官方安装和只读配置说明。
2. 使用项目级 MCP 配置和经过测试的固定版本，不使用 latest。
3. 数据库连接串只能从本地环境变量读取。
4. 使用专用只读数据库账号，并启用 DBHub 只读限制、行数限制和查询超时。
5. 只验证表、字段、索引、外键和模拟数据，不执行迁移或数据修改。
6. 配置、日志、进程示例和 Git 中不得出现真实 DSN 或密码。
```

### 使用前请求 Agent 配置 Prisma

```text
请帮我在当前PostgreSQL项目中配置Prisma。

上游项目：
https://github.com/prisma/prisma

要求：
1. 先阅读官方安装说明并确认当前Node.js与PostgreSQL版本兼容性。
2. 只安装项目级、固定版本的Prisma CLI与Client，不使用临时latest版本。
3. 数据库连接串只能通过本地环境变量提供，不写入Schema、日志或Git。
4. 先完成Schema格式化和静态校验，不执行迁移、reset或Seed。
5. 任何会修改数据库的命令都必须先说明影响并获得明确确认。
```

## 验证

```bash
npm test
npm run audit:example
npm run scan:portable
npm run validate:discovery
```

验证器当前检查：

- Skill frontmatter 和仓库结构。
- 通用Skills CLI能否发现两个Skill。
- 未压缩draw.io XML在`academic` profile下的ID、引用、绑定边、锚点、TFD/DFD标签及基本连接规则。
- `analysis-model.json` 中需求、TFD、DFD、数据字典和逻辑存储映射的闭包。
- DFD父子图边界端点、方向和数据流细化关系。
- 仓库中疑似秘密、数据库连接串和个人绝对路径。

验证脚本是防错工具，不替代语义审查和真实渲染检查。当前draw.io验证器不解码压缩的`<diagram>`载荷，也不验证其他教材的自定义符号体系。

## 安全边界

- 不存储或索取模型 API key。
- 不把数据库连接串写入受版本控制的配置。
- 不通过 DBHub 生成或执行迁移。
- 不在未确认时执行 seed、reset、DDL、DML、推送或发布。
- 不把课程指导书、教材、往届代码、真实学生信息或原始项目成果再发布为示例。
- 合成示例中的人物、编号和数据均为虚构。

更多规则见 [`SECURITY.md`](SECURITY.md)。

## License

本仓库原创内容采用 [Apache License 2.0](LICENSE)。外部项目保持各自许可证和归属。本仓库不隶属于上述第三方项目，也不代表其维护者。
