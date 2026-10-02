# TimePicker · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity L
- 依赖组件: date-picker
- foundation: @apollo-design/a11y, @apollo-design/form-core, @apollo-design/locale, @apollo-design/overlay, @apollo-design/picker, @apollo-design/portal, @apollo-design/position, @apollo-design/theme, @apollo-design/utils
- antd 规模: 412 行 / 138 文件 · token 0

### 🚨 本组件的三条特判（G1 实测，详见 `docs/analysis/time-picker.md`）

1. **零自有样式 ⇒ G3 的 `style/token.ts` 与 `style/index.ts` 都不要建**
   （已删掉 gen-component 生成的 `style/`）。`tokenStatus` / `styleStatus` 置 **`n/a`**
   + `layerNotes` 写依据 —— 照 `watermark` 先例（同样 `token/style = n/a` 且无 `style/`）。
   ⚠️ 138 个「文件」里 136 个是 `locale/`（dayjs 语言包），**没有一句样式代码**。
2. 🚨 **上下文键是 `timePicker`，不是 `datePicker`**：内层
   `DatePicker.TimePicker` 的 `pickerType` 由 `displayName === 'TimePicker'` 决定。
   本仓 `DatePicker.vue` / `RangePicker.vue` **硬编码** `useComponentConfig('datePicker')`
   ⇒ 需要一个内部 `InjectionKey` 把键改道（分析 §4.2 的方案 A）。
   ⚠️ 改的是**已 completed 的 `date-picker`** ⇒ 必须单独跑它的 7 层回归。
3. 🚨 **告警矩阵不对称**（实测表见分析 §2.4）：`popupClassName` / `popupStyle` / `bordered`
   在**单个** `TimePicker` 上**不发**告警（外层解构掉了），在 `TimePicker.RangePicker` 上**发**。
   ⇒ 单个要「吞掉」、范围要「原样透传」。**这条只能靠探针发现，类型上看不出来。**

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE —— 产出 **docs/analysis/time-picker.md**（+ 探针 `tests/visual/debug/probe-time-picker-antd.mjs`）
- [x] G2 API DESIGN —— interface.ts 枚举 props/emits/slots/expose；v-model 取代 value+onChange
- [x] G3 TOKEN —— **n/a**（零 Component Token / 零样式，见上「特判 1」）
- [x] G4 IMPLEMENT —— TimePicker.vue + TimeRangePicker.vue + index.ts；**无 style/index.ts**
      （+ `_internal/picker-host-context.ts` 的注入改道；`date-picker` 回归 434/434 绿）
- [x] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts **22/22**（接线 / 告警矩阵 / 上下文路由 / 默认形态）
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4/L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（token/style 为 n/a + layerNotes）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:time-picker]

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
