# F11 · Mentions 原生浮层作用域槽（2026-10-25）

首批三条回归修前2失败/1已有通过（SSR未进入测量不求值浮层）；日志 `/tmp/apollo-mentions-popup-red.log`。修后验证两种allowClear路径：条件槽出现、当前头部/候选数据、显式空内容、移除恢复菜单、textarea节点/值/焦点、浮层内已有节点值保持、原菜单键盘选择与单次onSelect。三条均通过。

按 ADR0006/0007 移除公开与InternalMentions/KeywordTrigger的popupRender函数prop，新增MentionsSlots / MentionsPopupRenderSlotProps，单参数为 `{ originNode: VNode }`，返回VNodeChild。Mentions→RcMentions→InternalMentions→KeywordTrigger按当前函数转发；最后一层在render创建菜单、求值一次槽，把VNode数据交给Trigger，避免其既有缓存watch在render外调用原生槽。没有改共享Trigger或制造响应式render写入。

严格零警告断言还捕获原有popupClassName String声明收到嵌套数组的类型警告；原代码以as never绕过。现在用normalizeClass在KeywordTrigger边界归一，保留语义、追加及css-var三类类名，移除该断言；未过滤日志或降低断言。

旧调用测试保留内容断言并迁为具名槽；既有popupRender示例用真实模板、可切换/空/更新及当前数据、v-model/键盘回填演示，改用Apollo CSS变量。新增aria-label后删除该Demo旧label豁免，其他豁免不扩宽，Demo数仍999。新增精确Vue模板与类型正负例，声明测试不可将any/unknown当作有效scope。迁移见 [记录](../migrations/mentions-popup-slot.md)。

## 检查结果

| 检查 | 实际结果 |
| --- | --- |
| Mentions/Input/Tooltip 四层 | 29文件487条通过，保留既有jsdom canvas/pseudo-style提示 |
| 类型项目 / 全仓严格类型 | 10文件70条、0 source errors；全仓严格类型通过 |
| UI / L7 / 发布消费者 | UI声明+69份CSS生成；UI L7 11项/0 FAIL/PENDING；实际声明消费者精确单对象VNode作用域、原生Demo、旧函数负例与未知槽拒绝通过，无source alias或测试声明发布 |
| 生产Chrome | Chrome150.0.7871.125通过当前/空/移除、当前默认菜单、editor节点/值/焦点、键盘回填/caret与clear；零Vue/page错误 |
| docs build/test/typecheck/content:check | 四项通过：84路由/999Demo、14文件157条、72组件内容校验，保留既有chunk警告 |
| Registry / inventory / tooling / Biome / diff | Registry19项及vue-native24 fixed/0 open、519行清单校验、8条tooling、Biome13文件与diff通过；新增originNode DTO静态候选不等于缺失组件prop |
| Apollo visual | **未通过：24张missing-approved-baseline**，退出1；未生成或接受基线 |

本批未处理option/notFound等其他内容扩展、default候选协议或其他原生attrs/emits问题，不把单槽迁移当作Mentions或全库F11验收。未运行全仓verify:full/覆盖率，历史completed与视觉维度不升级。无推送或打标签。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/mentions packages/ui/src/input --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-popup.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component mentions
```
