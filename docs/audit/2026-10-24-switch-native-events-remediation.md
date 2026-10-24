# F09 / D02 · Switch 原生事件整改（2026-10-24）

## 决策与实施

按用户要求及 ADR 0007，直接移除 React 结果值回调：click 现在只发送原生 MouseEvent，状态仍由 change / update:checked / update:value 表达。不增加旧载荷兼容层或弃用期；完整写法见 [迁移记录](../migrations/switch-native-events.md)。

click 声明 typed emit，移除 callbacks 的未知对象断言与手调 attrs；Vue 负责数组监听器、once 与监听器替换。keydown 使用现有 DOM 合并 helper 与内部监听器合并，不再手工挑选某个回调或覆盖 Vue 模板监听器。方向键直接读标准 event.key 并阻止滚动，不合成 click；Space/Enter 保留 button 原生激活，避免重复切换。

同批复现根 style 的字符串展开缺陷，改用 Vue normalizeStyle，支持字符串/对象/数组并保留语义样式优先级及无样式时不生成空属性。更新公开类型、双语文档、实际 Vue 类型夹具、浏览器调用方、历史基线生成器的说明；保留 DOM 基线与既有有效断言。

disabled 的真实交互和 button.click() 由浏览器抑制。显式 dispatchEvent 仍收到原生 click，但不改状态、不发送 change/update；不把人工派发行为误称为真实用户可点击。

## 复现与验证

新增 native-events.test.ts，在已提交旧实现上五条全失败，并捕获两条真实运行错误（布尔首参调用 stopPropagation、数组被当函数）。日志 `/tmp/apollo-switch-native-red.log`。修复后五条全通过。原有测试中“布尔结果 click”依据 ADR 0007 更新为原生单参，方向键夹具改为标准 key；保留 disabled/受控/非受控/变更次数断言，补充真实浏览器的原生激活覆盖。

环境 Node 22.22.2 / pnpm 12.4.2：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/switch/ packages/ui/src/input-number/ --maxWorkers=1` | 16 文件 221 条通过，包含原有 DOM/axe/主题回归 |
| `pnpm run lint:types` / scoped types project | 通过；4 文件36条类型测试，无类型错误，含拒绝旧双参回调与实际模板推断 |
| `pnpm run build:ui` / UI L7 产物检查 | 声明及69份组件CSS生成；L7 11项通过，0 FAIL/PENDING；保留 unbuild 既有产物探测警告 |
| `node tests/browser/switch-events.mjs` / `node tests/browser/vue-reactivity.mjs` | Chrome150.0.7871.125 原生修饰符/capture/once/currentTarget、方向键、受控/非受控Space/Enter单次激活与disabled通过；F02/F04/F08/F07/F09/F05/F10/H03全部通过，零browser/Vue错误 |
| `node tests/consumer/switch-types.mjs` | 独立临时目录消费实际 dist 声明通过，无源码 alias；原生事件推断/修饰符/语义change正确，测试夹具不进入产物 |
| 文档 test / typecheck / build / content:check | 14文件157条、类型检查、client/server SSG84路由与72组件内容校验通过；994 Demo；既有大chunk警告保留 |
| Registry / inventory / tooling / scoped Biome / diff | Registry19项与vue-native24 fixed/0 open、501行清单一致性、8条tooling、12文件Biome和diff检查通过；Vue夹具由vue-tsc/浏览器验证 |
| `node tests/visual/apollo.mjs --check --component switch` | **未通过：15 张 missing-approved-baseline**；未接受新图或修改阈值 |

D02 实现迁移完成，F09 此处的事件载荷冲突已修正。全库其他原生事件/回调边界仍需按实际用例复审；F11、D04 等不因此关闭。Registry 只追加当前证据，不把历史 React 视觉状态升级为 Apollo 新验收；未宣称执行全仓 verify:full 或覆盖率。
