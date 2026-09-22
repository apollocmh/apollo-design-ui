---
category: 数据展示
title: Statistic
subtitle: 统计数值
---

统计数值展示。

## 何时使用

- 当需要突出展示某个数值（统计、余额、倒计时等）时使用。

## 代码演示

见 [`demo/`](./demo)（6 个，与 antd 非 debug demo 一一对应）。

| demo | 内容 |
|---|---|
| `basic` | 基本用法（含 loading 骨架） |
| `unit` | 前缀 / 后缀 |
| `card` | 卡片内使用（Card 组件落地前的等价容器） |
| `animated` | 自定义 formatter（antd 版本用 react-countup） |
| `timer` | `Statistic.Timer` 倒计时 / 正计时 |
| `style-class` | 语义化 classNames / styles（对象与函数形态） |

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 数值 | `number \| string` | `0` |
| title | 标题（prop / `#title` 插槽） | `VNodeChild` | — |
| prefix | 前缀（prop / `#prefix` 插槽） | `VNodeChild` | — |
| suffix | 后缀（prop / `#suffix` 插槽） | `VNodeChild` | — |
| precision | 小数位（负数 ⇒ 无小数） | `number` | — |
| decimalSeparator | 小数分隔符 | `string` | `'.'` |
| groupSeparator | 千分位分隔符 | `string` | `','` |
| formatter | 自定义格式化（只消费函数形态） | `(value, config?) => VNodeChild` | — |
| loading | 骨架屏 | `boolean` | `false` |
| valueStyle | **@deprecated** 请用 `styles.content` | `CSSProperties` | — |
| valueRender | 包裹数值节点 | `(node: VNode) => VNodeChild` | — |
| classNames / styles | 语义槽位（root / header / title / content / value / prefix / suffix），对象或函数 | — | — |
| onMouseenter / onMouseleave | 根元素鼠标事件 | `(e: MouseEvent) => void` | — |

### Statistic.Timer

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 计时方向 | `'countdown' \| 'countup'` | — |
| format | 展示格式（`[...]` 转义，`X+` 按位数补零） | `string` | `'HH:mm:ss'` |
| value | 目标时刻（countdown 为未来、countup 为过去） | `number \| string` | `0` |
| onFinish | 倒计时结束回调（仅 countdown，只触发一次） | `() => void` | — |
| onChange | 每帧回调（入参为时间差） | `(value?) => void` | — |

### Statistic.Countdown

> @deprecated 请使用 `<Statistic.Timer type="countdown" />`。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme（Component Token）

| token | 说明 | 默认值 |
|---|---|---|
| titleFontSize | 标题字号 | `fontSize`（14） |
| contentFontSize | 数值字号 | `fontSizeHeading3`（30） |
