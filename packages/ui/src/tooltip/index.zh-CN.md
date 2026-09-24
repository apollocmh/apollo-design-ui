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

见 [`demo/`](./demo)（14 个，与 antd 用户可见 demo 一一对应；Segmented/Select
未落地 ⇒ 原生 select 替换，见各文件头）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 提示内容（`0` 合法） | `VNodeChild \| (() => VNodeChild)` | — |
| overlay | 旧版内容通道（与 `title` 同物） | 同上 | — |
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

### Expose

`forceAlign()`、`nativeElement`、`popupElement`（`TooltipRef`）。

## 设计说明

- **trigger 基建**：`_internal/trigger.ts` 组装 overlay + position + portal +
  motion（见 [`docs/analysis/tooltip.md`](../../../../docs/analysis/tooltip.md) §8）。
- **noTitle 抑制**：`title` 与 `overlay` 均未传（`title=0` 除外）⇒ 强制关闭且不发回调。
- **差异**：D77–D82（COMPATIBILITY §9.2）；缺口见 [`README.md`](./README.md) §4。
