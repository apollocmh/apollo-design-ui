---
category: 布局
title: Grid
subtitle: 栅格
---

24 栅格布局。Row 建立 flex 行，Col 表达列宽、顺序、逻辑偏移和 flex 填充。列应属于 Row 的布局；包装组件可正常透传插槽及注入，嵌套 Row 使用自己的 gutter。

## 代码演示

[`demo/`](./demo) 的 13 个实际 Demo 覆盖基础栅格、双轴间距、偏移/排序、六种主轴对齐、四种交叉轴对齐、flex、响应式与原生范围控件。色块使用主题背景和文字变量。

## API

### Row

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| gutter | 非负间距；数字为 px，字符串为有效 CSS 长度。两个轴都可使用断点对象 | `ResponsiveValue<number \| string> \| readonly [ResponsiveValue<number \| string>, ResponsiveValue<number \| string>]` | `0` |
| justify | 主轴对齐，支持断点对象 | `ResponsiveValue<'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'>` | — |
| align | 交叉轴对齐，支持断点对象；stretch 显式拉伸列盒 | `ResponsiveValue<'top' \| 'middle' \| 'bottom' \| 'stretch'>` | — |
| wrap | 自动换行；未传或 true 换行，false 使用 nowrap | `boolean` | `true` |
| prefixCls | 根类名前缀；自定义前缀需自行提供对应静态 CSS | `string` | Provider 前缀 + `-row`，默认 `apollo-row` |

`ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>`。

### Col

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| span | 占用 0–24 个整数栅格；0 隐藏列 | `number` | — |
| order | 排列顺序，0–24 整数 | `number` | — |
| offset | 行内起始方向的间隔栅格数，0–24 整数 | `number` | — |
| push / pull | 沿行内起始/结束方向移动的栅格数，0–24 整数 | `number` | — |
| flex | auto→`1 1 auto`；数字 n→`n n auto`（含 0/分数）；px/em/rem/% 长度→`0 0 长度`；其他有效 flex 字符串原样消费 | `string \| number` | — |
| xs / sm / md / lg / xl / xxl / xxxl | 响应式数字 span 简写，或包含 span/order/offset/push/pull/flex 的对象 | `number \| ColSize` | — |
| prefixCls | 根类名前缀；自定义前缀需自行提供对应静态 CSS | `string` | Provider 前缀 + `-col`，默认 `apollo-col` |

### 默认插槽、原生 attrs 与 ref

Row、Col 的默认插槽无作用域参数，接受完整 Vue 内容（文本、0、多节点、Fragment 和组件）；无业务 emits 或 v-model。根均为稳定的 div，原生 `id`、`class`、`style`、ARIA、tabindex 和 DOM 监听器落在这个根上，监听器只触发一次。根 `style` 支持 Vue 字符串、对象和数组，替换/移除实时生效。

- Row 样式优先级：gutter 几何 → Provider `row.style` → 原生 `style`。
- Col 样式优先级：gutter/flex 几何 → Provider `col.style` → 原生 `style` → 响应式 flex 变量。显式 style 可覆盖几何；span/flex 仍按 CSS 布局规则计算最终宽度。
- `ref<GridRef>` 暴露 `nativeElement: HTMLElement | null`，指向实际 div；卸载后清空。Row/Col 自身不增加键盘操作或焦点，原生子控件保持自身行为。`span=0` 隐藏已聚焦内容时浏览器会正常移走焦点。

### Provider

`ConfigProvider :components="{ row: rowConfig, col: colConfig }"`：RowConfig、ColConfig 均支持 `className?: string` 与 `style?: CSSProperties`。当前配置、方向及前缀的出现、替换和移除实时生效。Provider direction 作为原生 dir 的默认值；根的显式 `dir` 或 CSS direction 可覆盖它。嵌套 Provider 与独立实例互不改写配置。

### 断点与 Hook

| 断点 | Col 静态样式范围 | useBreakpoint / Row 响应式值的命中范围 |
| --- | --- | --- |
| xs | 基础样式；直到较大断点显式覆盖 | ≤575px |
| sm | ≥576px | ≥576px |
| md | ≥768px | ≥768px |
| lg | ≥992px | ≥992px |
| xl | ≥1200px | ≥1200px |
| xxl | ≥1600px | ≥1600px |
| xxxl | ≥1920px | ≥1920px |

Col 的各档类同时输出，CSS 按从小到大覆盖；对象中的 0 可清除较小档的偏移/顺序，移除整档时恢复下面仍有效的档。Row 的 justify/align/gutter 按当前命中的断点从大到小查找第一个已配置值；没有匹配值时不设置相应值。例如仅配置 `{ xs: 8, md: 24 }` 的 gutter，在 576–767px 没有命中项。

`useBreakpoint(refreshOnChange?, defaultScreens?)` 返回 `Ref<Screens | null>`。refreshOnChange 接受布尔值或布尔 getter；false 保留上次发布值但缓存媒体变化，getter 恢复 true 时立即发布最新视口。动态开关请传 `() => enabled.value`。相同媒体查询集合共享监听器，不同配置独立观察；配置替换会切换监听器，最后一个订阅者卸载后释放。

SSR 保留 defaultScreens，不访问浏览器。Row 首帧响应式 justify/align 无命中；gutter 在无视口信息时使用最大已定义档，挂载后校正到实际视口。服务端与水合首帧保持确定性，挂载校正可能改变布局。

## Theme 与样式边界

Row/Col 无组件 Token；24 栏是几何常量。字体消费当前全局 fontFamily/fontSize 变量；gutter、flex、逻辑偏移使用响应式几何。Row 负半 margin、Col 正半 padding 合成水平间距，纵向使用 row-gap。基础及响应式 flex 在 nowrap 行中允许收缩（min-width: 0），原生 style 可覆盖。

Col 的静态 CSS 媒体查询固定为表中默认值。运行时 screen Token 覆盖影响 useBreakpoint/Row 的 JavaScript 断点，不重写 Col 的静态媒体查询；需一致时保留默认断点或由应用提供定制静态样式。完整修正与验证边界见 [Grid 迁移记录](../../../../docs/migrations/grid-contracts.md)。
