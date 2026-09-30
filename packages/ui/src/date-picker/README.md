# DatePicker 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/date-picker/`（只读参照，H2）
- 面板层**不在本组件**：由 foundation 包 `@apollo-design/picker` 提供
  （裁决 `picker-panel-ownership` = B）。本组件只做**输入框 + 浮层容器 + 状态类 + 语义槽**。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 | 依据 |
|---|---|---|---|
| 1 | locale 缺 `fieldXxxFormat` 时：上游 `.map(c => c.format)` 在 `undefined.format` 上**抛 TypeError**；本仓 `toArray(null\|undefined)` ⇒ `[]`，得到 `formatList: []` / `firstFormat: undefined`，**降级不抛** | **INTENDED** | rc `miscUtil.toArray` 是 `Array.isArray(v) ? v : [v]`；本仓 `@apollo-design/picker` 的 `toArray` 明确「`null`/`undefined` ⇒ `[]`」。L1 有一条用例钉住 |
| 2 | 范围的两端输入框：上游把 `-input` 拼在 `Input` 组件内部（调用处只传 `-input-start`）；本仓没有独立的 `Input` 组件，直接拼成 `-input -input-active? -input-start\|-end` | **PLATFORM** | 结果与 SSR 实测一致（`ant-picker-input ant-picker-input-start`）；上游结构见 `Input.js:64,344` |
| 3 | 构建期常量（padding 算式 / `lighten` 结果 / `28*8`）在静态 CSS 里**内联成字面值**，不随主色或主题变化（上游 cssinjs 运行时重算） | **PLATFORM** | 本仓「静态 CSS + CSS 变量」架构的固有差异，非 bug；影响面由 L6 的 dark / compact / token-override 矩阵钉住 |
| 4 | `DatePicker.generatePicker(customGenerateConfig)` **不实现**（本仓只支持 dayjs） | **INTENDED** | G2 的决策；`interface.ts` 里已写明 |

## 3. .vue / .tsx 选择

<!-- 默认 .vue。若用 .tsx，在此写明理由（COMPONENT-RULES.md §2 的三条件之一）。 -->
<!-- G4 决定。 -->

## 4. Component Token 清单

registry 数据：该组件 `tokenCount = 3` —— 即**它自己声明的**三个用户面 token
（`presetsWidth` / `presetsMaxWidth` / `zIndexPopup`）。完整面是三处继承 + 3 自有：

| 来源 | 键数 | 内容 |
|---|---|---|
| 自有 | 3 | `presetsWidth`(120) · `presetsMaxWidth`(200) · `zIndexPopup`(`zIndexPopupBase + 50` = 1050) |
| `input` 的 `initComponentToken` | **18** | `lineWidthFocus` + `paddingBlock/SM/LG` + `paddingInline/SM/LG` + `addonBg` + `activeBorderColor` / `hoverBorderColor` + 3 个 `activeShadow` + `hoverBg` / `activeBg` + `inputFontSize/LG/SM` |
| `initPanelComponentToken` | 21 | 12 自有（`cell*` / `time*` / `cellWidth` / `textHeight` / `withoutTimeCellHeight`）+ 8 个 `MultipleSelectorToken`（与 Select 同源）+ 1 内部量 |
| `getArrowToken` | 3 | `arrowShadowWidth` / `arrowPath` / `arrowPolygon` |
| **合计（对象键数）** | **45** | 其中 `INTERNAL_FIXED_ITEM_MARGIN` **不落变量** ⇒ **44 个变量** |
| 内部 token `initPickerPanelToken` | 10 | 不落变量，G4 会内联进规则（判定值由 theme.test 钉住） |

⚠️ 产物里还有一个 **`--ant-date-picker-affix-color`** —— 它**不在** `prepareComponentToken`
的返回值里，而是被声明在 **`.ant-picker` 规则内部**（状态变体用）：
```css
.ant-picker                  { --ant-date-picker-affix-color: inherit; }
.ant-picker-status-error     { --ant-date-picker-affix-color: var(--ant-color-error-affix); }
.ant-picker-status-warning   { --ant-date-picker-affix-color: var(--ant-color-warning-affix); }
```
⇒ 所以「对象 45 键 / 变量 45 个」是**巧合**，含义不同，别当交叉验证。

取证 / 判定值：`node tests/visual/debug/extract-date-picker-css.mjs --tokens`（45 个变量全打印）；
断言：`__tests__/theme.test.ts`（22 条）。

⚠️ **`cellHoverWithRangeBg` / `cellRangeBorderColor` 用的是 `Color#lighten`，
不是 `_internal/color-composite.ts` 的 `onBackground`** —— 两个是不同的颜色运算
（后者是「半透明前景合成到背景」，tour / input-number / slider 用）。
实测逐位一致：`lighten(35)` → `#cbe0fd`、`lighten(20)` → `#82b4f9`

⚠️ **`note`**：本组里的构建期常量（padding 算式、`lighten` 结果、`28*8`）
在静态 CSS 里会被**内联成字面值** ⇒ **不随主色 / 主题变化**。
这是本仓「静态 CSS + CSS 变量」架构的**已知固有差异**（上游 cssinjs 会在运行时重算），
不是 bug；影响面由 L6 的 dark / compact / token-override 矩阵钉住。
<!-- G3 补齐：presetsWidth / presetsMaxWidth / zIndexPopup 三个自有 token，
     另并入 input（SharedComponentToken 去掉 addonBg）、select（MultipleSelectorToken）、
     roundedArrow（ArrowToken）三处继承面。默认值推导见 docs/analysis/date-picker.md §7。 -->

## 5. 已知缺口

### 5.1 输入框内核 —— 已裁决「完整对齐」（2026-09-30）

rc 的 `lib/PickerInput` 是 **37 个 `.js` / 4290 行**、且**绑 React**
（`useState` + `useEvent`），而 `picker` foundation 只 Vue 化了**面板**。
⇒ **输入框的解析 / 掩码 / 键盘字段导航 / 分段（`-input-active`）** 必须自研。

| 选项 | 内容 | 代价 |
|---|---|---|
| **A. 完整重写** | 逐块对齐 `PickerInput`；`inputReadOnly` / `preserveInvalidOnBlur` / `previewValue` / `format.type: 'mask'` / 键入解析 全部落地 | 最大；但 11 维度可全 `done`、无缺口 |
| **B. 核心 + 明确缺口** | 值 / 开合 / 面板 / 格式化 / 约束 / 状态 / 语义槽 全落地；键入解析与掩码标 `DEFERRED` | 缺口**可枚举、可测** |

**用户裁决 = A（完整对齐，分阶段落地）**，登记在 `registry/source/open-decisions.mjs` 的
`date-picker-input-kernel`。⇒ 本组件**不留**输入框相关的 `DEFERRED`；
键入解析 / 掩码 / 键盘字段导航 / 分段 全部要落地（分 S1–S5 五阶段，见 `PLAN.md`）。

### 5.2 已知的跨包欠账（类型面已按上游写全，实现面待补）

1. 🚨 **`format` 的函数形态**：上游 `FormatType<DateType> = string | CustomFormat<DateType>`，
   即 `format` 可以是 `(value) => string`（`DatePicker.test.tsx` 有
   `showTime should work correctly when format is custom function` 为证）。
   本仓 `@apollo-design/picker` 的 `PickerFormat` 目前**无泛型**、只到 `{ format: string }`
   ⇒ 要**跨包**加回 `DateType` 泛型 + `CustomFormat<DateType>`（PITFALLS 214）。
   `interface.ts` 的 `CustomFormat` 已按上游声明，避免「类型说支持、实现不做」。
2. `DatePicker.generatePicker(customGenerateConfig)` **不实现**（本仓只支持 dayjs）—— INTENDED。

### 5.3 G1 阶段实测出来的、G4 必须处理的坑

1. **`value` / `defaultValue` 必须是 dayjs 实例**：传 ISO 字符串会在 rc 的 `isValidate`
   抛 `getUDayjs(…).isValid is not a function`（写 SSR 探针时直接踩到）。
2. **L4 必须「挂载后」取证**：`open: true` 的 SSR 只有 **889 B**，与不传 `open`
   **字节相同**（浮层走 Portal）。面板侧的契约继续挂在 `picker` 的 37 条 rc 基线上。
3. **`allowClear={false}` 在无值时 SSR 字节不变** ⇒ L4 的 allowClear 用例**必须给值**。
4. **`status="error"` 不改 `input[aria-invalid]`**（仍是 `"false"`），只加类名。
5. **自定义 `separator` 会去掉 `aria-hidden`**（默认分隔符带 `aria-hidden`）——
   上游有两条专门测试（`hides the default separator from the accessibility tree` /
   `preserves a custom separator accessible name`），必须进 L5。
6. **`prefixCls` 传下去会变成 `apollo-picker`**（上游 `getPrefixCls('picker', …)` 传的是
   字面量 `'picker'`）⇒ 面板类名整体换前缀，基线要按「类名替换后的同构」比对。
