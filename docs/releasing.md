# Release 发布流程

本仓库以一个语义化版本同时发布两个 Skill。GitHub Release 基于Git标签，提供两个独立压缩包和一份 SHA-256 校验文件；仓库源码压缩包仍由GitHub自动生成。

## 发布资产

每个版本包含：

- `mis-analysis-modeling.zip`
- `mis-database-realization.zip`
- `SHA256SUMS`

压缩包以Skill目录作为根目录，保留`SKILL.md`、`references/`、`templates/`和`assets/`。它们可供人工下载，也可作为Skills CLI的直接下载源。

## 发布前检查

1. 更新`package.json`中的版本。
2. 同步两个`SKILL.md`中`metadata.version`。
3. 将`CHANGELOG.md`中的变更归入相同版本和日期。
4. 确认工作树只包含预期修改。
5. 执行全部验证：

```bash
npm ci
npm test
npm run audit:example
npm run scan:portable
npm run validate:skills
npm run validate:discovery
npm audit --audit-level=moderate
```

## 创建版本

提交并推送已验证的变更后，创建与`package.json`一致的带注释标签：

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

`.github/workflows/release.yml`会再次执行验证，检查标签与包版本一致，打包两个Skill，生成校验和，并创建GitHub Release。不要在验证失败时手工绕过工作流发布资产。

## 发布后检查

1. Release不是草稿或预发布版本。
2. 三个资产均存在，压缩包大小合理。
3. `SHA256SUMS`与下载文件一致。
4. 下列命令能发现对应Skill：

```bash
npx skills add https://github.com/wuxu-bit/structured-mis-skills/releases/latest/download/mis-analysis-modeling.zip --list
npx skills add https://github.com/wuxu-bit/structured-mis-skills/releases/latest/download/mis-database-realization.zip --list
```

5. README中的仓库安装方式仍可使用。

## 教材与其他第三方文件

Release资产不自动受本仓库Apache-2.0许可证保护。课程教材、指导书、往届作业和其他第三方文件不得因为“不进入Git历史”就作为Release资产上传。只有取得明确的公开再发布授权，并单独标识权利人、授权条款和适用范围后，才可考虑分发；本仓库当前不发布此类文件。
