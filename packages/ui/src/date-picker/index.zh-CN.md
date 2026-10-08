---
category: 数据录入
title: DatePicker 日期选择器
titleTemplate: '%s - @apollo-design/ui'
description: 输入或选择日期的控件。
---

# DatePicker 日期选择器

输入或选择日期的控件。

## 何时使用

- 当用户需要输入一个日期，可以点击标准输入框，弹出日期面板进行选择；
- 需要在「日期 / 周 / 月 / 季度 / 年 / 时间」等粒度间切换时，用 `picker` 指定；
- 需要选择一段时间范围时，用 `RangePicker`。

## 引入

```ts
import { DatePicker, RangePicker } from '@apollo-design/ui';
```

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

<!-- TODO(G11 · demo 部分)：antd 的 date-picker 有 30+ 个 demo；本仓当前只有 `basic`。
     其余待与 `@apollo-design/picker` 的面板能力一起补齐。
     ⚠️ **不写不存在的 demo 引用** —— 那会造成坏链，比缺一节更糟。 -->

## API

### 单值 DatePicker

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value（`v-model:value`） | 受控值。`null` 表示「受控且为空」 | `DateType \| DateType[] \| null` | —— |
| defaultValue | 非受控初始值 | 同上 | —— |
| picker | 选择器粒度 | `'time' \| 'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | `'date'` |
| mode | 面板的**当前视图**粒度（受控时需自己处理 `panelChange`） | `'time' \| 'date' \| 'week' \| 'month' \| 'quarter' \| 'year' \| 'decade'` | —— |
| format | 格式。支持字符串 / 数组（多套解析格式）/ 掩码对象 / **函数** | `DatePickerFormat` | 由 `picker` 与语言包推导 |
| showTime | 显示时间选择。`true` 或配置对象（`use12Hours` / `disabledTime` / `hideDisabledOptions` …） | `boolean \| SharedTimeProps` | —— |
| showWeek | 周选择器下显示周数 | `boolean` | —— |
| showToday | 显示「今天」 | `boolean` | `true` |
| showNow | 时间面板显示「此刻」 | `boolean` | `true` |
| open（`v-model:open`） | 受控开合。`undefined` = 非受控 | `boolean` | —— |
| defaultOpen | 非受控初始开合 | `boolean` | `false` |
| needConfirm | 是否要点「确定」才提交。⚠️ **默认值取决于粒度**：`time` / `datetime` 为 `true`，其余 `false` | `boolean` | 见左 |
| multiple | 多选 | `boolean` | `false` |
| order | `multiple` 时按日期排序 | `boolean` | `true` |
| presets | 快捷选项。`value` 支持**函数**（懒求值） | `ValueDate[]` | —— |
| renderExtraFooter | 面板底部的附加内容 | `(mode) => VNodeChild` | —— |
| panelRender | 自定义整个面板 | `(props: { originPanel }) => VNodeChild` | —— |
| cellRender | 自定义单元格 | `(current, info) => VNodeChild` | —— |
| disabledDate | 不可选日期 | `(date, info) => boolean` | —— |
| minDate / maxDate | 可选范围的边界。**支持函数**（「结束的最早值」取决于「开始选了什么」） | `LimitDate` | —— |
| placeholder | 占位符 | `string` | 由语言包给出 |
| locale | 语言包（与 `ConfigProvider` 的 `locale.DatePicker` 深合并） | `PickerLocale` | —— |
| size | 尺寸（未传走 `ConfigProvider`） | `'small' \| 'medium' \| 'middle' \| 'large'` | —— |
| variant | 形态 | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | `'outlined'` |
| status | 校验状态。⚠️ **只加类名，不改 `aria-invalid`** | `'error' \| 'warning'` | —— |
| disabled | 禁用 | `boolean` | `false` |
| inputReadOnly | 输入框只读（禁止键入，只能用面板选） | `boolean` | `false` |
| allowClear | 允许清除。传对象可自定义图标 | `boolean \| { clearIcon }` | `true` |
| suffixIcon | 后缀图标 | `VNodeChild` | 日历图标 |
| prefix | 前缀（可放图标或文字） | `VNodeChild` | —— |
| clearIcon | 清除图标（**deprecated** → `allowClear.clearIcon`） | `VNodeChild` | —— |
| popupClassName | 浮层类名（**deprecated** → `classNames.popup`） | `string` | —— |
| popupStyle | 浮层样式（**deprecated** → `styles.popup`） | `CSSProperties` | —— |
| dropdownClassName | 同 `popupClassName`（**deprecated**） | `string` | —— |
| placement | 浮层落点。未传时按方向取默认（LTR `bottomLeft` / RTL `bottomRight`） | `'bottomLeft' \| 'bottomRight' \| 'topLeft' \| 'topRight'` | —— |
| popupAlign | 浮层的对齐偏移 | `AlignType` | —— |
| builtinPlacements | 自定义落点表 | `Record<string, AlignType>` | 内置四个 |
| getPopupContainer | 浮层挂载容器 | `(node) => HTMLElement` | `document.body` |
| transitionName | 浮层动效名 | `string` | `${rootPrefixCls}-slide-up` |
| required | 原生 `required`（透传 `input[required]` 与 `aria-required`） | `boolean` | —— |
| name / autoComplete / id | 透传到原生 `input` | `string` | —— |
| prefixCls | 类名前缀。⚠️ 默认是 **`apollo-picker`**（不是 `apollo-date-picker`） | `string` | —— |
| class / style | **根节点原生 attrs**（替代上游 `className` / `rootClassName` / `style`） | `string \| array \| object` / `CSSProperties` | —— |
| classNames / styles | 语义化类名 / 样式（**4 个平铺 + 7 个嵌套 `popup`**）。`popup` 允许 **string**（= `popup.root`） | `DatePickerSemanticAllType` | —— |

### 事件

| 事件 | 说明 | 载荷 |
| --- | --- | --- |
| `update:value` | `v-model:value` 通道 | `(date)` |
| `change` | 值变化（与 `update:value` **同时**发） | `(date, dateString)` |
| `calendarChange` | 面板选中过程中每次变化（未提交也发） | `(date, dateString, info)`，`info.range` / `info.from` |
| `ok` | 点「确定」 | `(date)` |
| `openChange` | 浮层开合 | `(open, config?)` |
| `update:open` | `v-model:open` 通道 | `(open)` |
| `pickerValueChange` | 面板浏览值变化 | `(date, info)`，`info.source` 为 `'reset' \| 'panel'` |
| `update:pickerValue` | `v-model:pickerValue` 通道 | `(date)` |
| `panelChange` | 面板粒度变化 | `(value, mode)` |
| `clear` | 点清除按钮 | —— |
| `focus` / `blur` | 焦点进出 | `(event, info)` |
| `invalid` | 键入值非法 | `(invalid)` |
| `submit` | 表单提交 | `(event)` |
| `keydown` | 按键（deprecated `onKeyDown` 的通道） | `(event, preventDefault)` |

### Slots

| 插槽 | 说明 | 参数 |
| --- | --- | --- |
| `panelRender` | 替代 `panelRender` prop | `{ originPanel }` |
| `extraFooter` | 替代 `renderExtraFooter` prop | `{ mode }` |
| `cellRender` | 替代 `cellRender` prop | `{ current, info }` |

### Expose

| 方法 | 说明 | 类型 |
| --- | --- | --- |
| `focus` | 聚焦输入框 | `(options?: FocusOptions) => void` |
| `blur` | 失焦 | `() => void` |
| `nativeElement` | 根节点 | `HTMLDivElement` |

### RangePicker（与单值的差异）

| 参数 | 差异 |
| --- | --- |
| `value` / `defaultValue` | 元组 `[start, end]`。⚠️ **`null` 与 `undefined` 语义不同**：`null` = 「清空该端」，`undefined` = 「尚未选」 |
| `placeholder` | 元组 `[string, string]` |
| `separator` | 两端之间的分隔符。**默认分隔符带 `aria-hidden`；自定义的会去掉它** |
| `allowEmpty` | 允许某一端为空（`boolean` 或两端元组） |
| `disabled` | `boolean` 或两端元组。⚠️ 根类名 `-disabled` 只在**两端都禁**时加 |
| `showTime` | `boolean \| RangeTimeProps`（`disabledTime` 多 `range` / `info` 两个参数） |
| `presets` | `RangeValueDate[]` |
| `onSelect` | **deprecated**，且只在 `picker === 'time'` 时生效 |
| `focus` | 签名不同：`(index?) => void`，可指定聚焦哪一端 |
| `startInput` / `endInput` | 两个原生输入框 |

## Theme

组件级 Token —— **45 个**，全部落成 CSS 变量 `--apollo-date-picker-*`。

> 下表是 `node tests/visual/debug/extract-date-picker-css.mjs --tokens` 的**实测值**
> （antd 6.6.4 默认主题），不是推算。

| Token | 默认值 |
| --- | --- |
| `activeBg` | `#ffffff` |
| `activeBorderColor` | `#1677ff` |
| `activeShadow` | `0 0 0 2px rgba(5,145,255,0.1)` |
| `addonBg` | `rgba(0,0,0,0.02)` |
| `arrowPath` | `path('M 0 8 A 4 4 0 0 0 2.828…')` |
| `arrowPolygon` | `polygon(1.6568542494923806px 100%, 50% 1.6568542494923806px, …)` |
| `arrowShadowWidth` | `8.970562748477143px` |
| `cellActiveWithRangeBg` | `#e6f4ff` |
| `cellBgDisabled` | `rgba(0,0,0,0.04)` |
| `cellHeight` | `24px` |
| `cellHoverBg` | `rgba(0,0,0,0.04)` |
| `cellHoverWithRangeBg` | `#cbe0fd` |
| `cellRangeBorderColor` | `#82b4f9` |
| `cellWidth` | `36px` |
| `errorActiveShadow` | `0 0 0 2px rgba(255,38,5,0.06)` |
| `hoverBg` | `#ffffff` |
| `hoverBorderColor` | `#4096ff` |
| `inputFontSize` | `14px` |
| `inputFontSizeLG` | `16px` |
| `inputFontSizeSM` | `14px` |
| `lineWidthFocus` | `1px` |
| `multipleItemBg` | `rgba(0,0,0,0.06)` |
| `multipleItemBorderColor` | `transparent` |
| `multipleItemBorderColorDisabled` | `transparent` |
| `multipleItemColorDisabled` | `rgba(0,0,0,0.25)` |
| `multipleItemHeight` | `24px` |
| `multipleItemHeightLG` | `32px` |
| `multipleItemHeightSM` | `16px` |
| `multipleSelectorBgDisabled` | `rgba(0,0,0,0.04)` |
| `paddingBlock` | `4px` |
| `paddingBlockLG` | `7px` |
| `paddingBlockSM` | `0px` |
| `paddingInline` | `11px` |
| `paddingInlineLG` | `11px` |
| `paddingInlineSM` | `7px` |
| `presetsMaxWidth` | `200px` |
| `presetsWidth` | `120px` |
| `textHeight` | `40px` |
| `timeCellHeight` | `28px` |
| `timeColumnHeight` | `224px` |
| `timeColumnWidth` | `56px` |
| `warningActiveShadow` | `0 0 0 2px rgba(255,215,5,0.1)` |
| `withoutTimeCellHeight` | `66px` |
| `zIndexPopup` | `1050` |
| `INTERNAL_FIXED_ITEM_MARGIN` | `2px` —— 变量名是 **`--apollo-date-picker-internal_fixed_item_margin`**（带**下划线**） |

> ⚠️ 另有**一个规则内声明**的变量 `--apollo-date-picker-affix-color`（默认 `inherit`，
> 错误 / 警告态被覆盖）—— 它**不在** `prepareComponentToken` 的返回值里，而是写在
> 样式规则内部。详见 `README §4`。

## 设计说明

### 类名前缀与 CSS 变量命名空间**不同名**

默认类名是 **`apollo-picker`**（上游 `getPrefixCls('picker', …)` 传的是**字面量** `'picker'`），
而 CSS 变量是 **`--apollo-date-picker-*`**（由组件名 `DatePicker` 派生）。
两者不同名是**上游行为**，不是笔误 —— 自定义主题时别改错。

### time-picker 与本组件共用一套样式

`ant-picker` 前缀被 date-picker 与 time-picker 共用（上游刻意如此）⇒ 本组件的样式里
含 time-picker 的规则。那是**对的**（同一组件族）。

### 静态 CSS 的一处已知差异

构建期解析出来的常量（padding 算式、`activeShadow` 模板串、`cellHoverWithRangeBg` 的
`lighten(35)` 等）在**静态 CSS** 里被内联成字面值 ⇒ **不随主色变化**
（上游 cssinjs 会在运行时重算）。这是本仓「静态 CSS + CSS 变量」架构的固有差异，
不是 bug；影响面由 L6 的主题矩阵钉住。
