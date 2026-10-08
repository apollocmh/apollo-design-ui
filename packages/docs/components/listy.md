---
title: Listy 轻量列表
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

轻量列表：数据驱动渲染 + 可选分组（吸顶）+ 可选虚拟滚动。antd v6 新增组件。

## 何时使用

- 需要渲染大量条目的轻量只读列表（虚拟滚动由 `virtual` 开启）。
- 需要按 `group.key` 聚合分组并吸顶展示组头。

:::

## 代码演示

::: v-pre

**basic**：数据驱动渲染：`items` + `row-key` + default 插槽渲染项内容。

:::

<DemoPreview component="listy" demo="basic" />

::: v-pre

**group**：`group.key` 聚合（不要求同组数据连续），`group.title` 渲染组头；`sticky` 让组头吸附在滚动容器顶部。

:::

<DemoPreview component="listy" demo="group" />

::: v-pre

**scroll-to**：`ref.scrollTo(config)`：数字（scrollTop）/ `{ key, align, offset }`（按项）/ `{ groupKey }`（按组）/ `{ left, top }`。

:::

<DemoPreview component="listy" demo="scroll-to" />

::: v-pre

**virtual**：`virtual` + `height` + 估算行高（由 token 推导）启用虚拟滚动，只渲染视口内的项。

:::

<DemoPreview component="listy" demo="virtual" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 数据（undefined ⇒ 空数组） | `T[]` | `[]` |
| rowKey | 行键（字段名或函数） | `keyof T \| ((item) => Key)` | —（必填） |
| group | 分组配置：`{ key: (item)=>K; title: (groupKey, items)=>VNodeChild }`（同 key 不要求连续） | — | — |
| sticky | 组头吸顶（Raw=CSS sticky；Virtual=定位克隆头） | `boolean` | — |
| virtual | 虚拟滚动（⚠️ antd 默认 `false`；与 ConfigProvider 的 `virtual` 上下文合并） | `boolean` | `false` |
| height | 容器高度（Raw ⇒ maxHeight；Virtual ⇒ 与估算行高一起启用虚拟化） | `number` | — |
| classNames / styles | 语义槽 `{ root, item, groupHeader }`（对象或函数式） | — | — |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取 |
| class / style | **根元素原生 attrs**（不是 Props） | `string \| array \| object` / `CSSProperties` | — |

> ⚠️ `direction` **不是** Listy 的公开 prop（antd Omit）——文字方向由 ConfigProvider
> 的 `direction` 控制。
>
> ⚠️ 项内容用 **default 插槽**（作用域 `{ item, index }`）或 `itemRender` prop
> （函数式）；两者都缺会发 dev 告警并渲染空内容。

### Ref

| 名称 | 类型 |
|---|---|
| scrollTo | `(config?: ListyScrollToConfig) => void` |

`ListyScrollToConfig`：

- `number`：设置 `scrollTop`；
- `{ key, align?, offset? }`：滚到某项（`align: 'top' | 'bottom' | 'auto'`，默认 `'auto'`；
  Raw 用 `scrollIntoView`，Virtual 走虚拟列表迭代；sticky 时自动让过吸顶组头）；
- `{ groupKey, align?, offset? }`：滚到某组；
- `{ left?, top? }`：绝对坐标；
- `null` / `undefined`：no-op。

## Theme（Component Token）

2 个，与 antd 逐字段对齐（CSS 变量形态 `--apollo-listy-*`）：

- `itemPaddingBlock`（= `paddingSM`）
- `itemPaddingInline`（= `padding`）

## FAQ

**虚拟模式的估算行高是多少？**

`fontHeight + (itemPaddingBlock ?? paddingSM) * 2`（与 antd 同公式）。⚠️ 本仓用默认
主题的构建期解析值：通过 ThemeConfig 覆盖 `Listy.itemPaddingBlock` 不会反映到估算行高
（实测项高仍以 DOM 测量为准，估算只影响滚动条与初始窗口）。

**虚拟模式与 antd 的 DOM 有差异吗？**

有：本仓虚拟滚动由 `@apollo-design/virtual-list` 提供（原生滚动、无自绘滚动条），
与 rc-virtual-list 的 DOM 不同（foundation 已登记 PLATFORM）。滚动行为与吸顶语义对齐。

:::
