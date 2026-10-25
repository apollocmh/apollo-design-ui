# Mentions 标准键盘与组合输入控制键（2026-10-25）

新增6条修前全失败，日志 `/tmp/apollo-mentions-keyboard-red.log`：key-only方向/Enter/关闭失效、控制键keyup重搜、which覆盖标准key，以及IME组合中的方向键/Enter被候选状态机消费。最后一组独立覆盖两种键，避免先失败方向键遮住Enter证据。

改用标准KeyboardEvent.key，去掉KeyCode依赖和数字分支。keydown先向公开监听器发送原始事件，isComposing期间跳过候选控制；keyup控制键不重测/重搜。保留跳过disabled、silent/loading、回填当前值、光标和单次选择。既有6处which-only人工事件逐项改用标准key，原断言保留；理由与迁移见 [记录](../migrations/mentions-keyboard.md)。不是为绿灯删除回归。

没有改变input更新、组合文本搜索策略、DOM或静态CSS；本批不代表完整IME、其他内容槽或视觉验收。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 新增及既有选中/键盘回归 | 修前新增6全失败，修后两文件35条通过，原断言保留 |
| Mentions/Input/Tooltip 四层 | 33文件512条通过，保留既有jsdom canvas/pseudo-style提示 |
| UI / 类型消费者 | 最终UI严格vue-tsc声明及69份CSS生成；真实dist消费者通过，含新键盘模板；公开类型形状未改，未重复独立类型项目/独立lint:types命令 |
| Chrome | Chrome150.0.7871.125：which=0标准键、冲突键码、IME合成控制键、禁用跳过、关闭/keyup/光标/稳定编辑器通过；此前原生事件脚本通过，零Vue/page错误。真实OS输入法未由合成事件替代 |
| Registry / inventory | Registry19项、vue-native24 fixed/0 open、519行清单校验通过；历史状态不升级 |
| L7 | 11项/0 FAIL/PENDING |
| Biome / diff | 6文件及diff通过 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |

本批未改DOM/CSS，未重复上一阶段缺24张approved baseline的只读视觉检查，未生成/接受基线。未执行全仓verify:full/覆盖率，未推送或打标签。


```sh
pnpm exec vitest run --project unit packages/ui/src/mentions/__tests__/native-keyboard.test.ts packages/ui/src/mentions/__tests__/index.test.ts --maxWorkers=1
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-keyboard.mjs
node tests/browser/mentions-native-events.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
```
