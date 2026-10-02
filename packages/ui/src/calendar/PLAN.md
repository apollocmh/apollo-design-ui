# Calendar · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity L
- 依赖组件: radio, select
- foundation: @apollo-design/form-core, @apollo-design/locale, @apollo-design/picker, @apollo-design/theme, @apollo-design/utils
- antd 规模: 761 行 / 146 文件 · token 6

### 🚨 本组件的三条特判（G1 实测，详见 `docs/analysis/calendar.md`）

1. 🚨 **样式与 `date-picker` 的面板样式强耦合**（**G4 的硬前提**）：
   上游 `genCalendarStyles` 把 **`genPanelStyle(token)` 整个 spread 进 `[calendarCls]`**
   ⇒ 产物里 date-picker 的面板规则被**整套重作用域到 `.ant-picker-calendar` 之下**
   （实测 164 个选择器）。本仓 `date-picker/style` **未导出** `genPanelStyle` 等价物，
   而 `DATE_PICKER_RULES` 是 **257 条**、触发与面板**混在一起**（勘误：先前写 254 是凭记忆）。
   ⇒ 走**方案 A**：拆成 `TRIGGER_RULES` + `PANEL_RULES`（按产物判据拆，并断言
   「两者集合 == 原 257 条」），calendar 把 `PANEL_RULES` 换前缀复用。
   ✅ **已落地（2026-10-02）**：判据 = 两侧产物取交集（见
   `tests/visual/debug/classify-date-picker-rules.mjs`）⇒ **TRIGGER 174 + PANEL 83**；
   面板块在产物里连续（第 43–125 条）⇒ 三段拼回，`DATE_PICKER_RULES` **逐字节不变**。
   ⚠️ 改的是**已 completed 的 `date-picker`** ⇒ 必须单独跑它的 7 层回归。
2. **类名前缀是 `apollo-picker-calendar`**（`prefixCls = getPrefixCls('picker')`），
   **不是** `apollo-calendar`；面板规则也复用 `-picker-*` 那一套。
   ⚠️ 但 CSS 变量名是 **`--apollo-calendar-*`**（`genStyleHooks('Calendar')` 的命名空间）
   —— **类名与变量名的命名空间不同**，这是最容易写错的一处。
3. **没有浮层**（面板是内联的 `PickerPanel hideHeader`）⇒ SSR 能拿到全量 DOM/CSS
   （与 date-picker 相反，**不需要** `PurePanel` 绕 Portal 的手法）。

## Gate 检查单

- [ ] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [ ] G1 ANALYZE —— 读 /tmp/antd-src/package/es/calendar/ 的 .d.ts + demo + 测试，产出 **docs/analysis/calendar.md**（先于实现！）
- [x] G2 API DESIGN —— `interface.ts`：`CalendarProps`（含 4 个废弃）/ `CalendarEmits`（C11 双发，
      `update:value`+`change`、`update:mode`+`panelChange`、`select`）/ `CalendarSlots`（3 个
      函数 prop 的插槽等价物）/ `CalendarExpose`（**只有** `nativeElement`，照上游不补 focus/blur）
- [x] G3 TOKEN —— `style/token.ts`：6 自有 + `...initPanelComponentToken` ⇒ **27** 条声明；
      5 个 `mergeToken` 派生里 3 个进 CSS（`CALENDAR_DERIVED` 固化表达式）。
      🚨 本轮把 **27 误读成 26**（探针正则漏 `_` ⇒ PITFALLS 229 重演）
- [ ] G4 IMPLEMENT —— `style/index.ts` **已落地**（31 条自有规则 + 83 条面板规则，
      产物 83/83 逐条一致；**前缀参数化**，与 card/alert/breadcrumb 同判）
      ⏳ `Calendar.vue` + `components/CalendarHeader.ts` **未开始**（G5 的前置）
- [ ] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4/L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:calendar]

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
