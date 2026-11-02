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

早期试点 `button/type/light/desktop` 来自提交 `6867166a` 的 Vue 渲染。当前场景以 `matrix.mjs` 为准，已批准图片及来源、环境、哈希、审阅记录以 `baselines/apollo/manifest.json` 为准，不在说明文档另存一份易过期的数量。完整矩阵中的缺失基线必须失败，不能复制旧 React PNG 或调低阈值隐藏。

分批补基线时，先检查当前用例是否仍调用有效的 Vue 契约，以及窄视口、浮层和固定定位内容是否完整进入截图。候选必须实际查看，并结合适用的关键交互确认；修复问题后重拍，审阅通过才接受。最终运行不带组件筛选的完整矩阵，局部通过不能冒充全部通过。

关键交互使用真实时钟的浏览器 context。截图专用的 `newStablePage` 会固定 `Date.now`，影响 Vue 冒泡事件的时间戳过滤及滚动动画，不能直接复用为原生交互探针；保留失败记录并纠正测试环境，不能据此修改正确的产品逻辑。

像素捕获与最终 CI 使用同一个原生环境：`macos-15-intel`，macOS `15.7.9 / 24G830`、官方 Chrome for Testing `150.0.7871.125`、DPR 1、`zh-CN` 页面及浏览器语言、`WhenScrolling` 叠加滚动条、`zh-Hans-CN / zh_CN` 系统语言和区域。[环境检查](environment.mjs)核对实际系统、浏览器和两组原生 Canvas 字体度量；环境漂移在捕获前失败，不能退回其他浏览器或通过改字体、比较阈值消除差异。其他机器可执行 `--check`、`--accept` 等元数据操作，像素捕获使用规范 CI。

历史批准 PNG 保留原始 `environment`、源码提交和审阅说明，不回填成新环境。新候选和比较报告记录完整 `rendering` 信息。迁移时一次捕获后复用原比较器离线比较；已通过的旧图继续保留，仅对确认正确且逐张审阅的失败场景接受新候选。更新完成后仍需重新比较完整矩阵，不能把候选生成或部分通过当作全量通过。

最终验收按组件归属并发比较完整矩阵，构建一次 Vue 视觉 fixture，所有分组读取同一份产物；汇总检查精确场景集合、重复、遗漏、pending、子进程退出码和渲染失败。旧两侧矩阵、分片完整性和渲染错误检查仍由手动参考工作流保留。

原双侧对照的机制和诊断背景保存在 [REFERENCE.md](REFERENCE.md)，按历史参考范围解释。
