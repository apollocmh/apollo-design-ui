# Image Group 当前方向图标（2026-10-25）

Group setup解构固定了初始direction，运行时ltr/rtl切换不更新图标；RTL分支还在默认图标合并前生成left/right为undefined的覆盖项，导致未自定义时两个导航按钮没有图形。正式4条修前3失败/1已有通过，日志 `/tmp/apollo-image-provider-direction-red.log`。失败来自默认初始RTL、当前默认与自定义方向；LTR默认为原绿对照。

仅在Group图标computed中现读config.direction，先合并DEFAULT_ICONS与当前preview.icons，再按方向镜像。没有增加生命周期桥、旧字段回退或公开API。零基相邻索引与Previous/Next可访问名称保持。

扩展8条全部通过，日志 `/tmp/apollo-image-provider-direction-green.log`，覆盖LTR/RTL初始默认、ltr/rtl/ltr当前切换、已有自定义RTL对照、单侧自定义保留默认、显式null及当前icons替换/移除；图片/编辑器/焦点/选区与90deg变换保持。现有popup-provider Demo增加实时方向按钮，样式map切换独立保留。

## 检查

以下检查实际执行：

- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=2`：25 文件、371 条通过。
- 同目录 `--project types`：14 文件、62 条通过，无类型错误；根 `vue-tsc --noEmit -p tsconfig.json` 通过。
- `pnpm --filter @apollo-design/ui run build`：产物、SFC 声明及 69 份组件 CSS 生成成功。
- `node tests/browser/image-direction.mjs`：Chrome 150.0.7871.125 通过，覆盖默认/自定义/单侧/显式空图标、当前方向切换、真实编辑器状态、相邻索引导航和公开 Demo，零 Vue/控制台/页面错误。日志 `/tmp/apollo-image-provider-direction-browser.log`。
- `node tests/browser/image-popup-provider.mjs`：同一生产产物的弹层 Provider 样式和 Demo 回归通过，日志 `/tmp/apollo-image-provider-direction-popup-regression.log`。修改文件 Biome 与 `git diff --check` 通过。
- `node tests/consumer/image-slot-types.mjs` 与 `node tests/build/run.mjs --package ui --no-build`：实际发布包消费端通过，L7 11 项、0 FAIL、0 PENDING。
- 文档 `build`、`test`、`typecheck`、`content:check`：84 路由、1001 Demo；14 文件、157 条通过。
- `registry:gen`、`registry:workstreams`、`registry:check`：19 项通过；`audit:content-slots` 与一致性检查通过，仍为 518 行、202 条待评估项。
- `node tests/visual/apollo.mjs --check --component image`：退出 1，9 个 Apollo 已批准基线仍缺失，未记为通过，未复制上游快照或提升验收状态。日志 `/tmp/apollo-image-provider-direction-visual.log`。

视觉批准基线仍单独开放，不宣称整个 RTL 布局或全部 Image 配置已验收。
