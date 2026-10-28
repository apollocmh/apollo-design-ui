---
category: 数据展示
title: Timeline
subtitle: 时间轴
---

按顺序展示事件、状态和完整说明，支持纵向与横向。根是原生 `<ol>`，每项是 `<li>`。Timeline 组合内部 Steps 渲染器；组件没有选中状态或业务事件。

## 代码演示

`demo/` 中十五对示例覆盖基础内容、变体、末端排布、标题栏、横向和交错布局、加载、旧 pending 数据、自定义图标、长文本、标题、语义样式、原生插槽及动态组件 Token。

## API

### Timeline

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 有序条目数据；模板富内容使用原生条目槽 | `TimelineItemType[]` | — |
| mode | 条目排布；旧 left/right 归一为 start/end | `'start' \| 'end' \| 'alternate' \| 'left' \| 'right'` | `'start'` |
| orientation | 显式方向，在所有视口宽度下保持 | `'horizontal' \| 'vertical'` | `'vertical'` |
| titleSpan | 标题栏：数字按 24 栅格，字符串为 CSS 长度/百分比 | `number \| string` | — |
| variant | 节点变体 | `'filled' \| 'outlined'` | `'outlined'` |
| reverse | 反转显示顺序；连线状态改跟当前条目 | `boolean` | `false` |
| pending | 已废弃，改在 items 中追加加载项。false/null/undefined 关闭；0/空字符串仍创建 pending 项；true 只显示指示器 | `VNodeChild` | — |
| pendingDot | 已废弃，旧 pending 合成项的自定义图标；改用 items[].icon | `VNodeChild` | — |
| classNames | 语义类名对象，或读取当前 `{ props }` 的函数 | `TimelineSemanticValue<TimelineSemanticClassNames>` | — |
| styles | 语义样式对象，或读取当前 `{ props }` 的函数 | `TimelineSemanticValue<TimelineSemanticStyles>` | — |
| prefixCls | DOM 类名前缀；任意前缀需配套静态 CSS | `string` | `apollo-timeline` |

纵向中任一当前标题非空时启用两栏布局。显式 mode="alternate" 也启用该布局，并按源条目奇偶分配排布侧。反转改变显示顺序和槽索引，保留每个源条目的排布侧。显式 alternate 模式忽略 titleSpan。

横向交错布局中，长标题和正文在各自栏内换行；共享自然高度行保持横轴对齐，并随内容增长。wrapper、section、header 仍是可设置样式的真实盒子。无标题纵向列表同样消费 itemPaddingBottom，默认20px，紧凑算法为10px。

### 条目数据

| 字段 | 说明 | 类型 |
| --- | --- | --- |
| key | 替换/重排时的稳定条目标识 | `string \| number` |
| title / content / icon | 完整 Vue 内容，支持 0、Fragment 和组件；显式 false/空图标覆盖默认加载图标 | `VNodeChild` |
| color | blue/red/green/gray 使用预设类；其他颜色写入本项 dot-color CSS 变量 | `string` |
| loading | process 状态；icon 和 dot 均 absent/null 时使用默认加载图标 | `boolean` |
| placement | 排布侧；未给出时从 mode 推导 | `'start' \| 'end'` |
| className / style | 项根类名与内联样式 | `string` / `CSSProperties` |
| classNames / styles | 项级区域：root、wrapper、header、title、section、content、icon、rail | 语义对象 |
| label / children / dot | 已废弃的 title/content/icon 数据别名；仅在对应新字段 nullish 时回退 | `VNodeChild` |
| position | 已废弃的 placement 别名；left/right 归一为 start/end，显式 placement 优先 | `'left' \| 'right' \| 'start' \| 'end'` |

项根样式按组件 styles.item → 项 styles.root → 项 style 合并。其余区域先合并组件语义样式，再合并本项语义样式。没有 subtitle 区域。原生条目槽使用同一内容宿主和样式落点。

### 内容插槽

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| itemTitle | `{ item, index }: TimelineItemSlotProps` | 条目标题 |
| itemContent | `{ item, index }: TimelineItemSlotProps` | 条目正文 |
| itemIcon | `{ item, index }: TimelineItemSlotProps` | 条目图标 |

item 是当前原始数据项；index 是反转后的显示索引，含旧 pending 节点占位。槽存在就覆盖对应数据及别名，有意为空也覆盖；移除槽恢复数据。SSR 和水合中同样渲染。pending 合成项没有源数据作用域。默认槽不注册条目；开发版已移除 Timeline.Item / TimelineItemComponent，见[插槽迁移](../../../../docs/migrations/timeline-item-slots.md)。

### 原生 attrs、事件与 ref

原生 class/style、id、tabindex、ARIA 属性和 DOM 监听器落到有序列表根。原生根 style 覆盖同名语义 root 样式；class 支持 Vue 字符串/数组/对象，style 支持字符串/数组/对象。原生 @change 接收冒泡的 DOM Event，不会启用可选中的条目。@click 和事件修饰符遵循 Vue DOM 语义。Timeline 没有 emits 或 v-model。

ref 暴露 `{ nativeElement: HTMLElement | null }`，挂载后为当前 `<ol>`。数据、布局和 Provider 更新保持元素身份；卸载后父级 ref 清空。替换或重排数据时为条目提供显式 key，以保留输入节点和值。

## 主题

ConfigProvider 的 components.timeline 提供当前 className/style/classNames/styles 默认值。direction、主题算法和嵌套组件 Token 均响应式更新，多实例作用域隔离。根样式优先级为当前主题 → Provider/组件语义 root 样式 → 原生 style。

| 组件 Token | 说明 | 默认值 |
| --- | --- | --- |
| tailColor | 连线颜色 | colorSplit |
| tailWidth | 连线宽度 | lineWidthBold |
| dotBorderWidth | 节点边框宽度 | lineWidthBold |
| itemPaddingBottom | 条目底部间距 | padding * 1.25 |
| dotSize | 自定义节点大小 | undefined；保留内部 Steps 大小回退 |
| dotBg | 自定义节点背景 | undefined；保留内部 Steps 背景回退 |

在 ConfigProvider 设置 `:theme="{ components: { Timeline: { dotSize: 14, tailWidth: 3 } } }"`，也可用根 CSS 变量，如 `--apollo-timeline-dot-size: 14px`。尺寸接受有限非负数字并转为 px，宽度/大小 Token 还可接受 CSS 长度字符串。移除可选 dot Token 后恢复回退值。主题更新不生成运行时样式表。

原生事件、排布侧、零内容、ref 与 Token 修正见[当前契约迁移](../../../../docs/migrations/timeline-contracts.md)。
