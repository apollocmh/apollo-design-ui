---
category: 数据展示
title: Masonry
subtitle: 瀑布流
---

瀑布流布局：条目按「当前最矮的一列」依次落位，高度**实测**而非预设。

## 何时使用

- 内容高度参差不齐，但希望整体视觉上「填满」容器（图片墙、卡片流、商品列表）。
- 需要按断点控制列数与间距。

## 代码演示

见 [`demo/`](./demo)（6 个，覆盖 antd 的主要用户场景）。

| demo | 内容 |
|---|---|
| `basic` | 基本（4 列 + `gutter` 16） |
| `responsive` | 列数与间距都按断点配置 |
| `dynamic` | 增删条目 + `onLayoutChange` 把列号写回 `items` |
| `fresh` | 条目内容高度会变时用 `fresh`（每个条目各挂 `ResizeObserver`） |
| `image` | 条目是图片（加载后高度才确定） |
| `style-class` | `classNames` / `styles` 的对象与函数两种形态 |

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| items | 数据源。每项 `{ key, data, column?, height?, children? }` | `MasonryItemType<T>[]` | — | × |
| columns | 列数。对象形态按断点解析（从大到小取第一个已配置的断点；都没命中 ⇒ `columns.xs ?? 1`） | `number \| Partial<Record<Breakpoint, number>>` | `3` | × |
| gutter | 间距。复用 Grid 的 `Gutter`（数字 / 字符串 / 断点对象 / `[水平, 纵向]`） | `Gutter` | `0` | × |
| fresh | 为**每个条目**各挂一个 `ResizeObserver`（内容高度会变时用）。⚠️ **不改变 DOM 结构** | `boolean` | `false` | × |
| onLayoutChange | `layoutChange` 的 Vue 事件监听器；当前条目全部完成测量后接收 **`{...item, column}`** | `(sortInfo: MasonryLayoutItem<T>[]) => void` | — | × |
| classNames | 语义化类名（`root` / `item`），支持函数形态 | `MasonrySemanticClassNames \| ((info) => …)` | — | ✅（`masonry.classNames`） |
| styles | 语义化样式（`root` / `item`），支持函数形态 | `MasonrySemanticStyles \| ((info) => …)` | — | ✅（`masonry.styles`） |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-masonry` | × |
| class / style | **根元素原生 attrs**（不是 Props）；调用方样式覆盖同名语义样式及计算得到的容器高度 | Vue class/style 绑定 | — | × |

`gutter` 数字按像素处理；CSS 字符串如 `['2rem', 'calc(0.5rem + 4px)']`、`var()` 和百分比保留 CSS 单位。横向百分比以容器宽度为基准；纵向百分比以当前条目零间距排布的高度为基准，提供显式根高度时优先使用该高度，避免间距与根高相互反馈。局部隐藏测量节点观察字体、视口和 CSS 变量变化，双轴均切回数字或组件卸载时释放。

#### MasonryItemType

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| key | 唯一标识（数字会内部 `String()` 化） | `string \| number` | — |
| data | 业务数据，泛型 T 由 items 推导并传给 #item | `T` | — |
| column | 指定落在第几列（0 基）。超界会夹到最后一列 | `number` | 自动选最矮列 |
| height | 传给 #item 和 layoutChange 的可选元数据，不设置实测布局高度 | `number` | — |
| children | 未提供 #item 时使用的回退内容 | `VNodeChild` | — |

### Events

| 名称 | 说明 | 参数 |
|---|---|---|
| layoutChange | 完整实测布局变化。原生 Vue 监听器（包括 `.once`）接收同一个事件，事件发布不依赖 `onLayoutChange` prop | `(sortInfo: MasonryLayoutItem<T>[])` |

### Ref

| 名称 | 类型 | 说明 |
|---|---|---|
| nativeElement | `() => HTMLDivElement \| null` | 当前根元素；卸载后返回 null |

开发版 API 修正（`0.0.0`）：`MasonryRef` 现与 `MasonryExpose` 一致，使用 `masonryRef.value?.nativeElement()` 获取根元素；旧 `MasonryRef.nativeElement` 的直接元素类型与已文档化的 getter 不符。本次直接修正，无兼容层或弃用期。

### Slots

| 名称 | 参数 | 说明 |
|---|---|---|
| item | `MasonryItemSlotProps<T>`：`{ key, data, index, column, children?, height? }` | 当前条目；优先于 item.children，空槽也覆盖回退内容 |

column 为当前测量列号，首次测量前暂为 0。条件插槽、同 key 替换数据（包括响应式数组原地替换条目对象）和语义样式函数均读取当前输入；组件更新后会重测量。CSS 过渡或后代独立尺寸变化可用 fresh 持续观察。泛型也传给 layoutChange。旧 itemRender prop 已移除，见[迁移说明](../../../../docs/migrations/masonry-slots.md)。

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
- **SSR 直接输出内容**：初始 items 与 #item 在服务端渲染；测量前采用正常网格流和自然高度，客户端挂载后按实际高度切换为瀑布流定位。网格按行排列，测量后才采用最短列算法。水合保留条目、输入节点和输入值，不再复制 React effect 的空首屏。
- **高度是实测的**：`item.height` 从不被读；首帧量测在 Vue 更新 DOM 之后。
- **图片事件参与测量**：根节点以原生捕获监听 load/error；非冒泡的 img 事件也会触发去抖量测与重排，fresh=false 同样有效。一般内容的尺寸变化仍可用 fresh 的逐项 ResizeObserver。
- **本组件零 ARIA**：容器与条目都是普通 `div`（无 `role`、无 `tabindex`）——
  语义由 #item 内容和调用方的原生 attrs 提供。
- **原生 attrs 透传**：id/title/事件以及字符串、对象、数组 class/style 按 Vue 规则路由到根节点。attrs 在 render 期读取，调用方 style 覆盖同名语义 root 样式，更新不替换根 DOM。默认不添加 role/ARIA，调用方可通过原生 attrs 提供必要语义。
