# Cross-Platform Installation

Structured MIS Skills uses the open [Agent Skills specification](https://agentskills.io/specification). The Skill directories contain portable YAML frontmatter, Markdown instructions, references, and templates; they do not depend on OpenCode-specific configuration.

## Recommended Installer

The [Vercel Skills CLI](https://github.com/vercel-labs/skills) detects installed agents and places each Skill in the correct project or user directory.

Interactive project installation:

```bash
npx skills add wuxu-bit/structured-mis-skills
```

Global installation:

```bash
npx skills add wuxu-bit/structured-mis-skills --global
```

Install one Skill to selected agents:

```bash
npx skills add wuxu-bit/structured-mis-skills \
  --skill mis-database-realization \
  --agent codex \
  --agent cursor
```

Install both Skills to all supported agents:

```bash
npx skills add wuxu-bit/structured-mis-skills --all
```

`--all`可能为未检测到的受支持Agent创建目录。只想安装到当前实际使用的平台时，应使用交互选择或显式`--agent`。

Use `--copy` when the target environment does not support symbolic links. Use `--list` to inspect discovered Skills before installation.

## Installation Versus Execution

Portable installation does not remove runtime prerequisites:

| Skill | Required runtime capability |
|---|---|
| `mis-analysis-modeling` | File access and an MCP-capable client with Next AI Draw.io configured |
| `mis-database-realization` | File access, PostgreSQL, Prisma, and an MCP-capable client with read-only DBHub configured |

A client that supports Agent Skills but not MCP can install and discover the Skill, but it cannot complete the full workflow. The Skill must stop at Gate -1 instead of claiming a diagram or database verification was produced.

## Manual Installation

Copy the complete Skill directory, not only `SKILL.md`:

```text
skills/mis-analysis-modeling/
skills/mis-database-realization/
```

Common paths include:

| Client | Project | Global |
|---|---|---|
| OpenCode | `.agents/skills/` | `~/.config/opencode/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.agents/skills/` | `~/.codex/skills/` |
| Cursor | `.agents/skills/` | `~/.cursor/skills/` |
| Gemini CLI | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `.agents/skills/` | `~/.copilot/skills/` |

Check the current client documentation or the Skills CLI supported-agent table before manual installation because paths can change.

## Generic MCP Configuration Request

Use this request inside the target Agent after installing the Skill:

```text
Configure the required MCP dependency for this Skill in the current Agent client.
Read the upstream repository and this client's current MCP documentation first.
Use project scope, a fixed tested version, and local secret storage.
Do not print or commit API keys, tokens, DSNs, passwords, cookies, or personal absolute paths.
Run only a non-destructive smoke test and report the exact configuration files changed.
```

Then provide the required upstream URL:

- Next AI Draw.io: https://github.com/DayuanJiang/next-ai-draw-io
- DBHub: https://github.com/bytebase/dbhub
- Prisma: https://github.com/prisma/prisma

## Updating and Removing

```bash
npx skills update mis-analysis-modeling
npx skills remove mis-analysis-modeling
```

The Skills CLI can filter by `--agent` and project/global scope. Review its current documentation before unattended installation or removal.
