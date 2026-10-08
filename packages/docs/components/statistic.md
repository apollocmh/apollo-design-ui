---
title: Statistic 统计数值
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

统计数值展示。

## 何时使用

- 当需要突出展示某个数值（统计、余额、倒计时等）时使用。

:::

## 代码演示

::: v-pre

**animated**：通过自定义 `formatter` 展示格式化后的数值（antd 版本使用 react-countup 做数字滚动）。

:::

<DemoPreview component="statistic" demo="animated" />

::: v-pre

**basic**：简单展示数值。

:::

<DemoPreview component="statistic" demo="basic" />

::: v-pre

**card**：在卡片内展示统计数值。

:::

<DemoPreview component="statistic" demo="card" />

::: v-pre

**style-class**：`classNames` / `styles` 支持对象与函数两种形态。

:::

<DemoPreview component="statistic" demo="style-class" />

::: v-pre

**timer**：通过 `Statistic.Timer` 展示倒计时或正计时。

:::

<DemoPreview component="statistic" demo="timer" />

::: v-pre

**unit**：通过 `prefix` / `suffix` 设置前后缀。

:::

<DemoPreview component="statistic" demo="unit" />

::: v-pre

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

:::
