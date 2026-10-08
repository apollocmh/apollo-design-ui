---
title: Masonry 瀑布流
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

瀑布流布局：条目按「当前最矮的一列」依次落位，高度**实测**而非预设。

## 何时使用

- 内容高度参差不齐，但希望整体视觉上「填满」容器（图片墙、卡片流、商品列表）。
- 需要按断点控制列数与间距。

:::

## 代码演示

::: v-pre

**basic**：瀑布流布局：条目按「当前最矮的一列」依次落位。
⚠️ antd 的 demo 用 `Card` 渲染条目，本仓 Card 尚未落地 ⇒ 用**原生 div + 等价内联样式**替换。

:::

<DemoPreview component="masonry" demo="basic" />

::: v-pre

**dynamic**：增删条目；`onLayoutChange` 把算出来的列号写回 `items`，写回后条目就「钉」在该列。
⚠️ 与 antd 的 demo 有两处**有意**差异：① 新增条目的高度用确定值
（上游用 `Math.random()`，每次渲染都不同 ⇒ demo 冒烟测试不可复现）；
② `Card` / `CloseOutlined` 用原生 div / 文本 `×` 替换（本仓 Card 尚未落地）。

:::

<DemoPreview component="masonry" demo="dynamic" />

::: v-pre

**fresh**：条目内容高度会变时用 `fresh` —— 它给**每个条目**各挂一个 `ResizeObserver`，
点一下就重新量测并重排。
⚠️ `fresh` **不改变 DOM 结构**（观察器不产节点，上游的 `ResizeObserver` 是 `cloneElement`）。
与 antd 的 demo 的差异：高度用确定值而不是 `Math.random()`。

:::

<DemoPreview component="masonry" demo="fresh" />

::: v-pre

**image**：条目是图片。图片**加载后**才有真实高度 ⇒ 需要重新量测。
⚠️ 上游把 `onLoad` / `onError` 挂在根 `div` 上，但那条路径**实际是死代码**
（React 把 `load` 当非委托事件直接绑在该元素、冒泡阶段，而 `load` 不冒泡 ⇒
子 `<img>` 的事件到不了根 `div`）。本仓**照抄同样的绑定**，行为与 antd 一致。
需要「内容尺寸变化就重排」时请用 `fresh`。

:::

<DemoPreview component="masonry" demo="image" />

::: v-pre

**responsive**：列数与间距都支持按断点配置 —— 命中规则是「从大到小取第一个已配置的断点」。

:::

<DemoPreview component="masonry" demo="responsive" />

::: v-pre

**style-class**：`classNames` / `styles` 两个语义槽都支持**对象**与**函数**两种形态；
函数形态的入参 `props.columns` 是**解析后的列数**（不是原始 prop）。
⚠️ 与 antd 的 demo 的差异：上游用 `antd-style` 的 `createStaticStyles` 生成类名，
本仓没有这个依赖 ⇒ 用普通类名替换；`Flex` / `Divider` / `Typography` 换成原生元素。
**缺口登记在 `README.md` §7。**

:::

<DemoPreview component="masonry" demo="style-class" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| items | 数据源。每项 `{ key, data, column?, height?, children? }` | `MasonryItemType<T>[]` | — | × |
| itemRender | 单项渲染。**优先级低于** `item.children` | `(info: MasonryItemRenderInfo<T>) => VNodeChild` | — | × |
| columns | 列数。对象形态按断点解析（从大到小取第一个已配置的断点；都没命中 ⇒ `columns.xs ?? 1`） | `number \| Partial<Record<Breakpoint, number>>` | `3` | × |
| gutter | 间距。复用 Grid 的 `Gutter`（数字 / 字符串 / 断点对象 / `[水平, 纵向]`） | `Gutter` | `0` | × |
| fresh | 为**每个条目**各挂一个 `ResizeObserver`（内容高度会变时用）。⚠️ **不改变 DOM 结构** | `boolean` | `false` | × |
| onLayoutChange | 布局顺序变化时触发。载荷是 **`{...item, column}`**（item 本体被展开） | `(sortInfo: MasonryLayoutItem<T>[]) => void` | — | × |
| classNames | 语义化类名（`root` / `item`），支持函数形态 | `MasonrySemanticClassNames \| ((info) => …)` | — | ✅（`masonry.classNames`） |
| styles | 语义化样式（`root` / `item`），支持函数形态 | `MasonrySemanticStyles \| ((info) => …)` | — | ✅（`masonry.styles`） |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-masonry` | × |
| class / style | **根元素原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | — | × |
| style | 根元素内联样式。**会覆盖算出来的容器高度** | `CSSProperties` | — | × |

#### MasonryItemType

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| key | 唯一标识（数字会内部 `String()` 化） | `string \| number` | — |
| data | 业务数据，原样透传给 `itemRender` | `T` | — |
| column | 指定落在第几列（0 基）。超界会夹到最后一列 | `number` | 自动选最矮列 |
| height | ⚠️ **上游声明了但从不读** —— 高度一律实测 | `number` | — |
| children | 内容。**优先于** `itemRender` | `VNodeChild` | — |

### Events

| 名称 | 说明 | 参数 |
|---|---|---|
| layoutChange | 布局顺序变化（= `onLayoutChange`，两者**同时**发出） | `(sortInfo: MasonryLayoutItem<T>[])` |

### Ref

| 名称 | 类型 | 说明 |
|---|---|---|
| nativeElement | `() => HTMLDivElement \| null` | 根元素（对应 antd 的 forwardRef ref） |

### Slots

**没有插槽** —— 上游从不读 `children`，内容一律走 `items` + `itemRender` / `item.children`。

## Theme

### Component Token

Masonry **没有 Component Token**（与 antd 逐字一致：`ComponentToken` 是空接口）。
它只消费全局 alias：

| token | 用在哪 |
|---|---|
| `motionDurationSlow` | 条目淡入（`-fade-appear`）与位置过渡 |
| `motionDurationFast` | 条目淡出（`-fade-leave`） |
| `motionEaseOut` | 上述三条的缓动 |

## 设计说明

- **排布算法**：按 `items` 顺序，每项落到**当前累计高度最小**的那一列（平局取**最左**）；
  容器高度 = 最高列 − 一个纵向间距。详见 `hooks/positions.ts` 的文件头（含三处易错点）。
- **高度是实测的**：`item.height` 从不被读；首帧量测在 commit 之后（复刻上游 `useEffect` 的时机）。
- **`onLoad` / `onError` 是死监听**：上游把它挂在根 `div` 上，但 React 的 `load` 是非委托事件、
  绑在该元素且**冒泡**阶段，而 `load` 不冒泡 ⇒ 子 `<img>` 的事件到不了根。本仓**照抄同样的绑定**
  （行为与 antd 一致）。需要「内容尺寸变化就重排」时请用 `fresh`。
- **本组件零 ARIA**：容器与条目都是普通 `div`（无 `role`、无 `tabindex`）——
  语义完全由 `itemRender` 的内容负责。这是上游的**有意**设计，已由 L5 钉住。
- **不透传 attrs**：上游不展开 `...restProps` ⇒ 本仓设了 `inheritAttrs: false`。

:::
