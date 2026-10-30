---
category: 数据展示
title: Tooltip
subtitle: 文字提示
---

简单的文字提示气泡框。

## 何时使用

- 鼠标移入则显示提示，移出消失，不针对复杂交互。
- 用轻量的文字提示代替貼心的复杂说明。

## 代码演示

见 [`demo/`](./demo)（15 个，覆盖 antd 的主要用户场景；Segmented/Select
未落地 ⇒ 原生 select 替换，见各文件头）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 提示内容数据（`0` 合法）；模板富内容使用 `#title` | `VNodeChild` | — |
| open / defaultOpen | 受控开合（`v-model:open` 等价）/ 非受控初值 | `boolean` | `false` |
| trigger | 触发动作 | `'hover' \| 'click' \| 'focus' \| 'contextMenu' \| 数组` | `'hover'` |
| placement | 位置（12 个） | `TooltipPlacement` | `'top'` |
| arrow | 箭头（`false` 隐藏 / `{ pointAtCenter }` 指中心） | `boolean \| object` | `true` |
| color | 预设色或自定义 CSS 颜色 | `string` | — |
| autoAdjustOverflow | 溢出自动调整 | `boolean \| AdjustOverflow` | `true` |
| mouseEnterDelay / mouseLeaveDelay | 延迟（秒） | `number` | `0.1` |
| getPopupContainer / getTooltipContainer | 挂载容器 | `(node) => HTMLElement` | `body` |
| openClassName | 开启时触发元素追加的类名 | `string` | `` `{p}-open` `` |
| destroyOnHidden | 关闭后卸载 portal | `boolean` | `false` |
| destroyTooltipOnHide | ⚠️ 已废弃，用 `destroyOnHidden` | `boolean \| object` | — |
| motion | 动画（仅 motionName 可覆盖） | `{ motionName?: string }` | `apollo-zoom-big-fast` |
| zIndex | 层级（未传走 useZIndex 层叠体系） | `number` | `1070` |
| id | 提示内容 id，供触发元素的 aria-describedby 引用 | `string` | 自动生成 |
| fresh / forceRender / disabled | 关闭时更新内容 / 强制挂载 / 禁用 | `boolean` | `false` |
| classNames / styles | 语义槽 `root / container / arrow`（含函数式） | — | — |
| overlayStyle / overlayInnerStyle / overlayClassName | ⚠️ 已废弃 | — | — |

### 事件

| 名称 | 载荷 | 说明 |
|---|---|---|
| update:open | `boolean` | `v-model:open` 的状态提议 |
| openChange | `boolean` | 与 update:open 同时通知，受控值由父级接受 |
| afterOpenChange | `boolean` | 本次开合动画完成 |
| popupClick | `MouseEvent` | 点击提示内容的原始事件 |

事件使用 Vue emits，支持 `@open-change.once` 等修饰符。`h()` 使用 `onOpenChange`、`onAfterOpenChange` 和 `onPopupClick`；空内容仍遵循下述抑制规则。

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素（组件也可；事件与 ref 需透传到根元素） |
| title | 提示内容；存在则覆盖 title prop，空槽不回退 |

`TooltipSlots` 已导出。`TooltipPurePanel` 支持同样的 title 数据与具名槽；条件槽每轮渲染读取。

### 原生 class/style

`Tooltip` 的原生 `class/style` 作用于浮层根；`TooltipPurePanel` 作用于面板根。style 支持字符串、对象及混合数组，优先于 Provider 和语义根样式；移除后恢复当前来源。容器样式使用 `styles.container`，不会从根复制。Tooltip 的其他原生 attrs 和监听器作用于触发元素，触发元素自己的 class/style 写在默认槽子节点上。

### 当前主题

`ConfigProvider.theme.components.Tooltip` 支持 `maxWidth`（数字，默认 250px）和 `zIndexPopup`（数字，默认 `zIndexPopupBase + 70`）。替换、撤回和嵌套主题即时更新现有浮层。箭头形状、偏移与定位读取同一份当前 Alias Token；语义样式和原生 CSS 变量覆盖优先。PurePanel 使用当前主题的颜色和箭头，其静态面板保留自然宽度。

### Expose

`forceAlign()`、`nativeElement: HTMLElement | null`、`popupElement: HTMLDivElement | null`（`TooltipRef`）。后两者是当前元素属性；关闭并销毁浮层后 popupElement 为 null。

### 开发版迁移

原 `:after-open-change="handler"` 改为 `@after-open-change="handler"`，对象写法由 `afterOpenChange` 改为 `onAfterOpenChange`。原生 class/style 现在只作用于浮层根；要设置触发元素，请直接写在默认槽元素上。当前开发版直接修正，无兼容分支或弃用期。

## 设计说明

- **trigger 基建**：`_internal/trigger.ts` 组装 overlay + position + portal +
  motion（见 [`docs/analysis/tooltip.md`](../../../../docs/analysis/tooltip.md) §8）。
- **C8-R2**：`overlay` 与 render-fn `title` 已删除 —— 内容走 `#title` 插槽（slot 优先）。
- **noTitle 抑制**：当前内容为空时，非受控浮层不打开且不发开合回调。受控 `open` 保留调用方状态，`0` 是有效内容；空 `#title` 不回退 prop。
- 与 antd 的已知差异见组件 README。
