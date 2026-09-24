# Input 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/input/`（Input/TextArea/Password/Group）+ `@rc-component/input@1.3.1`
  （只读参照，H2/H5）
- 分析产物：`docs/analysis/input.md`（G1，先于实现存在）
- **引擎自建**（`engine/`，registry 登记的 in-ui 替换落点）：
  - `engine/BaseInput.ts` —— 三层包裹（affix-wrapper / group-wrapper > group >
    group-addon）、allowClear 清空按钮（`useAllowClear`）
  - `engine/Input.ts` —— IME 组合态闸门（组合中不裁剪不钳制，compositionend
    统一 flush）、Enter 的 isComposing 保护、focus/blur/setSelectionRange
  - `engine/TextArea.ts` —— autoSize 量测（calculate-node-height）、showCount 的
    data-count、resize-dirty（issue 51594）
  - `engine/use-count.ts` —— useCount / useCountDisplay / useCountExceed 三件套
  - `engine/common-utils.ts` —— resolveOnChange / triggerFocus / fixControlledValue
- 样式：`genInputStyle()` 与 antd `extractStyle` 产物**逐条对拍**
  （201 条规则，覆盖 Input/TextArea/Password/Group 家族）

## 2. 本轮范围

Input / TextArea / Input.Password / Input.Group。**`Input.Search` 与 `Input.OTP`
顺延**（analysis §7），`_InternalPanelDoNotUseOrYouWillBeFired` 不适用（input 无
Pure 面板）。

## 3. 与 antd 的差异清单

| # | 差异 | 分类 |
|---|---|---|
| I1 | `value+onChange` ⇒ `v-model:value` + `onChange` 双通道（规则 C11） | INTENDED |
| I2 | `ref` ⇒ `expose({ focus, blur, setSelectionRange, select, input, nativeElement })` | INTENDED |
| I3 | `prefix` / `suffix` / `clearIcon` / `iconRender` ⇒ `VNodeChild`（D42 归一化） | PLATFORM |
| I4 | Search / OTP 缺口（见 analysis §7） | INTENDED |
| U13 | input 无内置关联 label（可访问名由 placeholder/使用方提供；上游 a11y 测试同判） | UPSTREAM |

## 4. 已知取舍

- 18 个 Component Token 中 padding/shadow 系为**构建期解析值**（D46/D50 同判）；
  别名色（addonBg/activeBorderColor 等）走 `var(--apollo-*)` 随主题自适应。
- 组件变量声明块覆盖**三种根形态**（input / affix-wrapper / group-wrapper）——
  antd 用 `useCSSVarCls` 给每个根挂 `-css-var` 类，本仓等价展开（CHECKLIST #77）。
- `Input.Group` 恒定告警（非条件）；`visibilityToggle` 默认 `true`（antd 同值，
  注意 Vue 的 Boolean prop 未传时转 false，必须显式 default）。
