---
title: TimePicker 时间选择框
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

输入或选择时间的控件。

## 何时使用

- 当用户需要输入一个时间，可以点击标准输入框，弹出时间面板进行选择；
- 需要选择一段时间时用 `TimeRangePicker`。

> ⚠️ **本组件是 `DatePicker` 的薄壳** —— 类名前缀与 DOM 全部来自 `date-picker`
> （`apollo-picker`），本组件**没有自己的样式表**，也没有 Component Token。
> 它与 `DatePicker` 的唯一区别是**读的是 `ConfigProvider` 的 `timePicker` 配置**
> （不是 `datePicker`）。

:::

## 代码演示

::: v-pre

**addon**：通过 `renderExtraFooter` 在面板底部添加额外内容（`addon` 已废弃）。

:::

<DemoPreview component="time-picker" demo="addon" />

::: v-pre

**basic**：点击 `TimePicker`，然后可以在浮层中选择或者输入某一时间。

:::

<DemoPreview component="time-picker" demo="basic" />

::: v-pre

**change-on-scroll**：滚动时间列即改变值（`changeOnScroll`），配合 `needConfirm={false}` 立即提交。

:::

<DemoPreview component="time-picker" demo="change-on-scroll" />

::: v-pre

**colored-popup**：通过 `classNames.popup.root` 给浮层根加类名。

:::

<DemoPreview component="time-picker" demo="colored-popup" />

::: v-pre

**disabled**：禁用状态。

:::

<DemoPreview component="time-picker" demo="disabled" />

::: v-pre

**hide-column**：用 `format` 控制显示哪几列（`HH:mm` ⇒ 只有时与分）。

:::

<DemoPreview component="time-picker" demo="hide-column" />

::: v-pre

**need-confirm**：`needConfirm` ⇒ 需要点「确定」才提交。

:::

<DemoPreview component="time-picker" demo="need-confirm" />

::: v-pre

**range-picker**：`TimeRangePicker` 选择一段时间。

:::

<DemoPreview component="time-picker" demo="range-picker" />

::: v-pre

**size**：三种尺寸：`large` / 默认 / `small`。

:::

<DemoPreview component="time-picker" demo="size" />

::: v-pre

**status**：`status` 标记校验状态（`error` / `warning`），单值与范围都支持。

:::

<DemoPreview component="time-picker" demo="status" />

::: v-pre

**style-class**：通过 `classNames` 与 `styles` 自定义[语义化结构](#semantic-dom)样式；`styles` 支持对象与函数两种形态。

:::

<DemoPreview component="time-picker" demo="style-class" />

::: v-pre

**suffix**：`suffixIcon` 与 `prefix` 自定义前后缀；范围版也支持 `prefix`。

:::

<DemoPreview component="time-picker" demo="suffix" />

::: v-pre

**value**：受控用法：`v-model:value`。

:::

<DemoPreview component="time-picker" demo="value" />

::: v-pre

**variant**：四种视觉变体：`outlined`（默认）/ `filled` / `borderless` / `underlined`。

:::

<DemoPreview component="time-picker" demo="variant" />

::: v-pre

## API

### TimePicker

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 当前值（`v-model:value`） | `TimePickerValue` | —— |
| defaultValue | 非受控初值 | `TimePickerValue` | —— |
| open | 浮层是否打开（`v-model:open`） | `boolean` | —— |
| defaultOpen | 非受控的初始开合 | `boolean` | —— |
| format | 展示格式（如 `HH:mm:ss`；`HH:mm` ⇒ 只显示两列） | `DatePickerFormat` | `HH:mm:ss` |
| renderExtraFooter | 面板底部的额外内容 | `() => VNodeChild` | —— |
| needConfirm | 需要点「确定」才提交 | `boolean` | `false` |
| changeOnScroll | 滚动时间列即改变值 | `boolean` | `false` |
| disabled | 禁用 | `boolean` | `false` |
| size | 尺寸 | `'small' \| 'middle' \| 'large'` | —— |
| status | 校验状态 | `'error' \| 'warning'` | —— |
| variant | 视觉变体 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| allowClear | 是否显示清除按钮 | `boolean \| { clearIcon?: VNodeChild }` | `true` |
| prefix | 前缀内容 | `VNodeChild` | —— |
| suffixIcon | 后缀图标（默认时钟；`null` / `false` 不渲染） | `VNodeChild` | —— |
| placeholder | 输入框占位符 | `string` | `'Select time'` |
| locale | 语言包（与 `ConfigProvider` 深合并） | `PickerLocale` | —— |
| classNames | 语义化类名（4 平铺 + `popup` 嵌套；支持**函数形态**） | `TimePickerSemanticValue<…>` | —— |
| styles | 语义化样式（同上） | `TimePickerSemanticValue<…>` | —— |
| className / rootClassName / style | 根节点附加类名与样式 | —— | —— |
| getPopupContainer | 自定义浮层容器 | `(node: HTMLElement) => HTMLElement` | —— |

#### ⚠️ 已废弃

| 参数 | 替代 |
|---|---|
| `addon` | `renderExtraFooter`（⚠️ 单个 TimePicker 上**会**发废弃告警） |
| `popupClassName` | `classNames.popup.root`（⚠️ 单个上**不发**、范围版**发**告警） |
| `popupStyle` | `styles.popup.root`（同上） |
| `bordered` | `variant`（⚠️ 单个上**不发**、范围版**发**告警） |
| `onSelect` | `onCalendarChange`（⚠️ 两处**都发**） |
| `dropdownClassName` | `classNames.popup.root`（⚠️ 两处**都发**） |

> 🚨 **这张表的「发不发告警」是实测出来的**（`tests/visual/debug/probe-time-picker-antd.mjs`）——
> 三个 prop 的 `.d.ts` 都标着 `@deprecated`，**从类型完全看不出谁真发**。

### TimeRangePicker

与 `TimePicker` 基本一致，另外：

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| placeholder | 两端的占位符 | `[string, string]` | —— |
| separator | 两端之间的分隔符（默认 `SwapRightOutlined`） | `VNodeChild` | —— |
| disabled | 两端的禁用（单个布尔 = 两端同值） | `boolean \| [boolean, boolean]` | —— |
| allowEmpty | 是否允许某一端为空 | `boolean \| [boolean, boolean]` | —— |

⚠️ 范围版**没有** `addon`；`picker` / `showTime` 在两侧都被剔除。

### 事件

| 事件 | 说明 | 参数 |
|---|---|---|
| `change` | 值变化 | `(value, dateString)` |
| `update:value` | `v-model:value` | `(value)` |
| `calendarChange` | 选中过程中每次变化都发 | `(value, dateString, info)` |
| `ok` | 点「确定」 | `(value)` |
| `openChange` / `update:open` | 浮层开合 | `(open, config?)` |
| `clear` | 点清除按钮 | —— |
| `focus` / `blur` | 焦点 | `(event, info)` |
| `panelChange` / `pickerValueChange` | 面板粒度 / 浏览值 | 见 `interface.ts` |

### 插槽

与 `DatePicker` 同一套（本仓扩展，上游只有函数 prop）：
`prefix` / `suffixIcon` / `clearIcon` / `separator` / `panelRender` / `extraFooter` /
`cellRender` / `tagRender` / `presetRender`。

### 静态成员

- `TimeRangePicker` —— 等价于上游的 `TimePicker.RangePicker`；
- `TimePickerWithRange` —— `Object.assign` 出来的别名（`TimePicker.RangePicker` 类型可见）。

## 主题

**本组件没有 Component Token**（`es/time-picker/` 里没有一句样式代码）⇒
所有观感来自 `date-picker` 的 `-picker-*` 样式与全局 Token。
若要通过 `ConfigProvider` 定制，用 **`timePicker`** 那一份（**不是** `datePicker`）：

```vue
<ConfigProvider :components="{ timePicker: { classNames: { root: 'my-root' } } }">
  <TimePicker />
</ConfigProvider>
```

> ⚠️ `timePicker` 的语义槽会被**合并两次**（外层一次 + 内层一次）⇒ 类名重复出现。
> 这是**上游同判**的行为，不是 bug。

:::
