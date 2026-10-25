# Mentions 核心 Vue 事件（2026-10-25）

修前4条回归全失败，另有2条未处理异常：裸/clear两种形态一次原生input各产生两次model更新；原生DOM change/select提前耗尽语义.once；监听器数组进入Function prop手调后抛TypeError。日志 `/tmp/apollo-mentions-core-events-red.log`。RcTextArea本来已经将input归一为内部onChange，Mentions额外onInput是双发根因，旧React补偿注释不能作为保留证据。

移除重复input通道；公开change/select/search改为带明确载荷的typed emits，不再声明Function prop或手调；保留标准Vue onXxx监听器注册。两个旧:on-search示例改@search。载荷及v-model名称保持，原生DOM事件不混入语义事件，支持.once、监听器数组和当前替换。filterOption/validateSearch等有返回值业务函数保留。迁移边界见 [记录](../migrations/mentions-core-events.md)。

回归同时验证一次input只更新一次、原生input仍到达textarea、两次候选选择和实时search、真实模板.once载荷及动态监听器。公开$emit类型正反例和Vue模板精确推断覆盖字符串/option/prefix；独立发布消费者检查实际dist声明。生产Chrome夹具使用包入口，不用源码alias。

## 检查

| 检查 | 结果 |
| --- | --- |
| 修复回归 | 修前4失败/2未处理异常；修后4通过 |
| Mentions/Input/Tooltip 四层 | 31文件499条通过，保留既有jsdom canvas/pseudo-style提示 |
| Mentions/Input 类型 | 12文件72条通过，无类型错误；全仓严格类型检查通过 |
| UI/L7 | 声明及69份CSS生成；11项、0 FAIL/PENDING，保留既有unbuild提示 |
| 发布消费者 | 无源码alias，真实dist声明、精确模板核心事件类型、StyleValue和popup scope通过；监听器数组用Vue v-on对象注册 |
| 生产浏览器 | Chrome150.0.7871.125：单次input/model/change、DOM隔离、once、数组/替换、搜索与两次选择通过；旧popup/样式脚本通过，零Vue/page错误 |
| Registry / inventory / tooling / Biome | Registry19项、vue-native24 fixed/0 open、519行清单校验、8条tooling、Biome8文件通过 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |

focus/blur、clear、pressEnter、resize、popupScroll和键盘事件尚未由本批关闭。Apollo视觉24张missing-approved-baseline（退出1），没有生成或接受基线。历史completed/视觉状态不升级；未执行全仓verify:full/覆盖率。未推送或打标签。


```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/mentions packages/ui/src/input --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-events.mjs
node tests/browser/mentions-popup.mjs
node tests/browser/mentions-bindings.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component mentions
```
