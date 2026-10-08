---
title: InputNumber 数字输入框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# InputNumber 数字输入框

通过鼠标或键盘，输入范围内的数值。

:::

## 代码演示

::: v-pre

**basic**：数字输入框，通过鼠标或键盘输入范围内的数值。

:::

<DemoPreview component="input-number" demo="basic" />

::: v-pre

**digit**：`string-mode` 开启字符值模式（`change` 返回 string）；`step` 支持小数。

:::

<DemoPreview component="input-number" demo="digit" />

::: v-pre

**disabled**：点击按钮切换可用状态。

:::

<DemoPreview component="input-number" demo="disabled" />

::: v-pre

**formatter**：通过 `formatter` 格式化展示，`parser` 解析回数值。

:::

<DemoPreview component="input-number" demo="formatter" />

::: v-pre

**keyboard**：使用 `keyboard={false}` 禁用键盘上下键行为。

:::

<DemoPreview component="input-number" demo="keyboard" />

::: v-pre

**out-of-range**：受控模式下 `value` 可以超出 `min` / `max`，超出时以错误色展示（不回弹）。

:::

<DemoPreview component="input-number" demo="out-of-range" />

::: v-pre

**presuffix**：通过 `prefix` / `suffix` 添加前缀与后缀。

:::

<DemoPreview component="input-number" demo="presuffix" />

::: v-pre

**size**：三种大小的数字输入框，`size` 分别为 `large`、`medium`、`small`。

:::

<DemoPreview component="input-number" demo="size" />

::: v-pre

**spinner**：`mode="spinner"` 切换为拨轮形态（上下按钮在两侧）。

:::

<DemoPreview component="input-number" demo="spinner" />

::: v-pre

**status**：使用 `status` 设置校验状态（`error` / `warning`）。

:::

<DemoPreview component="input-number" demo="status" />

::: v-pre

**style-class**：`classNames` / `styles` 支持按语义结构（root / input / actions 等）定制。

:::

<DemoPreview component="input-number" demo="style-class" />

::: v-pre

**variant**：四种形态变体：`outlined` / `filled` / `borderless` / `underlined`。

:::

<DemoPreview component="input-number" demo="variant" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前值（`v-model:value`） | number \| string | - |
| defaultValue | 初始值 | number \| string | - |
| min | 最小值 | number \| string | - |
| max | 最大值 | number \| string | - |
| step | 每次改变步数，可以为小数 | number \| string | `1` |
| precision | 数值精度，配置 `formatter` 时会以 `formatter` 为准 | number | - |
| formatter | 指定输入框展示值的格式 | function(value, info: { userTyping, input }): string | - |
| parser | 指定从 `formatter` 里转换回数字的方式 | function(string): string | - |
| disabled | 禁用 | boolean | `false` |
| readOnly | 只读 | boolean | `false` |
| keyboard | 是否启用键盘快捷行为 | boolean | `true` |
| controls | 是否显示增减按钮，也可设置自定义箭头图标 | boolean \| { upIcon, downIcon } | `true` |
| mode | 展示输入框或拨轮 | `'input'` \| `'spinner'` | `'input'` |
| stringMode | 字符值模式，开启后支持高精度小数 | boolean | `false` |
| changeOnBlur | 失焦时是否触发 `change`（把超界值回正） | boolean | `true` |
| changeOnWheel | 聚焦时允许滚轮步进 | boolean | `false` |
| decimalSeparator | 小数点 | string | - |
| placeholder | 占位符 | string | - |
| prefix | 前缀 | VNodeChild | - |
| suffix | 后缀 | VNodeChild | - |
| size | 输入框大小 | `large` \| `medium` \| `small` | - |
| status | 设置校验状态 | `'error'` \| `'warning'` | - |
| variant | 形态变体 | `outlined` \| `borderless` \| `filled` \| `underlined` | `outlined` |
| autoFocus | 自动聚焦 | boolean | `false` |
| classNames | 语义化 class（root/prefix/suffix/input/actions，支持函数） | - | - |
| styles | 语义化 style（同上，支持函数） | - | - |
| ~~bordered~~ | **Deprecated** 使用 `variant` 替代 | boolean | `true` |
| ~~addonBefore~~ | **Deprecated** 使用 `Space.Compact` 替代 | VNodeChild | - |
| ~~addonAfter~~ | **Deprecated** 使用 `Space.Compact` 替代 | VNodeChild | - |

### 事件

| 事件 | 说明 | 回调参数 |
| --- | --- | --- |
| change | 变化回调（`v-model:value` 同步发出） | function(value: number \| string \| null) |
| press-enter | 按下回车的回调 | function(e: KeyboardEvent) |
| step | 点击上下箭头、键盘、滚轮的回调 | function(value: number, info: { offset, type: 'up' \| 'down', emitter: 'handler' \| 'keyboard' \| 'wheel' }) |

### Ref

| 名称 | 说明 |
| --- | --- |
| focus(option) | 获取焦点；`option.cursor` 为 `'start'` \| `'end'` \| `'all'` |
| blur() | 移除焦点 |
| nativeElement | 根 DOM 元素 |

## 注意事项

- 受控模式下 `value` 可以超出 `min` / `max`（以错误样式展示，不回弹）；用户交互产生的值会被钳制回范围内。
- 键入过程中不做 precision 格式化与范围钳制，失焦或回车时统一回正（上游双状态机语义）。
- `parser` 未提供时，中文句号 `。` 会被自动替换为小数点。

:::
