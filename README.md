# Structured MIS Skills

> Turn information-system requirements into traceable TFD, DFD, data dictionaries, and database evidence instead of disconnected diagrams and schemas.

[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-compatible-111827)](https://agentskills.io)
[![skills.sh](https://skills.sh/b/wuxu-bit/structured-mis-skills)](https://skills.sh/wuxu-bit/structured-mis-skills)
[![Validate](https://github.com/wuxu-bit/structured-mis-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/wuxu-bit/structured-mis-skills/actions/workflows/validate.yml)

Structured MIS Skills 是一套专门面向信息系统分析与设计的 Agent Skills，源自于合肥工业大学管理学院（现更名为管理与智能科学学院（智能商学院））的信息系统分析与设计课程及配套课程设计。该课程及配套课程设计是信息管理与信息系统专业（它很可能即将改名）的核心课程，管科方向的其他专业也有开设这一课程。其课程设计实验中复杂的图像绘制要求和数据库后端配置或将成为同学们AI工作流的巨大阻碍，特此开源个人利用Agent工具实现的相关配置便于管院相关专业的同学使用并速通该课设实验，也鼓励各位在实践中学习熟悉先进的Agent工具，同时也欢迎MIS相关领域的同学或同行借鉴使用或提供宝贵意见。

当前版本下，项目中主要有2个skill，均需要自主配置并提供大模型API。其一主要面向信息系统结构化分析，能够在既有需求分析的基础上，完成业务流程图（TFD）、数据流程图（DFD）、数据字典三者逻辑连贯的绘制与生成，主要基于drawio(学术绘图工具)和相关开源mcp并对信息系统分析给出特定规范，结果会输出.drawio工程文件，可以手动核查并二次调整。其二主要面向信息系统实现的数据库后端代码实现与部署，现主要基于开源的dbhub MCP，可方便同学们无需使用sql图形化工具即可完成相关实验要求，但亟待完善更多的实现路径。

两个Skill遵循开放的[Agent Skills规范](https://agentskills.io/specification)，可以安装到OpenCode、Claude Code、Codex、Cursor及其他兼容Agent Skills的客户端。

本仓库不附带模型 API key、数据库凭据或第三方 MCP 服务。两个 Skill 依托下列上游项目运行，使用对应 Skill 前必须先按上游文档完成配置；本仓库只提供配置引导，不复制第三方代码或大模型API。

## Skills

| Skill | 何时使用 | 主要交付 |
|---|---|---|
| [`mis-analysis-modeling`](skills/mis-analysis-modeling/SKILL.md) | 从需求建立或审查 TFD、DFD 和数据字典 | 分析基线、可编辑图、六类完整字典、追踪矩阵、审计报告 |
| [`mis-database-realization`](skills/mis-database-realization/SKILL.md) | 将逻辑数据模型落实为 PostgreSQL/Prisma 实现并验证 | 逻辑到物理映射、Schema、迁移审查、只读验证证据、差异记录 |

两个 Skill 可以独立使用。若串联使用，前一个 Skill 生成的 `analysis-model.json` 是后一个 Skill 的输入契约。


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
请帮我根据GitHub链接把 Next AI Draw.io MCP 配置到当前项目中。
https://github.com/DayuanJiang/next-ai-draw-io

```

### 使用前请求 Agent 配置 DBHub

```text
请帮我根据GitHub链接把 DBHub 配置为当前项目的数据库验证 MCP。
https://github.com/bytebase/dbhub

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
