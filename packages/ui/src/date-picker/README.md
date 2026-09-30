# DatePicker 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/date-picker/`（只读参照，H2）
- 面板层**不在本组件**：由 foundation 包 `@apollo-design/picker` 提供
  （裁决 `picker-panel-ownership` = B）。本组件只做**输入框 + 浮层容器 + 状态类 + 语义槽**。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->
<!-- G4 起逐条登记。 -->

## 3. .vue / .tsx 选择

<!-- 默认 .vue。若用 .tsx，在此写明理由（COMPONENT-RULES.md §2 的三条件之一）。 -->
<!-- G4 决定。 -->

## 4. Component Token 清单

<!-- registry 数据：token 数 = 3 -->
<!-- G3 补齐：presetsWidth / presetsMaxWidth / zIndexPopup 三个自有 token，
     另并入 input（SharedComponentToken 去掉 addonBg）、select（MultipleSelectorToken）、
     roundedArrow（ArrowToken）三处继承面。默认值推导见 docs/analysis/date-picker.md §7。 -->

## 5. 已知缺口

### 5.1 G4 前必须先裁决的架构分叉（未裁决）

rc 的 `lib/PickerInput` 是 **37 个 `.js` / 4290 行**、且**绑 React**
（`useState` + `useEvent`），而 `picker` foundation 只 Vue 化了**面板**。
⇒ **输入框的解析 / 掩码 / 键盘字段导航 / 分段（`-input-active`）** 必须自研。

| 选项 | 内容 | 代价 |
|---|---|---|
| **A. 完整重写** | 逐块对齐 `PickerInput`；`inputReadOnly` / `preserveInvalidOnBlur` / `previewValue` / `format.type: 'mask'` / 键入解析 全部落地 | 最大；但 11 维度可全 `done`、无缺口 |
| **B. 核心 + 明确缺口** | 值 / 开合 / 面板 / 格式化 / 约束 / 状态 / 语义槽 全落地；键入解析与掩码标 `DEFERRED` | 缺口**可枚举、可测** |

判据：`cascader` 带着 1 条 `DEFERRED` 仍判 `completed`，但那条是**样式集成**；
**键入解析是主交互**，量级不同 ⇒ 按 `AGENTS.md` §7，**这条要用户拍板**（尚未裁决）。

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
