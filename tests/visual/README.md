# Apollo 视觉回归

`pnpm test:visual` 默认比较本库已审阅的截图，不使用 React PNG 作为隐式回退。

```bash
# 先构建组件包，然后生成指定场景的候选
node tests/visual/apollo.mjs --candidate --component button --variant type --viewport desktop
# 查看 candidates/apollo/ 下 PNG，确认布局、内容、状态与主题
node tests/visual/apollo.mjs --accept --component button --variant type --viewport desktop --review-note '审阅人、范围及结论'
# 独立重拍，比较已接受基线
pnpm test:visual -- --component button --variant type --viewport desktop
# 渐进迁移时，只核对已接受子集的图片哈希与审阅记录
pnpm test:visual:check -- --approved-only
# 明确请求的上游诊断（不作为发布规格）
pnpm test:visual:reference -- --mode compare --component button
```

候选生成不会覆盖已接受基线。接受动作要求完整渲染、文件未篡改、来源提交/环境和审阅说明；重复变体需解释。比较要求浏览器版本、平台与架构一致，不匹配会失败。`--approved-only` 会报告未验收数量，不代表全矩阵通过。

当前仅 `button/type/light/desktop` 有 Apollo 试点基线，来自提交 `6867166a` 的 Vue 渲染，经实际查看后接受；矩阵其余 1,142 个场景尚未迁移。完整矩阵默认会因缺失基线失败。这是显式未完成，不通过复制旧 React PNG 或调低阈值隐藏。

CI 校验已接受图片与记录的完整性；实际像素比较目前需要同环境本地运行。后续在固定 CI 镜像/字体/浏览器上重新生成并审阅平台基线，再将像素检查设为稳定门禁。旧两侧矩阵、分片完整性和渲染错误检查仍由手动参考工作流保留。

原双侧对照的机制和诊断背景保存在 [REFERENCE.md](REFERENCE.md)，按历史参考范围解释。
