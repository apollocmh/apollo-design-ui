---
category: 数据展示
title: Avatar
subtitle: 头像
---

用来代表用户或事物，支持图片、图标或字符。

## 何时使用

- 需要展示用户头像、账号头像时；
- 需要以图片、图标或字符代表某个实体时。

## 代码演示

见 [`demo/`](./demo)（**9 个**，与 antd 的用户可见 demo 对应）。

| demo | 内容 |
|---|---|
| `basic` | 三种尺寸 × 两种形状 |
| `type` | 图标 / 字符 / 图片三种类型 |
| `dynamic` | 字符较长时自动调整字号（可用 `gap` 设置左右留白） |
| `badge` | 带徽标 |
| `group` | `Avatar.Group` 组合（含 `max.count` 截断） |
| `max-count` | `max.count` 包含溢出元素 |
| `fallback` | 图片不存在时的回退 |
| `toggle-debug` | 隐藏情况下计算字符对齐 |
| `responsive` | 响应式尺寸 |

⚠️ 与 antd 的 1 个 demo **未移植**（缺口见 `README.md` §5）：
`component-token`（零运行时架构下 token 是构建期产物）。

## API

### Avatar

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| shape | 形状 | `'circle' \| 'square'` | 取 `Avatar.Group` 的 `shape`，再兜底 `'circle'` |
| size | 尺寸 | `SizeType \| 'default'(废弃) \| number \| ScreenSizeMap` | 取 `Avatar.Group` 的 `size` → `ConfigProvider.componentSize` → `'medium'` |
| gap | 字符左右留白（像素） | `number` | `4` |
| src | 图片来源。字符串 ⇒ `<img>`；VNode ⇒ 原样渲染 | `VNodeChild` | — |
| srcSet | `<img>` 的 `srcset` | `string` | — |
| draggable | `<img>` 的 `draggable` | `boolean \| 'true' \| 'false'` | — |
| icon | 图标 | `VNodeChild` | — |
| alt | `<img>` 的 `alt`。⚠️ **不传会没有 alt** ⇒ 读屏与 axe 都会报 | `string` | — |
| crossOrigin | `<img>` 的 `crossorigin` | `'' \| 'anonymous' \| 'use-credentials'` | — |
| onClick | 点击回调（**prop**，不是事件） | `(e?: MouseEvent) => void` | — |
| onError | 图片加载失败回调。⚠️ **返回 `false` 阻止内置回退**（判据 `!== false`） | `() => boolean` | — |
| prefixCls / className / rootClassName / style | 常规落点 | | — |

> ⚠️ **渲染优先级是五路互斥**：字符串 `src` → `src` 是 VNode → `icon` → 字符（带缩放）→ 字符（首帧 `opacity:0`）。

### Avatar.Group

| 参数 | 说明 | 类型 |
|---|---|---|
| max | 溢出配置 | `{ count?, style?, popover? }` |
| size | 透传给所有子头像（经 context） | `AvatarSize` |
| shape | 透传给所有子头像（经 context） | `'circle' \| 'square'` |
| maxCount / maxStyle / maxPopoverPlacement / maxPopoverTrigger | ⚠️ **都已废弃**，用 `max={{ … }}` | |

> ⚠️ `max.count` 为 `0`（或 `>=` 子元素数量）时**不截断**。
> ⚠️ 子头像自己的 `size` / `shape` **覆盖** Group 透传的值。

### 实例方法（ref）

两个组件都暴露 `{ nativeElement }`（`Avatar` 是 `HTMLSpanElement`、`Avatar.Group` 是 `HTMLDivElement`）。

## Theme

### Component Token（12 个）

| token | 说明 | 默认值 |
|---|---|---|
| `containerSize` / `containerSizeLG` / `containerSizeSM` | 头像尺寸（大/小） | `controlHeight` / `controlHeightLG` / `controlHeightSM` |
| `textFontSize` / `textFontSizeLG` / `textFontSizeSM` | 头像文字大小 | `fontSize` |
| `iconFontSize` / `iconFontSizeLG` / `iconFontSizeSM` | 头像图标大小 | `Math.round((fontSizeLG + fontSizeXL) / 2)` / `fontSizeHeading3` / `fontSize` |
| `groupSpace` | 头像组间距 | `marginXXS` |
| `groupOverlapping` | 头像组重叠宽度（**负**） | `-marginXS` |
| `groupBorderColor` | 头像组边框颜色 | `colorBorderBg` |

运行时调参用 CSS 变量：`--apollo-avatar-container-size` / `--apollo-avatar-group-overlapping` 等
（12 个，变量名与 antd 的 `--ant-avatar-*` 同构）。
