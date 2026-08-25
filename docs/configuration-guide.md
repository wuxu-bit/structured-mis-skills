# 配置指南

安装 Agent Skill 只会让客户端发现工作流说明，不会自动安装 MCP 服务、数据库或 Prisma。本指南给出跨客户端通用的安全配置模型；实际配置文件位置和字段以当前客户端与上游项目的官方文档为准。

本文中的版本核对日期为 2026-08-25。升级前应重新阅读上游发布说明并执行最小连通性测试。

## 1. 安装 Skill

优先使用 Skills CLI 从仓库安装：

```bash
npx skills add wuxu-bit/structured-mis-skills --list
npx skills add wuxu-bit/structured-mis-skills
```

安装完成后，先确认客户端能发现 `mis-analysis-modeling` 和 `mis-database-realization`，再配置相应运行时依赖。

## 2. 配置 Next AI Draw.io MCP

上游项目：[DayuanJiang/next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io)，Apache-2.0。

官方 MCP 服务是自包含的图表工具。Agent 客户端负责生成 draw.io XML，MCP 负责浏览器预览、编辑和导出，因此不需要为该 MCP 单独提供模型 API key。

在支持标准 MCP 配置的客户端中使用以下模型，并按客户端要求调整顶层字段：

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@next-ai-drawio/mcp-server@0.2.3"]
    }
  }
}
```

不要把配置示例直接覆盖到未知客户端。配置后应重启或重新加载客户端，并依次验证：

1. 客户端能发现 `start_session`、`create_new_diagram` 和 `export_diagram` 等工具。
2. 能创建一张只含两个节点和一条连线的最小测试图。
3. 能导出并重新打开 `.drawio` 文件。
4. 输出目录没有模型密钥、Token或个人绝对路径。

默认图表界面可能访问 `https://embed.diagrams.net`。敏感图表应按上游说明自托管 draw.io，并通过 `DRAWIO_BASE_URL` 指向自托管地址。

## 3. 配置 DBHub

上游项目：[bytebase/dbhub](https://github.com/bytebase/dbhub)，MIT。当前核对版本为 `1.2.1`，npm 运行要求为 Node.js 22.5或更高版本。

DBHub 不需要模型 API key，但需要数据库连接信息。推荐使用 TOML 配置，因为 `readonly`、`max_rows` 和 `query_timeout` 都需要在其中明确设置。

可提交到版本库的 `dbhub.toml` 只保存变量名和限制，不保存真实 DSN：

```toml
[[sources]]
id = "course_project"
dsn = "${DBHUB_DATABASE_URL}"
connection_timeout = 10
query_timeout = 15

[[tools]]
name = "execute_sql"
source = "course_project"
readonly = true
max_rows = 200

[[tools]]
name = "search_objects"
source = "course_project"
```

通用 MCP 启动模型如下，路径应按客户端的项目目录解析规则调整：

```json
{
  "mcpServers": {
    "dbhub": {
      "command": "npx",
      "args": [
        "-y",
        "@bytebase/dbhub@1.2.1",
        "--transport",
        "stdio",
        "--config",
        "./dbhub.toml"
      ]
    }
  }
}
```

真实连接串只能由本地秘密存储向 `DBHUB_DATABASE_URL` 提供。仅设置 `readonly = true` 仍不充分，还必须让 PostgreSQL 使用专用只读账号，并尽量连接测试或演示数据库。

最小验收只执行无副作用查询：

1. 确认数据库身份和当前用户。
2. 查询表、字段、索引和外键。
3. 执行有明确 `LIMIT` 的 `SELECT`。
4. 确认写语句被 DBHub 和数据库权限同时拒绝。
5. 确认日志与 Agent 输出没有显示真实 DSN 或密码。

DBHub 只用于核验，不负责生成迁移、执行 DDL、写入 Seed 或修复业务数据。

## 4. 配置 Prisma

上游项目：[prisma/prisma](https://github.com/prisma/prisma)，Apache-2.0。

Prisma CLI 与 `@prisma/client` 必须使用相同版本，并与项目当前 Node.js、PostgreSQL、代码结构和锁文件兼容。不要为了使用本 Skill 强制升级已有项目的 Prisma 主版本。

配置顺序如下：

1. 检查项目已有的包管理器、Node.js版本、Prisma版本和锁文件。
2. 新项目根据当前官方文档安装相同版本的 `prisma` 与 `@prisma/client`。
3. 仅通过本地环境变量提供数据库连接串。
4. 先运行格式化和静态校验。
5. 生成或应用迁移、Seed、reset之前说明影响并取得明确确认。

DBHub的只读账号不能代替Prisma迁移账号；两者应分离。前者只用于核验，后者仅在获准执行迁移时使用。

## 5. 通用 Agent 配置请求

不清楚当前客户端配置格式时，可在安装 Skill 后向 Agent 提交：

```text
请为当前项目配置这个 Skill 所需的 MCP 或 Prisma 依赖。

要求：
1. 先阅读上游官方安装文档和当前客户端的 MCP 文档。
2. 使用项目级配置和明确的固定版本，不直接使用 latest。
3. 不打印、不提交 API key、Token、DSN、密码、Cookie或个人绝对路径。
4. 只执行无副作用的最小连通性测试。
5. 报告修改了哪些配置文件、使用了什么版本、测试结果和未验证项。
6. 迁移、Seed、reset、DDL、DML及连接生产数据库必须另行获得确认。
```

随后附上对应上游链接：

- Next AI Draw.io：https://github.com/DayuanJiang/next-ai-draw-io
- DBHub：https://github.com/bytebase/dbhub
- Prisma：https://github.com/prisma/prisma

## 6. 常见错误

- 把“Skill已安装”写成“MCP已配置完成”。
- 给Next AI Draw.io MCP额外索取模型API key。
- 在受版本控制的JSON或TOML中写入真实DSN。
- 只依赖DBHub的逻辑只读开关，却继续使用数据库写账号。
- 使用`latest`导致不同同学在不同时间安装到不同行为版本。
- 连通性测试直接执行迁移、Seed或写SQL。
- MCP不可用时仍声称已经生成可编辑图或验证真实数据库。
