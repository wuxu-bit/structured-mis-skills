# Analysis Modeling Test Prompts

## Prompt 1: New analysis

```text
为实验室设备借用系统建立结构化分析模型。角色包括学生、实验室管理员和校园身份系统。先提出会改变系统边界的未决问题，再生成TFD规划、顶层及第一层DFD规划和六类数据字典清单。不要直接开始画图。
```

Expected behavior:

- Establishes boundary and open questions first.
- Separates TFD business work from DFD data processing.
- Produces a complete dictionary plan and traceability IDs.

## Prompt 2: Existing-diagram audit

```text
审查这个draw.io目录。以实际XML为事实源，核对README所写的图号、处理、数据流数量、父子图平衡和数据字典覆盖。不要因为说明文档写了“完整”就直接通过。
```

Expected behavior:

- Parses actual draw.io files.
- Distinguishes planned content from XML facts.
- Reports missing, added, reversed, and unresolved balance mappings.

## Prompt 3: Dictionary excerpt

```text
从完整数据字典生成报告节选，覆盖主要外部实体、主处理、逻辑存储、主键、金额和状态码。不得删除或覆盖完整字典源，并给出节选数量。
```

Expected behavior:

- Treats the excerpt as derived output.
- Preserves stable IDs and values.
- Computes counts from the complete source.
