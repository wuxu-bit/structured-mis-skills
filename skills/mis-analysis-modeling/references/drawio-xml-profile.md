# draw.io XML Profile

## 文件结构

当前`audit-drawio.mjs`只验证本仓库的未压缩`academic` profile。它兼容：

```xml
<mxfile><diagram><mxGraphModel>...</mxGraphModel></diagram></mxfile>
```

以及直接以 `<mxGraphModel>` 为根的旧文件。生成新文件时优先使用完整 `mxfile` 包装。压缩在`<diagram>`文本中的draw.io载荷需要先由draw.io导出为未压缩XML；验证器不会静默猜测或解压。

其他教材符号体系可以用于人工建模，但必须另建验证profile，不能直接用`academic`结果背书。

## 通用规则

- `mxCell id`唯一。
- `parent`、`source`和`target`引用存在。
- 边必须用`source`和`target`绑定节点。
- 禁止只用`sourcePoint`/`targetPoint`表示正式逻辑连接。
- 边显式设置`exitX`、`exitY`、`entryX`、`entryY`。
- 边连接可移动父外框或外部实体，不连接内部编号、名称和分隔线。
- 简单边不加waypoint；优先调整布局和副本。
- 同一节点多条边使用分散锚点。

## TFD Profile

默认样式：

```text
actor: shape=ellipse; width=height
process: shape=rectangle; rounded=0
document: shape=document
archive: shape=mxgraph.flowchart.stored_data
edge: orthogonal, endArrow=classic
```

若profile规定箭头无文字，edge `value`必须为空。

## DFD Profile

处理使用组合节点：

- 外框：普通矩形；
- 编号：父框内部text；
- 名称：父框内部text；
- 横向分隔线：父框内部子元素。

数据存储使用组合节点：

- 外框：`shape=partialRectangle;right=0`；
- 编号和名称：内部text；
- 竖向分隔线：内部子元素。

所有数据流edge `value`必须非空。

## 重复副本

- 外部实体副本同逻辑ID、同名称、不同XML ID。
- 数据存储副本同编号、同名称、不同XML ID。
- 副本仅改善布局，不改变系统边界。
- 统计和父子平衡时按逻辑ID归一。

## 布局

- 主流程左到右。
- 输入在左，输出在右。
- 异常、反馈和回退在下方或外侧。
- 存储靠近读写处理。
- 避免线穿节点、完全重叠和超长回线。
- 真实预览后检查文字、裁切、重叠和箭头贴边。

脚本只能检查部分结构和锚点，不能代替浏览器渲染检查。
