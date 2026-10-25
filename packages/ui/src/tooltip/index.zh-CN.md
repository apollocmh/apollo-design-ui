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
| onOpenChange | 开合回调（与 `update:open` 同时发出） | `(open: boolean) => void` | — |
| afterOpenChange | 动画结束回调 | `(open: boolean) => void` | — |
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
| id / onPopupClick / fresh / forceRender / disabled | 同 antd | — | — |
| classNames / styles | 语义槽 `root / container / arrow`（含函数式） | — | — |
| overlayStyle / overlayInnerStyle / overlayClassName | ⚠️ 已废弃 | — | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素（组件也可；事件与 ref 需透传到根元素） |
| title | 提示内容；存在则覆盖 title prop，空槽不回退 |

`TooltipSlots` 已导出。`TooltipPurePanel` 支持同样的 title 数据与具名槽；条件槽每轮渲染读取。

### 原生 class/style

`TooltipPurePanel` 的原生 `class/style` 作用于面板根；style 支持字符串、对象及混合数组，优先于语义根样式。移除原生 style 后恢复语义值，CSS 变量按 Vue 规则合并。

### Expose

`forceAlign()`、`nativeElement`、`popupElement`（`TooltipRef`）。

## 设计说明

- **trigger 基建**：`_internal/trigger.ts` 组装 overlay + position + portal +
  motion（见 [`docs/analysis/tooltip.md`](../../../../docs/analysis/tooltip.md) §8）。
- **C8-R2**：`overlay` 与 render-fn `title` 已删除 —— 内容走 `#title` 插槽（slot 优先）。
- **noTitle 抑制**：当前内容为空时，非受控浮层不打开且不发开合回调。受控 `open` 保留调用方状态，`0` 是有效内容；空 `#title` 不回退 prop。
- 与 antd 的已知差异见组件 README。
