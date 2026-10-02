# List · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity M
- 依赖组件: config-provider, grid, pagination, spin
- foundation: @apollo-design/locale, @apollo-design/theme, @apollo-design/utils, @apollo-design/virtual-list
- antd 规模: 678 行 / 8 文件 · token 11

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工（2026-10-02）
- [x] G1 ANALYZE —— `docs/analysis/list.md` 已落地（产物 **62 条** `ant-list` 规则，可复现命令在文档 §3）
- [x] G2 API DESIGN —— `interface.ts`（⚠️ 内容类 prop 保持 `VNodeChild`，与 card 一致；D111 字面不一致已登记）
- [x] G3 TOKEN —— `style/token.ts`（**11** 个 Component Token + 2 个 `mergeToken` 派生 + 2 个必须保留 `calc()` 的量）
- [x] G4 IMPLEMENT —— `List.vue` / `Item.vue` / `ItemMeta.vue` + `context.ts` + `style/index.ts`（**57 条**规则 = 产物 56 + `-container` 声明块）
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts` **32/32**
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4/L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:list]

## 本组件已确认的判据（G1 实测，比模板清单更具体）

- 🚨 **`List` 整体 deprecated**（antd 6.6.4）⇒ 保留同款 `console.error`，**每次渲染都发**
  （不是「传了某 prop 才发」）。先例：dropdown 的 `DropdownButton`（D91）。
- 🚨 **css-var 声明块覆盖两个根**：`.apollo-list` + `.apollo-list-container`
  （上游 `extraCssVarPrefixCls`）—— D95 家族判据。
- 🚨 **`-action` 是死选择器**（真类名 `-item-action`）⇒ 逐字保留（radio U7/U8 同类）。
- 🚨 **`-spin-nested-loading` 也是死选择器**（产物第 42 条写的是 `.ant-list-spin-nested-loading`，
  真类名是 `.ant-spin-nested-loading`）⇒ 逐字保留。**共两条死选择器。**
- 🚨 **`Item` 的 `-item-no-flex` 判据**：上游是 `toArray(children).some(isString) && length > 1`，
  但 Vue 侧**拿不到原始字符串**（模板编译成 Text vnode、`toArray` 也归一化）
  ⇒ 本仓用 **`isTextVNode`**（平台差异，见 `Item.vue` 的注释与 README §2）。
- 🚨 **`split` 默认 `true`** ⇒ 必须 `withDefaults(defineProps(), { split: true })`
  （漏了它默认渲染就没有 `-split` 类）。⚠️ `withDefaults` 是**编译器宏，不能 import**。
- 🚨 `h(Row, props, 数组)` 会被 Vue 判成「Non-function value encountered for default slot」
  ⇒ 组件 children 一律写成**显式插槽函数**（元素不受影响）。
- 🚨 **两条 media 的冒号后空格不同**：`(max-width:768px)` vs `(max-width: 576px)` —— 逐字保留。
- 🚨 `Item` 的 `-item-no-flex` 判据是**两个条件同时成立**：`some(isString) && length > 1`。
- 🚨 `Element = grid ? 'div' : 'li'`；grid 时 `ref` 落 `Col`、否则落 `li`。
- 🚨 `paginationContent` 在 top/bottom **两处**使用 ⇒ Vue 侧必须**每次新建 vnode**。
- 🚨 `innerCornerBorderRadius` / `-item-action-split` 的 height 必须保留 **`calc()`**（不能预计算）。


## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
