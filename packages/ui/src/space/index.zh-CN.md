---
category: 布局
title: Space
subtitle: 间距
---

设置组件之间的间距。

## 何时使用

- 避免组件紧贴在一起，拉开统一的空间。
- 适合行内元素的水平间距。
- 可以设置各种水平对齐方式。
- 需要表单组件之间紧凑连接且合并边框时，使用 `Space.Compact`。

## 代码演示

见 [`demo/`](./demo)（15 个，与 antd 的**用户可见** demo 一一对应）。

| demo | 内容 |
|---|---|
| `base` | 基础用法：三个按钮之间的默认间距 |
| `vertical` | 垂直间距：`orientation="vertical"` + 三张卡片 |
| `size` | 间距尺寸 `small` / `medium` / `large` 与数字 `24` |
| `align` | 对齐方式 `center` / `start` / `end` / `baseline` |
| `wrap` | 自动换行 + `size={[8, 16]}` 的行距 |
| `separator` | 分隔符：传字符串与传 `Divider`（垂直）两条路径 |
| `compact` | 紧凑布局：`block`、两个输入、输入 + 按钮 |
| `compact-buttons` | 紧凑按钮组 |
| `compact-button-vertical` | 垂直紧凑按钮组 |
| `compact-nested` | 嵌套紧凑布局（首项/末项判据要跨层合取） |
| `compact-debug` | 紧凑布局调试（假值子节点与 `compactSize` 落点） |
| `debug` | 假值子节点（`null` / `false` / `0`）的下标语义 |
| `gap-in-line` | 换行时的行距 |
| `style-class` | 语义化 `classNames` / `styles` |
| `component-token` | 组件 Token（⚠️ 上游本来就没有 token，见「设计说明」） |

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
| className | 根元素类名 | `string` | — |
| rootClassName | 也落在根元素上（在 `className` **之后**） | `string` | — |
| style | 根元素内联样式。**会覆盖 `styles.root`** | `CSSProperties` | — |
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
  → className / rootClassName / style（落在根元素）
```

其中 **`style` 会覆盖 `styles.root`**（antd 的合并顺序如此，我们逐条对齐）。

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
| className | 根元素类名 | `string` | — |
| rootClassName | 也落在根元素上（在 `className` **之后**） | `string` | — |
| style | 根元素内联样式 | `CSSProperties` | — |
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
| className | 根元素类名 | `string` | — |
| style | 根元素内联样式 | `CSSProperties` | — |

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
