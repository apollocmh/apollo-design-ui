# Image 默认计数文字对比度（2026-10-25）

生产 CSS、真实 Portal 和 Chrome 150.0.7871.125 中，白色页面的默认 `1 / 3` 以 0.65 透明白字直接叠在 0.45 黑色遮罩上，axe 测得 2.33:1，低于普通文字 4.5:1；关闭遮罩时为 1:1。原始探针日志 `/tmp/apollo-image-counter-contrast-probe.log`；正式浏览器回归修前退出 1，日志 `/tmp/apollo-image-counter-contrast-red.log`，白色背景的 8 个场景失败，黑色背景的 10 个场景已有通过。

原复现使用局部 ConfigProvider，不能单凭所选主题名称认定挂到 body 的预览已获得对应变量，修前的主题名称不作为暗色覆盖证据。最终回归改用公开 `ThemeProvider inject-css-var` 的全局主题路径，并断言默认计数实际背景为所选亮/暗主题值。局部 Provider 跨 Teleport 的变量继承另行复审，本批不将其修复或验收。

修复仅给默认 `.apollo-image-preview-progress` 增加 `background: var(--apollo-color-bg-spotlight)`，保留 footer 操作颜色继承、组件 Token、计数布局、导航、VNode 身份和公开 API。默认计数槽的 originNode 使用同一规则；自定义计数不获得额外包裹或背景。

## 检查

- `node tests/browser/image-counter-contrast.mjs`：20 个实际场景通过，全局默认/暗色/紧凑/暗色紧凑 × 白/黑页面 × 遮罩开/关共 16 组，另测公开 preview-group Demo 的亮/暗 × 白/黑 4 组。每次运行完整 axe，无排除规则；计数均有已执行的颜色检查，无未决项，对比度最低 5.34:1、最高 8.62:1。默认计数身份、相邻导航与关闭归还焦点通过。日志 `/tmp/apollo-image-counter-contrast-green.log`。
- `node tests/browser/image-preview-slots.mjs`：同一生产 CSS 的自定义计数/预览槽与实际 Demo 完整回归通过，日志 `/tmp/apollo-image-counter-contrast-slots-regression.log`。
- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=2`：25 文件、371 条通过。
- `pnpm --filter @apollo-design/ui run build`：产物、SFC 声明、69 份组件 CSS 生成成功；`node tests/consumer/image-slot-types.mjs`：包括新增实际主题 fixture 和公开 Demo 的发布包严格消费端通过；`node tests/build/run.mjs --package ui --no-build`：11 项、0 FAIL、0 PENDING。
- Registry 19 项及内容清单生成/一致性检查通过，仍 518 行、202 条待评估项；修改文件 Biome 和 `git diff --check` 通过。
- 文档 `build`、`test`、`typecheck`、`content:check` 全部通过：72 组件、1001 Demo、7 指南，14 文件、157 条测试通过。
- `node tests/visual/apollo.mjs --check --component image`：退出 1，仍缺 9 张 Apollo 批准基线；没有复制参考快照或把候选当批准结果。日志 `/tmp/apollo-image-counter-contrast-visual.log`。

根 `pnpm exec vue-tsc --noEmit -p tsconfig.json` 通过。公开类型未改变，本批没有重复运行独立类型用例；生产声明和消费端检查真实执行。Apollo 视觉批准基线仍独立开放。
