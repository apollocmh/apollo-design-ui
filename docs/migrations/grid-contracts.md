# Grid / Row / Col 契约修正

适用于当前 `0.0.0` 开发版本。Row、Col、useBreakpoint 的导出名及已有合法布局参数保留。本轮修复错误实现，不引入 React 兼容层、弃用期或新的业务模型。

## 根 attrs 与当前 Provider

根 class/style 继续使用 Vue 原生 attrs。此前字符串 style 被当作 CSSProperties 展开，浏览器抛 `property '0'`，SSR 输出 `0:w;1:i…`；仅 attrs 更新还可能被 computed 缓存。现在字符串、对象和数组均通过 Vue normalizeStyle，在 render 中读取并正确替换/移除。

```vue
<Row style="width: 100%" :gutter="[10.5, 7.5]">
  <Col :span="12" :style="['min-height: 40px', { paddingBlock: '4px' }]">正文</Col>
</Row>
```

已声明的 `ConfigProvider.components.row/col.className/style` 现在实际消费，并随配置出现、替换和移除更新。Row 优先级为 gutter → Provider → 原生 style；Col 为 gutter/flex → Provider → 原生 style → 响应式 flex 变量。CSS span/flex 仍决定实际使用宽度，不能把原生 width 与 flex-basis/max-width 混为同一布局值。

Provider direction 实时更新 rtl 类和默认原生 dir。显式 `dir="ltr"`、`dir="rtl"`、`dir="auto"` 或 CSS direction 可覆盖默认；模板 `:dir="undefined"` 使用当前 Provider 默认值。根仍为同一个 div，`GridRef.nativeElement` 指向它。布局/主题更新保留原生编辑状态与焦点；`span=0` 隐藏焦点内容时保留浏览器正常移焦行为。

## 完整 gutter 类型

此前 Gutter 递归地允许无意义的嵌套数组，却不能声明纵轴断点对象。类型现在精确对应已能消费的两轴值：

```ts
const gutter: Gutter = [{ xs: 0, md: 10.5 }, { xs: '0.5rem', md: 7.5 }];
```

每轴是 number/string 或断点对象。`[[8, 16], 24]` 不是合法布局，现由类型负例阻止；当前仓库没有这类真实调用者。GridSlot 也明确返回完整 Vue VNodeChild，默认槽无作用域参数。

## 已有效的交互与样式

- align=stretch 现在有显式静态规则，覆盖环境基础对齐。
- Row wrap=false 的 min-width:0 收缩规则同时覆盖基础和响应式 flex，配置移除后清除。
- 13 个真实 Demo 的色块改用主题背景/文字变量，修复四主题浏览器对比度红灯。gutter 展示独立二轴断点/分数；playground 仍用原生 range，新增零和分数选项并保留默认 16px/6 列。

## 共享断点观察器

不同 Provider 原来共用首个订阅者的查询表，最后一个退订者又可能按另一张表清理，导致串用断点与 listener 遗留。现在相同查询集合共享一个观察器，不同集合独立；每个订阅独立释放，重复释放不影响其他订阅者。当前 screen Token 替换会重新观察，普通颜色 Token 更新不重建媒体监听器。useBreakpoint 原有 getter 暂停/恢复、SSR 默认值和挂载后订阅契约保持。

静态 Col media query 的默认阈值没有改变：sm=576、md=768、lg=992、xl=1200、xxl=1600、xxxl=1920。运行时 screen Token 改动影响 Hook/Row，不重写静态 CSS。Col xs 是基础样式；Hook/Row 的 xs 只匹配 ≤575px。Row 的断点对象没有匹配项时不设置值，不自动把 xs 当作跨所有视口的 fallback。

SSR 无屏幕时仍使用确定的 gutter 最大已定义档；justify/align 无响应式首帧命中，挂载后校正。此次不引入媒体查询 CSS 运行时。

## 验证与剩余边界

修前原生契约 6 红/2 绿、类型 2 红、共享观察器原生 Teleport 3 红、实际 Demo 12 个主题/视口组合对比度红灯均保留在 Grid evidence。最初 VTU teleport-stub 将 Probe 重挂，产生的观察器 2 红/1 绿原始记录也保留，不能作为动态断点已正常的证据。

源码命令：

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/grid --maxWorkers=1
pnpm exec vitest run --project unit packages/ui/src/grid packages/ui/src/descriptions packages/ui/src/steps packages/ui/src/avatar packages/ui/src/list packages/ui/src/pagination packages/ui/src/masonry --maxWorkers=1
pnpm exec vue-tsc --noEmit -p tests/browser/fixtures/GridTypes.tsconfig.json
GRID_SOURCE=1 node tests/browser/grid-contracts.mjs
GRID_SOURCE=1 node tests/browser/grid-demos.mjs
```

主线程冻结构建并通知 dist-ready 后执行发布 JS+CSS 浏览器、发布类型/SSR、Docs 与正式 Apollo 视觉；此前不读取陈旧 dist 伪称发布通过。

```sh
node tests/consumer/grid-types.mjs
node tests/consumer/grid-ssr.mjs
GRID_SOURCE=0 node tests/browser/grid-contracts.mjs
GRID_SOURCE=0 node tests/browser/grid-demos.mjs
```

完整清单、实际结果与阶段限制见 [审计报告](../audit/2026-10-28-grid-contract-audit.md)。
