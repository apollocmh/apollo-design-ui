# Image 当前缩放边界（2026-10-25）

Image 和 PreviewGroup 将当前配置传到 Preview，但 Preview 在 setup 向变换内核传入数值快照。按钮随新配置更新，实际操作却继续使用旧边界。公开入口正式 6 条修前全部失败，分别验证两入口的上限放宽、替换收紧和下限提高；日志 `/tmp/apollo-image-scale-bounds-red.log`。

Preview 改传 getter，私有变换内核通过 Vue toValue 在每次变换及缩放时读取边界，原有指针锚点公式不变。扩展回归另确认当前比例超过新上限时按钮及槽 disabled.zoomIn 仍为 false，追加复现为 2 失败/12 通过，日志 `/tmp/apollo-image-scale-bounds-disabled-red.log`；两个同源比较由等于改为大于等于。

最终 14 条通过，日志 `/tmp/apollo-image-scale-bounds-expanded-green.log`。额外覆盖配置移除恢复默认、真实 DOM wheel、指针锚点、旋转夹取、按钮/槽禁用一致及编辑器身份/草稿/焦点/选区。配置变化本身不修改现有变换、不发 transform；下一次非复位操作使用当前边界，关闭/reset 仍回到比例 1。没有新增 API、状态同步 watch 或兼容通道。

公开 transform-events Demo 增加默认/窄范围/较高下限切换，Image/Group 均可在打开的工具栏内操作，原事件计数/once 用法保留。

## 检查

- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=2`：26 文件、385 条通过。
- 根 `pnpm exec vue-tsc --noEmit -p tsconfig.json` 通过；`pnpm --filter @apollo-design/ui run build` 的产物、SFC 声明和 69 份组件 CSS 生成成功。
- `node tests/browser/image-scale-bounds.mjs`：Chrome 150.0.7871.125 通过双入口当前边界、按钮/槽一致、默认回退、真实滚轮/双击、编辑器/草稿/焦点/选区、静默配置切换及两个实际 Demo 预览；完整 axe 无排除规则，零 Vue/控制台/页面错误。最终日志 `/tmp/apollo-image-scale-bounds-browser-typed-final.log`。
- `node tests/browser/image-transform.mjs`：同一生产产物的事件数组/once/当前监听器/快照/拒绝关闭/复位及实际 Demo 旧契约通过，日志 `/tmp/apollo-image-scale-bounds-transform-regression.log`。
- `node tests/consumer/image-slot-types.mjs` 与 `node tests/build/run.mjs --package ui --no-build`：实际 Demo、新 fixture 和公开类型消费端通过；L7 11 项、0 FAIL、0 PENDING。日志 `/tmp/apollo-image-scale-bounds-consumer-l7-final.log`。
- 首轮浏览器指出自建 reset 按钮继承白字，与默认按钮背景对比不足，已为该测试按钮设置主题前景/背景，保留完整 axe；首轮消费端指出整对象替换的 PreviewConfig 使用深 ref 触发 TS2589，改用 shallowRef 后通过，没有断言或忽略诊断。
- Registry 19 项及内容清单生成/一致性检查通过，仍 518 行、202 条待评估项；Biome 和 `git diff --check` 通过。KNOWN-ISSUES 总表移除已完成的 toolbarRender 迁移旧提示，保留配置复审事项。
- 文档 `build`、`test`、`typecheck`、`content:check` 全部通过：72 组件、1001 Demo、7 指南，14 文件、157 条测试通过。
- `node tests/visual/apollo.mjs --check --component image`：退出 1，仍缺 9 张 Apollo 批准图，未记录为通过。日志 `/tmp/apollo-image-scale-bounds-visual.log`。

没有公共类型变化，本批不重复运行独立类型用例；生产声明和真实消费端严格检查已执行。其他预览配置、局部主题跨 Teleport 和 Apollo 视觉批准基线独立开放。
