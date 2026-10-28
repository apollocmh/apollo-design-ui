---
category: 布局
title: Space
subtitle: 间距
---

设置内容间距；用 `SpaceCompact` 连接相邻控件，用 `SpaceAddon` 插入自定义单元格。

## 代码演示

[`demo/`](./demo) 中的 15 个示例使用真实 Apollo 控件：基础、垂直、尺寸、对齐、换行、分隔符、紧凑布局、按钮组、垂直按钮组、嵌套紧凑、紧凑调试、空内容、换行间距、语义样式与 Alias 主题。

## API

### Space

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prefixCls | 完整 DOM 类名前缀 | `string` | ConfigProvider 前缀 + `-space` |
| size | 间距，数组按 `[水平, 垂直]` | `SpaceSize \| [SpaceSize, SpaceSize]` | 当前 `components.space.size`，再回落到 `'small'` |
| orientation | 排列方向，优先级最高 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 显式 false 也优先于旧 direction | `boolean` | — |
| align | 水平默认 center，垂直未传不添加对齐 | `'start' \| 'end' \| 'center' \| 'baseline'` | 水平 `'center'` |
| separator | 完整 Vue 内容数据，数字 0 会渲染 | `VNodeChild` | — |
| wrap | 启用 flex 换行；纵向换行需限制容器高度 | `boolean` | `false` |
| classNames | root/item/separator 类名，对象或接收当前 `{ props }` 的函数 | `SpaceSemanticValue<SpaceSemanticClassNames>` | — |
| styles | root/item/separator 样式，对象或接收当前 `{ props }` 的函数 | `SpaceSemanticValue<SpaceSemanticStyles>` | — |
| ~~direction~~ | 已废弃，使用 orientation | `'horizontal' \| 'vertical'` | — |
| ~~split~~ | 已废弃，使用 separator 数据或 #separator | `VNodeChild` | — |

`SpaceSize = 'small' | 'medium' | 'middle' | 'large' | number`。预设间距来自 `paddingXS` / `padding` / `paddingLG` Alias，数字按 px 设置双向 gap；0 为有效零间距，不回落到默认值。NaN 不设置 gap。

| 插槽 | 说明 |
| --- | --- |
| default | 当前内容，每个非空子节点有一个 `-item` 宿主 |
| separator | 优先于 separator 和 split 数据；存在但留空时隐藏分隔符 |

插槽在渲染时读取，支持条件插槽的新增、替换和移除。分隔符数据优先级为 `#separator` → `separator`（非 undefined）→ `split`。null、false、空字符串和注释为空内容；数字 0 是内容。只有两个有内容项之间才渲染分隔宿主。

Fragment/数组会展平，保留 keyed Fragment 的 key 作用域。合法字符串、数字和 Symbol key 以及外观更新均不改变业务子组件身份；未显式 key 的节点按位置保持身份。没有默认槽/零个子节点时不渲染根；非空列表中的空占位可保留根，但不产生 item 宿主。

### SpaceCompact

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prefixCls | 完整 DOM 类名前缀 | `string` | ConfigProvider 前缀 + `-space-compact` |
| size | 传播给子控件的尺寸 | `SizeType` | 当前 ConfigProvider.componentSize |
| orientation | 排列方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 显式布尔方向，低于 orientation | `boolean` | — |
| block | 撑满父元素宽度 | `boolean` | `false` |
| ~~direction~~ | 已废弃，使用 orientation | `'horizontal' \| 'vertical'` | — |

默认槽为真实紧凑控件；不增加控件 DOM 包装。null、布尔、注释、空文本不占首尾位置；数字 0 保留。嵌套组的首尾边界与外层合取。子控件以自己的前缀消费 `compactSize`、`compactDirection`、`isFirstItem`、`isLastItem`。对于支持尺寸的控件，显式 size 优先于当前 compactSize，再回落到 Provider 尺寸。

`useCompactItemContext(prefixCls, direction)` 返回三个 ComputedRef：`compactSize`、`compactDirection`、`compactItemClassnames`。水平类名为 `-compact-item` / `-compact-first-item` / `-compact-last-item`，纵向为 `-compact-vertical-*`，RTL 添加对应 item-rtl。`NoCompactStyle` 用 null 隔离当前子树，邻近实例不受影响；被隔离控件回落到自身/Provider 配置。

### SpaceAddon

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prefixCls | 完整 DOM 类名前缀 | `string` | ConfigProvider 前缀 + `-space-addon` |
| variant | 单元格外观 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| disabled | 单元格的装饰禁用态，子控件仍自行控制 disabled | `boolean` | `false` |
| status | 校验外观 | `'error' \| 'warning' \| 'success' \| 'validating' \| ''` | — |

默认槽接收完整 Vue 内容。Addon 使用当前 Compact 尺寸和首尾边界；outlined/filled 的横向、纵向、RTL 连接保留外侧圆角，单项保留四角。underlined 为透明背景、零圆角的单独底线，使用当前 lineWidth/lineType；borderless 无边框。error/warning 文字由现有 colorErrorText/colorWarningText 与 colorText 等量混合派生，outlined 边框及 underlined 底线保留状态色。disabled 文字色优先于状态文字色，不移除底线或状态边框色；filled + disabled 恢复禁用背景。success/validating 保留状态类，不额外改变颜色。

### 原生 attrs、ref 与配置

三个组件的 `class`、`style`、原生监听器、data-*、ARIA 等 attrs 落在根 div；原生 style 支持 Vue 对象、字符串和数组。没有业务 emits 或 v-model，也不添加列表/表单语义。交互语义由实际按钮/输入控件承担。

三个 ref 仅开放 `nativeElement: HTMLDivElement | null`。挂载前及 Space/Compact 无内容时为 null；Addon 始终有根。

Space 配置为 `ConfigProvider :components="{ space: { size, className, style, classNames, styles } }"`。配置替换和移除即时生效。类名拼接；样式按 Provider semantic → Provider root style → 本地 semantic → 原生 attrs 合并。语义函数收到当前合并的 size/orientation/align，不是 setup 快照。

### 主题与导出

Space / Compact / Addon 当前没有 ComponentToken，`prepareSpaceComponentToken` 返回 `{}`。使用已有 Alias token 调整间距、字体、线宽、圆角与 Addon 颜色；不新增 `theme.components.Space` 字段。当前主题 Alias 同时支持 ConfigProvider、ThemeProvider、嵌套作用域及 SSR；根原生 style 中的变量覆盖优先。

```ts
import { Space, SpaceCompact, SpaceAddon } from '@apollo-design/ui';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/space/style.css';
```

真实 Button/Input/Select 等控件还需各自 CSS，或使用汇总 `@apollo-design/ui/style.css`。

保留 `Space.Compact` / `Space.Addon` 静态别名，以及 `ASpace` / `ASpaceCompact` / `ASpaceAddon` 各自安装名。公开类型包括 SpaceProps/Ref/Size/Align/Slot/Config、SpaceCompactProps/Ref/ItemContextType、SpaceAddonProps/Ref 和既有语义类型。公开上下文和工具导出保持不变。

`prefixCls` 只改变 DOM 命名，不自动生成任意前缀 CSS。`genSpaceStyle('brand')` 生成 `.brand-space`、`.brand-space-compact`、`.brand-space-addon` 的静态 CSS；全局 Provider 前缀应与预先生成的 CSS 对应。默认产物为 apollo 前缀。

本轮行为调整及旧写法见 [迁移说明](../../../../docs/migrations/space-contracts.md)。
