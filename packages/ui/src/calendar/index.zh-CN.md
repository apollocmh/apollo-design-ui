---
category: 数据展示
title: Calendar
subtitle: 日历
---

在内联的月历或年度月份面板中展示与选择日期。

## 示例

[`demo/`](./demo) 保留九个示例，包含原生表头/单元格插槽与当前组件 Token。

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 已接收日期，支持 `v-model:value` | `CalendarDate`（Dayjs） | — |
| defaultValue | 非受控初值；后续修改不重置当前状态 | `CalendarDate` | 今天 |
| mode | 已接收模式，支持 `v-model:mode` | `'month' \| 'year'` | `'month'` |
| fullscreen | 全屏日历；false 为卡片尺寸 | `boolean` | `true` |
| showWeek | 显示周号 | `boolean` | `false` |
| validRange | 可选日期闭区间，端点可选 | `[CalendarDate, CalendarDate]` | — |
| disabledDate | 额外禁用判定，与范围越界取“或” | `(date: CalendarDate) => boolean` | — |
| locale | 与当前 `ConfigProvider.locale.Calendar` 深合并 | `PickerLocale` | 当前语言 |
| classNames | 六个语义目标；对象或读取当前 props 的函数 | `CalendarSemanticValue<CalendarSemanticClassNames, CalendarProps>` | — |
| styles | 六个语义目标；对象或读取当前 props 的函数 | `CalendarSemanticValue<CalendarSemanticStyles, CalendarProps>` | — |
| prefixCls | 面板类名前缀 | `string` | 当前根前缀 + `-picker` |

原生 class、Vue 全部 style 形态、id、ARIA/data 属性、tabindex 和普通 DOM 监听器落在实际根 div。原生 style 在主题、Provider 与本地语义样式之后合并。组件所属通知由 Vue emits 消费。

受控模型只发更新提议。被父级拒绝的提议不会写入隐藏本地状态；撤控保留最后实际接收的值/模式。默认值仅在非受控初始化时使用。

### 插槽

| 插槽 | 作用域 | 行为 |
|---|---|---|
| `headerRender` | `{ value, type, onChange, onTypeChange }`（`CalendarHeaderRenderConfig`） | 替换表头。两个命令通过 Calendar 正常链路请求日期/模式更新。 |
| `cellRender` | `{ current, info }`（`CalendarCellSlotProps`） | 默认日期/月份标签下方的内容。 |
| `fullCellRender` | `{ current, info }`（`CalendarCellSlotProps`） | 替换包含标签的完整单元格；优先于 cellRender。 |

`current` 是 Dayjs 日期；`info` 复用 PickerPanel 的 `CalendarCellRenderInfo`，包含 type、locale、originNode。插槽在渲染时读取，条件增删即时生效；数组、文本、0 与显式空内容保留 Vue 原义。

```vue
<Calendar v-model:value="date" v-model:mode="mode">
  <template #headerRender="{ value, type, onChange, onTypeChange }">
    <button @click="onChange(value.add(1, 'month'))">下个月</button>
    <button @click="onTypeChange(type === 'month' ? 'year' : 'month')">{{ type }}</button>
  </template>
  <template #cellRender="{ current }">{{ events[current.format('YYYY-MM-DD')] }}</template>
</Calendar>
```

迁移：headerRender、cellRender、fullCellRender 内容 prop 以及四个旧 date/month 内容 prop 已移除，直接使用同名具名槽；日期/月内容用 info.type 区分。不保留回调兜底或弃用通道。disabledDate 继续承担真实判定服务。

### 事件

| 事件 | 载荷 |
|---|---|
| `update:value` | `(date: CalendarDate)` |
| `change` | `(date: CalendarDate)` |
| `update:mode` | `(mode: CalendarMode)` |
| `panelChange` | `(date: CalendarDate, mode: CalendarMode)` |
| `select` | `(date: CalendarDate, info: { source: 'date' \| 'month' \| 'year' \| 'customize' })` |

日期请求依次发 update:value、跨月（月模式）或跨年（年模式）时的 panelChange、change、select。同一天只发 select。模式请求仅在不同值时发 update:mode，随后发带当前日期的 panelChange。面板的 select source 为 date 或 month；自定义表头日期命令为 customize。

### Ref

`nativeElement: HTMLDivElement | null` 返回实际根，卸载后为 null。不提供额外 focus/blur 命令；内部面板与控件保留自身原生键盘/焦点行为。

## 配置与主题

语义目标为 root、header、body、content、item、itemContent。后四个传递给 PickerPanel，itemContent 也作用于 Calendar 默认内容容器。函数读取当前公开 props；fullscreen 已解析默认 true，mode 保留原始 prop。返回 undefined 表示本次不贡献覆盖。

`ConfigProvider.components.calendar` 提供展示默认配置；`ConfigProvider.theme.components.Calendar` 提供六个组件 Token。替换和撤除均更新现有实例。

| Token | 类型 | 默认值 |
|---|---|---|
| fullBg | string | colorBgContainer |
| fullPanelBg | string | colorBgContainer |
| itemActiveBg | string | controlItemBgActive |
| yearControlWidth | number 或 CSS 长度字符串 | 80 |
| monthControlWidth | number 或 CSS 长度字符串 | 70 |
| miniContentHeight | number 或 CSS 长度字符串 | 256 |

数字长度转换为 px，包含 0。继续使用静态 CSS 与既有 21 个共享面板变量；类名与变量命名空间不同（apollo-picker-calendar 与 --apollo-calendar-*）。自定义类名前缀需配套生成对应样式。
