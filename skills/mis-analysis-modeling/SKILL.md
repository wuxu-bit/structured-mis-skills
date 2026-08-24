---
name: mis-analysis-modeling
description: Use when an information-system analysis task combines business flow diagrams (TFD), layered data flow diagrams (DFD), complete data dictionaries, parent-child balance, or cross-artifact traceability. Trigger on 信息系统业务流程图, 数据流程图与数据字典一致性, TFD/DFD, 父子图平衡, and 结构化系统分析建模; do not trigger for generic draw.io, UML, architecture, or ordinary flowcharts.
license: Apache-2.0
compatibility: Cross-platform Agent Skills format. Requires an MCP-capable client with Next AI Draw.io configured and file access; Node.js 22.20+ only for full-repository validators.
metadata:
  author: structured-mis-skills
  version: 0.1.0
---

# MIS Analysis Modeling

将信息系统需求转化为可追踪的业务流程图、分层数据流程图和六类完整数据字典。核心目标不是“多画几张图”，而是让需求、TFD、DFD、字典和后续设计共享同一组业务语义。

## 适用边界

使用本 Skill：

- 从调查材料或需求建立结构化分析模型。
- 绘制或修订信息系统 TFD、顶层/第一层/第二层/第三层 DFD。
- 编制外部实体、处理、数据流、数据存储、数据结构、数据项六类完整字典。
- 审查现有 `.drawio`、说明文档和数据字典是否一致。
- 为数据库设计准备可追踪的逻辑模型。

不要使用本 Skill：

- 普通软件流程图、部署架构图、UML类图或统计图。
- 只要求美化一张图而不允许检查其业务语义。
- 把界面、按钮、Controller、SQL或物理设备混入系统分析模型。

## Gate -1：前置依赖

使用本 Skill 前必须配置并验证 Next AI Draw.io MCP：

https://github.com/DayuanJiang/next-ai-draw-io

前置检查必须确认：

1. 当前 Agent runtime 能发现并调用该项目提供的 MCP 工具；
2. 能创建一个最小测试图并导出可重新打开的 `.drawio`；
3. 配置没有把模型 API key、Token、本机私人路径或其他秘密写入受版本控制文件；
4. 使用的上游版本和 Node.js 要求已经记录。
5. 已确认图表内容是否允许发送到外部渲染页面。Next AI Draw.io默认可能加载`https://embed.diagrams.net`；敏感图表必须按上游说明配置自托管`DRAWIO_BASE_URL`。

任一项不满足时停止本 Skill，只返回官方项目链接和项目级配置引导。不得跳过依赖后把语义模型或XML草稿描述成完整的图表交付。

## 权威顺序

材料冲突时按下列顺序处理，并把冲突写入审计报告：

1. 用户确认的当前需求、系统边界和业务规则。
2. 当前可编辑图源和机器可读分析模型。
3. 六类完整数据字典正式源。
4. 当前数据库设计和实现事实。
5. 报告节选、总结、截图、OCR和历史说明。

报告中的“已经覆盖”不能推翻图源中的实际缺失。OCR、Mermaid和自动摘要只能作为线索。

## 必读 References

按任务读取相应资料：

- 开始任何新分析：`references/requirements-baseline.md`
- TFD：`references/business-flow-modeling.md`
- DFD：`references/data-flow-modeling.md`
- 数据字典：`references/data-dictionary.md`
- 跨产物检查：`references/traceability-and-gates.md`
- 生成或审查 draw.io：`references/drawio-xml-profile.md`
- 诊断已有成果：`references/anti-patterns.md`

## 端到端工作流

### Gate 0：确认输入和边界

读取需求、调查、既有图、字典和设计文件。输出：

- 系统名称和业务目标；
- 系统内外边界；
- 参与角色与外部系统；
- 核心业务闭环；
- 核心状态和管理控制点；
- 明确排除项；
- 未解决问题。

如果缺少会改变系统边界、角色、核心状态或外部依赖的信息，暂停并询问。不要猜测。

### Gate 1：建立分析基线

使用 `templates/analysis-model.json` 建立统一模型。至少包含：

- `requirements`
- `actors`
- `businessFlows`
- `processes`
- `dataFlows`
- `dataStores`
- `dataStructures`
- `dataItems`
- `states`
- `mappings`
- `openQuestions`

所有后续图表和字典均从这份基线推导。不要分别维护三套互不关联的名称。

### Gate 2：业务流程建模

先按现实业务闭环划分 TFD，再逐图建模：

1. 确认发起者、目标和终止条件。
2. 列出处理单位、业务动作、流转信息和长期存档。
3. 建立正常主干。
4. 增加驳回、补正、冲突、超时、取消、外部失败和申诉等异常支线。
5. 确认关键状态变化均有触发、处理、结果和必要留痕。
6. 输出建模摘要后再生成 XML。

TFD描述现实业务作业，不按页面、按钮、API或CRUD机械拆图。

### Gate 3：数据流程建模

按层次推进：

1. 顶层图只保留总处理、外部实体和边界数据流。
2. 第一层图把总处理分为3至7个主要功能域，并引入逻辑数据存储。
3. 第二层图逐一展开复杂主处理。
4. 第三层图只展开仍需细化的父处理，不把多个无关父处理混入同一子图。
5. 每完成一层立即执行父子图平衡检查。

DFD只表达数据来源、去向、加工和存储，不保留TFD中的无语义顺序线。

### Gate 4：编制完整数据字典

必须生成六类正式源：

1. 外部实体字典；
2. 处理字典；
3. 数据流字典；
4. 数据存储字典；
5. 数据结构字典；
6. 数据项字典。

完整源必须覆盖实际 DFD 中出现的全部逻辑元素。第三层细化处理和内部数据流不能因为报告篇幅被省略。若将多条细化流归并到父流，必须建立显式映射。

### Gate 5：一致性审查

至少检查：

- 每个需求是否映射到业务闭环或明确排除项；
- 每个TFD闭环是否映射到DFD处理；
- 每个DFD元素是否命中字典；
- 每个处理是否至少一入一出；
- 每个逻辑存储是否全局至少一读一写；
- 父子图端点、方向和流语义是否平衡；
- 状态码和值域是否唯一；
- 数据结构叶子是否全部命中数据项；
- 同一术语是否跨图、字典和说明保持一致。

运行：

```bash
node scripts/audit-traceability.mjs --stage analysis <analysis-model.json>
node scripts/audit-balance.mjs <analysis-model.json>
node scripts/audit-drawio.mjs --type tfd --profile academic <diagram.drawio>
node scripts/audit-drawio.mjs --type dfd --profile academic <diagram.drawio>
```

脚本通过后仍要人工检查图形渲染、业务闭环和规则合理性。根目录脚本只随完整仓库安装提供；仅复制本Skill目录时使用人工检查表，不得假装命令可用。

### Gate 6：交付

默认交付：

- 分析基线；
- TFD建模摘要与可编辑 `.drawio`；
- 分层DFD建模摘要与可编辑 `.drawio`；
- 六类完整数据字典；
- TFD—DFD—字典追踪矩阵；
- 一致性审计报告；
- 未解决问题和设计—实现差异入口。

只有用户明确要求时才额外导出 SVG 或 PNG。报告节选单独生成，不覆盖完整字典。

## draw.io 依赖策略

本 Skill 依托 Next AI Draw.io MCP 创建、预览、编辑和导出图表。该依赖不是可选项，也不随本仓库分发。

依赖未配置时：

1. 立即停止执行绘图工作流；
2. 给出官方上游链接和项目级配置请求；
3. 不安装来源不明的替代工具，不请求或记录模型 API key；
4. 不把本机绝对路径或用户凭据写入配置；
5. 配置和最小导出测试通过后，才从 Gate 0 重新开始。

https://github.com/DayuanJiang/next-ai-draw-io

该项目是本 Skill 的必需外部依赖，但不是本仓库的一部分。MCP负责图表创建、预览和导出；本 Skill 负责信息系统建模、一致性规则和验证流程。

## 停止条件

遇到以下情况暂停：

- 系统边界或核心角色无法确定；
- 同一状态码在不同材料中含义冲突；
- 子图新增父图没有的边界流且无法解释；
- 数据字典声称完整但无法覆盖实际图源；
- 用户要求把受版权保护或含真实个人信息的材料发布为示例；
- 任何工具要求把 API key、Token 或数据库密码写入受版本控制文件。

## 反例底线

- 不用“图很多”代替分析完整。
- 不把无标签TFD连线直接复制为DFD数据流。
- 不把数据存储和物理数据库表视为一一对应。
- 不因为报告写了某功能，就判定图源已经覆盖。
- 不用重复实体副本掩盖新增系统边界。
- 不把脚本校验通过写成“业务语义完全正确”。
