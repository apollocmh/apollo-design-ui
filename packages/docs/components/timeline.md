---
title: Timeline 时间轴
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

垂直展示的时间流信息。

## 何时使用

- 当有一系列信息需按时间排列时；
- 需要给一个时间序列加上状态与描述时。

> ⚠️ **本组件在 antd 6.6.4 里没有自己的 DOM** —— 它是 [`Steps`](./steps) 的薄壳：
> 渲染成 **`<ol>` + `<li>`**（列表语义由原生元素承担），外观由「Steps 的 DOM +
> Timeline 自己的样式覆盖」共同决定。这也是为什么它支持 `variant` 等 Steps 的 props。

:::

## 代码演示

::: v-pre

**alternate**：`mode="alternate"` 让内容**左右交替**（按项序号奇偶）。

:::

<DemoPreview component="timeline" demo="alternate" />

::: v-pre

**basic**：基础的时间轴 —— 只给 `content`（无 `title` ⇒ 纵向**不**交错）。

:::

<DemoPreview component="timeline" demo="basic" />

::: v-pre

**custom**：`icon` 自定义节点；自定义 `fontSize` 时需要自己给背景色（否则连线会透出来）。

:::

<DemoPreview component="timeline" demo="custom" />

::: v-pre

**end**：`mode="end"` 把节点靠右；`icon` + `color` 可以自定义某一项的节点。

:::

<DemoPreview component="timeline" demo="end" />

::: v-pre

**horizontal-debug**：水平 + 长文本：用 `styles.item` 画一个 1px 的调试描边，看三种 `mode` 的排布。

:::

<DemoPreview component="timeline" demo="horizontal-debug" />

::: v-pre

**horizontal**：`orientation="horizontal"` 是**另一套绝对定位布局**（`mode` 的三种取值各有形态）。

:::

<DemoPreview component="timeline" demo="horizontal" />

::: v-pre

**pending-legacy**：⚠️ **已废弃**的 `pending` / `pendingDot` —— 现在请直接在 `items` 里加一项。

:::

<DemoPreview component="timeline" demo="pending-legacy" />

::: v-pre

**pending**：`reverse` 反转项顺序（⚠️ 连线的状态也随之改跟当前项）；`loading: true` 的项是「进行中」。

:::

<DemoPreview component="timeline" demo="pending" />

::: v-pre

**semantic**：**项级**语义化槽（`styles.root` / `rail` / `content`）—— 注意它在 `items[i].styles` 上，不是根上的。

:::

<DemoPreview component="timeline" demo="semantic" />

::: v-pre

**style-class**：`styles` 支持**函数形态**（按 `info.props` 动态返回）；`classNames.root` 加自定义类。

:::

<DemoPreview component="timeline" demo="style-class" />

::: v-pre

**title-span**：`titleSpan` 控制标题栏的占比：数字按 **24 栅格**、字符串按 **CSS 长度**。

:::

<DemoPreview component="timeline" demo="title-span" />

::: v-pre

**title**：带 `title` 的项 ⇒ 纵向时**自动进入交错布局**（`layoutAlternate` 的第二条判据）。

:::

<DemoPreview component="timeline" demo="title" />

::: v-pre

**variant**：`variant="filled"` 与默认的 `"outlined"` 是两种视觉变体（透传给内部的 `Steps`）。

:::

<DemoPreview component="timeline" demo="variant" />

::: v-pre

## API

### Timeline

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 项列表（**唯一的内容入口**） | `TimelineItemType[]` | — |
| mode | 模式。`'left'` / `'right'` **已废弃** ⇒ 归一为 `'start'` / `'end'` | `'left' \| 'right' \| 'start' \| 'end' \| 'alternate'` | `'start'` |
| orientation | 方向。`'horizontal'` 落 `-horizontal` 类 | `'horizontal' \| 'vertical'` | `'vertical'` |
| titleSpan | 标题栏占比：**数字**按 24 栅格、**字符串**按 CSS 长度 | `number \| string` | — |
| variant | 变体（透传给内部的 `Steps`） | `'filled' \| 'outlined'` | `'outlined'` |
| reverse | 反转项顺序（⚠️ 连线的状态也随之改跟当前项） | `boolean` | `false` |
| pending | ⚠️ **已废弃** —— 直接在 `items` 里加一项 | `VNodeChild` | — |
| pendingDot | ⚠️ **已废弃** —— 直接在 `items` 里加一项 | `VNodeChild` | — |
| classNames / styles | 语义化槽（**十槽去掉 `itemSubtitle`**；支持**函数形态**） | | — |
| prefixCls | 类名前缀 | | — |
| class / style | **根元素原生 attrs**（不是 Props）；`style` 走 `styles.root` 语义槽 | | — |

> 🚨 **`layoutAlternate` 的判据**：`mode === 'alternate'` **或**（纵向 **且** 任一项带 `title`）。
> ⇒ 纵向只要有一项带 `title`，整个时间轴就进入**左右交错**布局。
> ⚠️ `titleSpan` 在 `mode === 'alternate'` 时**不生效**（上游同判）。

### items[i]（`TimelineItemType`）

| 字段 | 说明 | 类型 |
|---|---|---|
| content | 内容 | `VNodeChild` |
| title | 标题（有 `title` ⇒ 纵向交错） | `VNodeChild` |
| icon | 自定义节点图标 | `VNodeChild` |
| color | 预设色（`blue` / `red` / `green` / `gray`）落类；**其余任意色值**落内联 CSS 变量 | `'blue' \| 'red' \| 'green' \| 'gray' \| string` |
| loading | 加载中 ⇒ `status: 'process'` + 默认加载图标 | `boolean` |
| placement | 排布侧。不传时按 `mode` 推导（`alternate` 时按**奇偶**交替） | `'start' \| 'end'` |
| key | 行 key | `string \| number` |
| className / style / classNames / styles | 项级落点（`styles` 支持 `root` / `rail` / `content` 等项级槽） | |
| label / children / dot / position | ⚠️ **都已废弃** ⇒ 用 `title` / `content` / `icon` / `placement` | |

### 实例方法（ref）

暴露 `{ nativeElement }` —— ⚠️ 取的是**内部 `Steps` 的根元素**（`HTMLDivElement` 或
`HTMLOListElement`），因为 `Timeline` 没有自己的根 DOM。

## Theme

### Component Token（6 个）

| token | 说明 | 默认值 |
|---|---|---|
| `tailColor` | 轨迹颜色 | `colorSplit` |
| `tailWidth` | 轨迹宽度 | `lineWidthBold` |
| `dotBorderWidth` | 节点边框宽度 | `lineWidthBold` |
| `itemPaddingBottom` | 时间项下间距 | `padding * 1.25` |
| `dotSize` | 节点大小 | ⚠️ **`undefined`**（刻意不声明，见下） |
| `dotBg` | 节点背景色 | ⚠️ **`undefined`**（同上） |

🚨 **`dotSize` / `dotBg` 默认是 `undefined`、产物里也刻意不声明** —— 它们靠
`var(custom, origin)` 的**两层回退链**：未设置时回退到 `Steps` 的原生尺寸/背景色，
设置后才生效。**这不是遗漏，是判据**（补一条声明会让回退链失效）。

运行时调参用 CSS 变量：`--apollo-timeline-tail-color` / `--apollo-timeline-dot-size` 等。

:::
