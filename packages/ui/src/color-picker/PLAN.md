# ColorPicker · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo**（G4 未完成，**不要**提前置 in_progress —— 那会让 `next-task` 之外的工具误判）
- priority P5 · complexity L
- 依赖组件: divider, popover
- foundation: @apollo-design/form-core, @apollo-design/overlay, @apollo-design/portal, @apollo-design/position, @apollo-design/theme, @apollo-design/utils
- antd 规模: 2148 行 / 54 文件 · token 0

## 进度快照（2026-10-02 第二轮）

| Gate | 状态 | 证据 |
|---|---|---|
| G0 CLAIM | ✅ | `next-task.mjs` 授权（唯一权威） |
| G1 ANALYZE | ✅ | `docs/analysis/color-picker.md`（561 行）+ §7 第二轮实测（+91 行） |
| G2 API DESIGN | ✅ | `interface.ts`（props/emits/slots/expose 全量）；`lint:types` 0 错 |
| G3 TOKEN | ✅ | `style/token.ts`（9 条派生）+ `style/index.ts`（92 条规则，前缀参数化）；**L7 21/21 绿** |
| G3.5 引擎纯逻辑 | ✅ | `engine/{interface,color,util}.ts` + `color.ts` + `util.ts`；**L1 25/25 绿** |
| G4 IMPLEMENT | ⬜ **下一步** | 见下方「G4 的硬约束」 |
| G5–G14 | ⬜ | — |

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE —— 产出 `docs/analysis/color-picker.md`（先于实现）
- [x] G2 API DESIGN —— interface.ts 枚举 props/emits/slots/expose；v-model 取代 value+onChange
- [x] G3 TOKEN —— style/token.ts 对齐 antd 的 9 个 mergeToken 派生（规则 R7）
- [ ] G4 IMPLEMENT —— 见「G4 的硬约束」
- [ ] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts`（纯逻辑部分已落在 `color.test.ts`）
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare（⚠️ 先 `pnpm build:ui`）
- [ ] G10 L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（16 个用户可见 demo）
- [ ] G12 REGISTRY —— 11 维度置 done + `tests/compat/fixtures/color-picker/`（E9）
- [ ] G13 BUILD —— `verify:full` 四道全绿 + `test:visual` + `test:types` 显式跑
- [ ] G14 COMMIT —— commit message 带 [COMP:color-picker]

## 🚨 G4 的硬约束（先读这个再动手）

1. **`ColorSlider` 不能用 `handleRender`** —— 本仓 `Slider` **不消费**
   `sliderInternalContextKey`（`slider/README.md:25-26` 登记为 INTENDED/C8），
   它用 **scoped slot `#handle` / `#activeHandle`** 替代。
   ⇒ 要复刻的三件事（渐变点底色 / `-slider-handle-active` 类名 / `onFocus`+`onKeyDown` 拦截）
   必须走插槽；**且要单独验插槽能否覆盖 `onFocus`/`onKeyDown`**。
   详见 `docs/analysis/color-picker.md` §7.2 与 `PITFALLS.md` 319。
   ✅ 另一条通道 **可用**：`unstableSliderContextKey` 确实被 `Slider.vue:346` inject
   ⇒ 渐变条的 `onDragStart` / `onDragChange` 由 ColorSlider 自己 `provide`。

2. **没有 `ContextIsolator`**（上游用它屏蔽 Form status）。本仓**不引入等价物** ——
   面板侧没有任何子件读 `useFormItemInputContext`，行为等价（PLATFORM）。见 §7.3。

3. **`Segmented` 的 `onChange` 走 `attrs`**（不是 prop、不在 emits 里），
   与 `update:value` 同时发。

4. **引擎几何算法已抽成纯函数**（`engine/util.ts` 的 `calculateColor` / `calcOffset`）——
   拖拽 hook 只负责读真实矩形。**不要**把它们再内联回 hook（L1 会失去全部覆盖）。

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
10. **改完文件回读** —— Edit 偶发报 success 但内容未变（本轮**又踩一次**：
    同一文件的两处 Edit 只落了后一处）；biome 会重排 import。
    ⇒ 同一文件多处机械替换一律用脚本 + 断言「恰好命中 N 次」，改完 grep 复核。
11. 🚨 **JSDoc 里禁止出现 `/*`** —— 它里面的 `*/` 会提前闭合块注释，
    症状是**行号漂移**的一串无关语法错（PITFALLS 314，本轮又踩一次：
    `engine/color.ts` 的 `if (!input) { /* 保持初始值 */ }`）。
12. **继承「方法返回自身类型」的基类时必须覆写该方法**（PITFALLS 320）。
13. **E10 的 `box-shadow` 正则不认 `inset` 前缀**（PITFALLS 322）。
