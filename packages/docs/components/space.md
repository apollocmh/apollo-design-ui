---
title: Space 间距
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

设置组件之间的间距。

## 何时使用

- 避免组件紧贴在一起，拉开统一的空间。
- 适合行内元素的水平间距。
- 可以设置各种水平对齐方式。
- 需要表单组件之间紧凑连接且合并边框时，使用 `Space.Compact`。

:::

## 代码演示

::: v-pre

**align**：设置对齐模式。`align` 只有 `start` / `end` / `center` / `baseline` 四个取值。
⚠️ 水平模式下不传 `align` 时**默认**是 `center`（不是 `start`）—— 与 antd 一致。

:::

<DemoPreview component="space" demo="align" />

::: v-pre

**base**：相邻组件水平间距。

:::

<DemoPreview component="space" demo="base" />

::: v-pre

**compact-button-vertical**：垂直方向的紧凑布局，目前仅支持 Button 组合。
⚠️ 垂直模式目前**只有 Button 实现了对应的边框合并样式** —— 这是上游的现状，不是我们的缺口。
其它表单组件的垂直紧凑拼接样式尚未落地，所以这里只演示 Button。

:::

<DemoPreview component="space" demo="compact-button-vertical" />

::: v-pre

**compact-buttons**：Button 组件紧凑排列的示例。
紧凑排列的核心是**边框合并**：中间项的 `border-inline-start-width` / `border-inline-end-width`
归零，并把 `border-radius` 收成 0 —— 这些都作用在**子组件自己**的前缀上，
由 `useCompactItemContext` 给出的首/末项标志决定。

:::

<DemoPreview component="space" demo="compact-buttons" />

::: v-pre

**compact-debug**：调试 Input 前置/后置标签。这个 demo 演示的是 `Space.Compact` 与 `Space.Addon` 的配合：
`Space.Addon` 用的是**自己的**前缀（`apollo-space-addon`，不是 `apollo-space-compact`），
所以它的紧凑项类名落在 `-space-addon-compact-*` 上。
⚠️ **本 demo 是精简版**：antd 的 `compact-debug.tsx` 还覆盖 Modal / Drawer / Dropdown.Button /
Popover 里的上下文传播（这些浮层组件在本仓库尚未实现），这里保留 12 组与 `Space.Addon` 相关的。

:::

<DemoPreview component="space" demo="compact-debug" />

::: v-pre

**compact-nested**：嵌套使用的紧凑布局。
嵌套是 `Space.Compact` 最有信息量的用法：**内层会覆盖外层注入的上下文**。
于是「内层的第一项」在视觉上是外层的中间项 —— 边框该不该合并由**最近的一层**决定。
⚠️ 同「紧凑布局」：依赖 Cascader / TimePicker / InputNumber / Select，此处用替身。

:::

<DemoPreview component="space" demo="compact-nested" />

::: v-pre

**compact**：使用 `Space.Compact` 让表单组件之间紧凑连接且合并边框。
`Space.Compact` **自己不产子元素包装**：它把 `compactSize` / `compactDirection` /
`isFirstItem` / `isLastItem` 通过 `useCompactItemContext` 注入给**子组件**，
由子组件自己拼 `{自己的前缀}-compact-item` 类名。这是 Space 最重要的一条跨组件协议
（Button / Input / Select / DatePicker 等 10 个组件消费它）。
⚠️ **本 demo 是精简版**：antd 的 `compact.tsx` 有 15 组，其中多组依赖 Select / DatePicker /
Cascader / TreeSelect / InputNumber / AutoComplete / TimePicker / ColorPicker，它们在本仓库
尚未实现（Space 在 DAG 上先于它们）。这里保留 11 组，全部用原生 `<input>` / `<select>` 替身。
替身只保证**尺寸与间距**可比，没有自己的 hover / focus / disabled 视觉。缺口见 `README.md` §7。

:::

<DemoPreview component="space" demo="compact" />

::: v-pre

**component-token**：自定义 `Space.Addon` 的主题样式。
⚠️ **Space / Space.Compact / Space.Addon 的 Component Token 是空的。**
antd 6.6.4 的 `style/index.ts` 里 `ComponentToken` 就是一个空接口、
`prepareComponentToken` 返回 `{}` —— 所以 `theme.components.Space` **没有任何可覆盖的字段**。
这不是我们没做，是上游本来就没有（见 `style/token.ts` 的文件头）。
这个 demo 演示的是**等价的临时手段**：零运行时架构下，Addon 的规则消费的是 Alias 层变量
（`color: var(--apollo-color-text)`），所以**就地重声明该变量**就能达到 antd 那边
`theme.components.Addon.colorText` 的效果。变量声明在 `SpaceAddon` 自己身上，
作用域与 antd 的「只影响 Addon」一致。
同样的手段可以覆盖 `--apollo-padding-sm`（内边距）、`--apollo-border-radius`（圆角）、
`--apollo-line-width`（边框粗细）。完整清单见 `README.md` §5.3。

:::

<DemoPreview component="space" demo="component-token" />

::: v-pre

**debug**：假值子节点不会破坏布局。
⚠️ 这个 demo 用 `h()` 而不是模板插值，**这不是风格问题**：
在 Vue 模板里 `{{ null }}` 会退化成空文本节点、`{{ false }}` 会渲染出字符串 `"false"`
（`toDisplayString` 的语义），与 React 的 vnode 语义不等价。
用 `h()` 才能与 antd 的 JSX 子节点逐字对应。
`null` / `undefined` / `false` 会被 `toArray(children, { keepEmpty: true })` 保留成占位，
再由 `isEmptyVNode` 判定为空 ⇒ **不产生** `-item`；数字 `1` 是有效节点 ⇒ 产生 `-item`。

:::

<DemoPreview component="space" demo="debug" />

::: v-pre

**gap-in-line**：把容器宽度从 310px 调到 307px，观察四个方块从「一行」变成「两行」时
横向间距（`column-gap`）与纵向间距（`row-gap`）各自如何生效。
⚠️ 蓝色是 `Space` 自己的背景、绿色是外层盒子的 `box-shadow` —— 用来把两层的边界分开。

:::

<DemoPreview component="space" demo="gap-in-line" />

::: v-pre

**separator**：相邻组件分隔符。`separator` 接受任意节点，所以可以放 `Divider` 这类组件。
⚠️ `separator` 为**假值**（`0` / `''` / `null`）时**不渲染**分隔符 —— 判据是真值，不是 `??`。
`split` 是它的废弃别名（`mergedSeparator = separator ?? split`），传它会输出开发期告警。

:::

<DemoPreview component="space" demo="separator" />

::: v-pre

**size**：使用 `size` 设置元素之间的间距，预设了 `small`、`medium`、`large` 三种尺寸，
也可以自定义间距；若不设置 `size`，则默认为 `small`。
预设串（`small` / `medium` / `large`）走**类名**，取值来自 CSS 变量
（`--apollo-padding-xs` / `--apollo-padding` / `--apollo-padding-lg`），所以会随主题自适应。
数字走**内联** `row-gap` / `column-gap`，由我们补 `px`。
`size={0}` 是**有效值**（判据是 `??` 不是 `||`），但不产生任何 gap。
`[horizontal, vertical]` 元组形式可以两个方向分别指定（见「自动换行」demo）。

:::

<DemoPreview component="space" demo="size" />

::: v-pre

**style-class**：通过 `classNames` 和 `styles` 传入对象/函数可以自定义 Space 的语义化结构样式。
`classNames` / `styles` 各有三个槽位：`root` / `item` / `separator`。
两者都接受**对象**或**函数**（`(info: { props }) => 对象`），与 antd 完全对齐。
函数式拿到的 `info.props` 是**合并后**的 props —— `orientation` 已折成 `horizontal` / `vertical`、
`size` 已并入 ConfigProvider 的取值。所以可以用它做条件分支。
⚠️ **零运行时架构下 `classNames` 只负责挂类名，样式由使用者自己的样式表提供**
（H6 禁止 CSS-in-JS）。所以这个 demo 里 `classNames` 的效果要开 devtools 才看得到，
视觉差异全部来自 `styles`。
⚠️ `styles` 的数值必须**带单位**：Vue 的运行时 `setStyle` 不做 px 补全，
写 `{ padding: 8 }` 会被静默丢弃（PITFALLS 32）。
⚠️ `style` prop 的优先级**高于** `styles.root`（与 antd 一致）。

:::

<DemoPreview component="space" demo="style-class" />

::: v-pre

**vertical**：相邻组件垂直间距。
`orientation="vertical"` 与 `vertical` 等价；同时配置时以 `orientation` 优先。
⚠️ 垂直模式下 `align` 不传时**不产生** `-align-*` 类名（与水平模式的默认 `center` 不同）。

:::

<DemoPreview component="space" demo="vertical" />

::: v-pre

**wrap**：自动换行。`wrap` 只在水平方向有意义。
配合元组 `size`（`[横向, 纵向]`）可以分别控制「同一行内的间距」与「换行后的行距」。

:::

<DemoPreview component="space" demo="wrap" />

::: v-pre

## API

### Space

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-space` |
| size | 间距大小。预设串走类名，数字走内联 `gap`；数组按 `[水平, 垂直]` 分别取值 | `SpaceSize \| [SpaceSize, SpaceSize]` | 从 ConfigProvider 取 `space.size`，兜底 `'small'` |
| orientation | 排列方向。优先级最高 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 是否垂直。与 `orientation` 同时配置时以 `orientation` 优先 | `boolean` | — |
| align | 对齐方式。⚠️ 垂直时未传**不会**折成 `center` | `'start' \| 'end' \| 'center' \| 'baseline'` | 水平时 `'center'`，垂直时 — |
| separator | 设置分隔符 | `VNodeChild` | — |
| wrap | 是否自动换行。仅水平时有效 | `boolean` | `false` |
| class / style | **根元素原生 attrs**（不是 Props）；调用方 `style` 覆盖 `styles.root` | `string \| array \| object` / `CSSProperties` | — |
| classNames | 语义化类名 | `SpaceSemanticValue<SpaceSemanticClassNames>` | — |
| styles | 语义化样式 | `SpaceSemanticValue<SpaceSemanticStyles>` | — |
| ~~direction~~ | ⚠️ 已废弃，请用 `orientation` | `'horizontal' \| 'vertical'` | — |
| ~~split~~ | ⚠️ 已废弃，请用 `separator` | `VNodeChild` | — |

`SpaceSize` = `SizeType | number`，`SizeType` = `'small' | 'middle' | 'medium' | 'large'`。

⚠️ `size` 的两条判据**不同**：

| 取值 | 落地 |
|---|---|
| 预设串 | 类名 `-gap-row-{size}` / `-gap-col-{size}`，值交给 CSS 变量 |
| 非零数字 | 内联 `row-gap` / `column-gap`（**自动补 `px`**） |
| `0` / `NaN` / 字符串数字 | **什么都不加**（`isValidGapNumber` 的真值短路排除了 `0`） |

#### 插槽

| 名称 | 说明 |
|---|---|
| default | 需要设置间距的内容。每个子节点会被包进一个 `-item` |

⚠️ 不可渲染的子节点（`null` / `undefined` / 空字符串 / 注释节点）**连 `-item` 包裹都没有**；
但**组件本身渲染 `null`**（如 `<Null/>`）是可渲染的 ⇒ 会得到一个空的 `-item`，
由 CSS `:empty{display:none}` 隐藏。

#### 语义化槽位

`classNames` / `styles` 各有三个槽位：`root` / `item` / `separator`。

合并优先级（低 → 高）：

```
ConfigProvider.space.classNames/styles
  → 组件的 classNames / styles
  → 根节点原生 class / style attrs
```

其中调用处原生 **`:style` 会覆盖 `styles.root`**（保持合并优先级；该值走 Vue `$attrs`）。

#### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null`；无子节点时**不渲染根元素**，此时也是 `null` |

### Space.Compact

让表单组件之间紧凑连接并合并边框。

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀。⚠️ 后缀是 `space-compact` | `string` | 从 ConfigProvider 取，兜底 `apollo-space-compact` |
| size | 子组件尺寸。优先于 ConfigProvider 的 `componentSize` | `SizeType` | 从 ConfigProvider 取 `componentSize` |
| orientation | 排列方向。优先级最高 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 是否垂直。与 `orientation` 同时配置时以 `orientation` 优先 | `boolean` | — |
| block | 宽度撑满父元素 | `boolean` | `false` |
| class / style | 根元素原生 attrs | `string \| array \| object` / `CSSProperties` | — |
| ~~direction~~ | ⚠️ 已废弃，请用 `orientation` | `'horizontal' \| 'vertical'` | — |

#### 插槽

| 名称 | 说明 |
|---|---|
| default | 需要紧凑连接的表单组件。⚠️ Compact **不包裹**子节点，只广播上下文 |

⚠️ 与 `Space` 不同，Compact **丢弃**假值子节点（不占下标）。

#### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div`。首次渲染前为 `null`；无子节点时不渲染根元素 |

#### 跨组件协议

Compact 不自己拼类名 —— 它把四个量广播给子组件，由**子组件用自己的前缀**拼：

```ts
import { useCompactItemContext } from '@apollo-design/ui';

const { compactSize, compactDirection, compactItemClassnames } = useCompactItemContext(
  prefixCls,   // 你自己的前缀，如 'apollo-btn'
  direction,   // 文字方向，'rtl' 时多一个 -item-rtl
);
// compactItemClassnames: ComputedRef<string>
// → 'apollo-btn-compact-item apollo-btn-compact-first-item'
```

| 返回值 | 类型 | 说明 |
|---|---|---|
| compactSize | `ComputedRef<SizeType \| undefined>` | 子组件应采用的尺寸 |
| compactDirection | `ComputedRef<'horizontal' \| 'vertical' \| undefined>` | 紧凑方向。`vertical` 时类名里多一对连字符 |
| compactItemClassnames | `ComputedRef<string>` | 已拼好的类名串（空串表示不在 Compact 里） |

类名顺序：`-compact-item` → `-compact-first-item`? → `-compact-last-item`? → `-compact-item-rtl`?。
⚠️ `vertical` 时是 `-compact-vertical-item` / `-compact-vertical-first-item`。

浮层（Modal / Drawer / Tooltip / Dropdown）里的内容虽然在下游组件的树上属于 Compact，
但视觉上不属于紧凑组，用 `NoCompactStyle` 把上下文重置为 `null`。

### Space.Addon

紧凑布局里的自定义单元格（antd@5.29.0 起提供）。

#### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 类名前缀。⚠️ 后缀是 `space-addon` | `string` | 从 ConfigProvider 取，兜底 `apollo-space-addon` |
| variant | 外观变体 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| status | 校验状态 | `'error' \| 'warning' \| 'success' \| 'validating' \| ''` | — |
| disabled | 禁用态。⚠️ 只改变颜色，**不设** `disabled` 属性 | `boolean` | `false` |
| class / style | 根元素原生 attrs | `string \| array \| object` / `CSSProperties` | — |

#### 插槽

| 名称 | 说明 |
|---|---|
| default | 单元格内容 |

#### ref

| 名称 | 说明 |
|---|---|
| nativeElement | 根 `div` |

### 类型导出

`SpaceProps`、`SpaceRef`、`SpaceSize`、`SpaceAlign`、`SpaceSlot`、`SpaceConfig`、
`SpaceSemanticType`、`SpaceSemanticAllType`、`SpaceSemanticClassNames`、
`SpaceSemanticStyles`、`SpaceSemanticValue`、`SpaceCompactProps`、`SpaceCompactRef`、
`SpaceCompactItemContextType`、`SpaceAddonProps`、`SpaceAddonRef`、
`SpaceComponentToken`、`InputStatus`。

### 工具导出

| 名称 | 说明 |
|---|---|
| `genSpaceStyle(prefixCls)` | 生成该前缀下的 CSS 文本（自定义 `prefixCls` 时自行产出样式用） |
| `prepareSpaceComponentToken(token)` | 组件 Token 的默认值计算（与 antd 的 `prepareComponentToken` 逐字相同：返回 `{}`） |
| `useCompactItemContext(prefixCls, direction)` | 紧凑项上下文（见上） |
| `NoCompactStyle` | 把子树从紧凑上下文里隔离出去 |
| `useOrientation(orientation, vertical, legacyDirection)` | 方向合并，返回 `ComputedRef<[Orientation, boolean]>` |
| `isValidOrientation(value)` | 是不是合法的方向值 |
| `isPresetSize(size)` / `isValidGapNumber(size)` | `size` 的两条判据 |
| `getStatusClassNames(prefixCls, status, hasFeedback?)` | 状态 → 类名 |

## 设计说明

### 方向的优先级

`orientation` > `vertical` > `direction`，三者都不传时兜底 `horizontal`。

⚠️ `vertical` 的判据是 `typeof vertical === 'boolean'`，**不是真值判断** ——
所以「不传」与「显式传 `false`」是两条不同的分支：显式传 `false` 会压过 `direction`。

### `align` 的默认值

水平时未传 `align` 折成 `center`；**垂直时未传保持 `undefined`**（不产生 `-align-*` 类名）。
判据是 `align === undefined`，不是真值判断。

### `separator` 与 `split`

`separator` 优先；未传时才用 `split`（判据是 `??`，所以传 `''` **不**回落）。
而分隔符**是否渲染**用的是真值判断 ⇒ `separator=""` 与 `separator={0}` 都**不渲染**。

⚠️ 最后一项是我们与 antd 的一处**行为差异**（我们多渲染了一个空的 `-item-separator`
span），已在 `COMPATIBILITY.md` §9.2 登记为缺陷差异，详见
[`README.md`](./README.md) §6。

### 子节点下标

`latestIndex` 只统计「有内容」的子节点，且 `reduce` 的初值是 `0` ⇒ 全空时不产生分隔符。
`Space` 用 `keepEmpty` 保留假值子节点的**下标**（与 React 的
`traverseAllChildren` 对齐），`Compact` 则直接丢弃。

### 组件 Token

| Token | 默认值 | 说明 |
|---|---|---|
| —— | —— | ⚠️ **Space / Compact / Addon 都没有 Component Token** |

antd 6.6.4 的三个 `ComponentToken` 都是**空接口**、`prepareComponentToken` 返回 `{}`：

```ts
// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
```

所以 `theme.components.Space` **本来就覆盖不了任何东西** —— 这不是本仓库的缺口。

`spaceGapSmallSize` / `spaceGapMiddleSize` / `spaceGapLargeSize` 三个是**内部** token
（由 `mergeToken` 从 `paddingXS` / `padding` / `paddingLG` 派生），用户不可覆盖，
它们只决定六条 `-gap-*` 规则的取值。想改预设间距的观感，改对应的 Alias token
（`--apollo-padding-xs` / `--apollo-padding` / `--apollo-padding-lg`）。

### 样式引入

```ts
import '@apollo-design/theme/tokens.css';     // 主题变量，必须先引
import '@apollo-design/ui/style.css';         // 组件样式（汇总）
```

⚠️ 按需引入 `@apollo-design/ui/space/style.css` **当前不可用** ——
`dist/space/style.css` 确实被构建出来了，但 `packages/ui/package.json` 的 `exports`
还没有暴露这条子路径（实测 `ERR_PACKAGE_PATH_NOT_EXPORTED`）。
在它补上之前，请引汇总的 `style.css`。

自定义 `prefixCls`（如 `my-app`）时用 `genSpaceStyle('my-app')` 自行产出 CSS ——
静态产物只覆盖 `apollo` 与 `ant` 两套前缀。

:::
