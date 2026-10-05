---
category: 数据展示
title: Calendar
subtitle: 日历
---

按照日历形式展示数据的容器。

## 何时使用

- 当数据是日期或按照日期组织时；
- 需要在一个「整月」的尺度上浏览、选择日期时。

> 🚨 **类名前缀是 `apollo-picker-calendar`**（上游 `getPrefixCls('picker')`），
> 而 **CSS 变量是 `--apollo-calendar-*`** —— **类名与变量名的命名空间不同**。
> ⚠️ 但 `prefixCls` 作为 **prop** 传时它会**整体覆盖**（传 `'apollo'` ⇒ 根类是
> `apollo-calendar`），因为 `getPrefixCls(suffix, customize)` 里 `customize` 优先。

## 代码演示

见 [`demo/`](./demo)（**8 个**）。⚠️ 与 antd 的差距见 `README.md` §5
（`lunar` / `component-token` 两个未移植）。

## API

### Calendar

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 展示日期（`v-model:value`） | `CalendarDate` | —— |
| defaultValue | 非受控初值 | `CalendarDate` | —— |
| mode | 日历模式（`v-model:mode`） | `'year' \| 'month'` | `'month'` |
| fullscreen | 全屏（`false` ⇒ 迷你日历） | `boolean` | `true` |
| showWeek | 显示周号列 | `boolean` | `false` |
| validRange | 可选范围（**闭区间**，端点不禁用） | `[CalendarDate, CalendarDate]` | —— |
| disabledDate | 额外的禁用判定 | `(date: CalendarDate) => boolean` | —— |
| headerRender | 自定义 header（**函数 prop**） | `(config) => VNodeChild` | —— |
| cellRender | 自定义格子**内容** | `(date, info) => VNodeChild` | —— |
| fullCellRender | 自定义**整个**格子 | `(date, info) => VNodeChild` | —— |
| locale | 语言包（与 `ConfigProvider` 的 `locale.Calendar` 深合并） | `PickerLocale` | —— |
| classNames | 语义化类名（6 槽，支持**函数形态**） | `CalendarSemanticValue<…>` | —— |
| styles | 语义化样式（同上） | `CalendarSemanticValue<…>` | —— |
| prefixCls | 自定义前缀类名 | `string` | `apollo-picker` |
| class / style | **根节点原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | —— |
| style | 根节点内联样式 | `CSSProperties` | —— |
| dateFullCellRender | **@deprecated** 用 `fullCellRender` | `(date) => VNodeChild` | —— |
| dateCellRender | **@deprecated** 用 `cellRender` | `(date) => VNodeChild` | —— |
| monthFullCellRender | **@deprecated** 用 `fullCellRender` | `(date) => VNodeChild` | —— |
| monthCellRender | **@deprecated** 用 `cellRender` | `(date) => VNodeChild` | —— |

> ⚠️ **4 个废弃 prop 的判据是 `!== undefined`**（Vue 的 `props` 恒含所有声明过的键，
> 照抄上游的 `in props` 会**恒告警**）。
> ⚠️ **`value` 与 `defaultValue` 都不传时取 `getNow()`（「今天」）** ——
> 这会让截图/断言随运行日变化 ⇒ **用例必须显式传 `value`**。
> ⚠️ 上游 Calendar 的根节点**没有 `{...restProps}`**（实测 `generateCalendar.js` 里
> `restProps` 出现 **0** 次）⇒ `id` / `data-*` / `aria-*` **不会**落到根元素上。
> 本仓照此（但 Vue 的 `class` / `style` 会显式并入，因为 React 那边它们是 prop）。

### 事件

| 事件 | 说明 | 载荷 |
|---|---|---|
| `change` | 选中的日期变化 | `(date: CalendarDate)` |
| `update:value` | `v-model:value` | `(date: CalendarDate)` |
| `panelChange` | 面板粒度或浏览值变化 | `(date: CalendarDate, mode: CalendarMode)` |
| `update:mode` | `v-model:mode` | `(mode: CalendarMode)` |
| `select` | 每次选中（含 `headerRender` 里自调的 `onChange`） | `(date: CalendarDate, info: { source })` |

> 🚨 **顺序即语义**（`triggerChange`）：与当前值**同一天则 `change` / `panelChange` 都不发**；
> 跨月（`panelMode==='date'`）或跨年（`panelMode==='month'`）才**补发** `panelChange`。
> ⚠️ `update:mode` **只在模式真的变了**时发 —— `panelChange` 会因「日期跨月/跨年」多发一次。
> ⚠️ `select` 的 `source` 在**面板那一支**是 **`panelMode`**（`'date'` \| `'month'`），
> 不是字面量 `'date'`。

### 插槽

| 插槽 | 说明 |
|---|---|
| `headerRender` | `headerRender` 的插槽形态（`config` 与函数 prop 同形） |
| `cellRender` | `cellRender` 的插槽形态（`{ current, info }`） |
| `fullCellRender` | `fullCellRender` 的插槽形态（`{ current, info }`） |

### expose

| 字段 | 说明 |
|---|---|
| `nativeElement` | 根 DOM（`<div class="apollo-picker-calendar …">`） |

> ⚠️ 上游 `CalendarRef` **只有** `nativeElement`（没有 `focus` / `blur` —— 那是
> `DatePicker` 的 `PickerRef` 才有）⇒ 本仓**不补**。

## 主题

**6 个 Component Token**（`fullBg` / `fullPanelBg` / `itemActiveBg` /
`yearControlWidth` / `monthControlWidth` / `miniContentHeight`），
但 `prepareComponentToken` 里 `...initPanelComponentToken(token)` 带进 **21** 个面板 token
⇒ 实测 **27 条** `--apollo-calendar-*` 声明。

⚠️ 若要通过 `ConfigProvider` 定制，用 **`calendar`** 那一份（**不是** `datePicker`）：

```vue
<ConfigProvider :components="{ calendar: { classNames: { root: 'my-root' } } }">
  <Calendar />
</ConfigProvider>
```

⚠️ **`styles` / `classNames` 支持函数形态**（`(info: { props }) => 对象`）；
`info.props.fullscreen` 是**解析后**的值（未传 ⇒ `true`），而 `info.props.mode`
保持**原始 prop**（未传 ⇒ `undefined`）—— 与上游 `{...props, mode, fullscreen, showWeek}` 同判。
