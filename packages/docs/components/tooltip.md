---
title: Tooltip 文字提示
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

简单的文字提示气泡框。

## 何时使用

- 鼠标移入则显示提示，移出消失，不针对复杂交互。
- 用轻量的文字提示代替貼心的复杂说明。

:::

## 代码演示

::: v-pre

**arrow**：支持显示、隐藏以及将箭头保持居中定位。

:::

<DemoPreview component="tooltip" demo="arrow" />

::: v-pre

**auto-adjust-overflow**：自动调整溢出。

:::

<DemoPreview component="tooltip" demo="auto-adjust-overflow" />

::: v-pre

**basic**：最简单的用法。

:::

<DemoPreview component="tooltip" demo="basic" />

::: v-pre

**colorful**：我们添加了多种预设色彩的文字提示样式，用作不同场景使用。

:::

<DemoPreview component="tooltip" demo="colorful" />

::: v-pre

**debug**：请开启开发者模式查看浮层的调试样式。

:::

<DemoPreview component="tooltip" demo="debug" />

::: v-pre

**destroy-on-close**：关闭后销毁浮层。

:::

<DemoPreview component="tooltip" demo="destroy-on-close" />

::: v-pre

**disabled-children**：需要soc 弹出层跟随的触发元素被禁用时，依然可以显示提示。

:::

<DemoPreview component="tooltip" demo="disabled-children" />

::: v-pre

**disabled**：进行编辑操作时提示某些内容。

:::

<DemoPreview component="tooltip" demo="disabled" />

::: v-pre

**placement**：位置有 12 个方向。

:::

<DemoPreview component="tooltip" demo="placement" />

::: v-pre

**render-panel**：以静态方式渲染面板（无触发元素）。

:::

<DemoPreview component="tooltip" demo="render-panel" />

::: v-pre

**shift**：超出滚动容器时自动移入视口（shift）。

:::

<DemoPreview component="tooltip" demo="shift" />

::: v-pre

**smooth-transition**：平滑的过渡动画（shared popup 容器场景）。

:::

<DemoPreview component="tooltip" demo="smooth-transition" />

::: v-pre

**style-class**：语义化 `classNames` / `styles`（对象与函数两种形态）。

:::

<DemoPreview component="tooltip" demo="style-class" />

::: v-pre

**wrap-custom-component**：包裹自定义组件（组件需要把事件与 ref 透传到根元素）。

:::

<DemoPreview component="tooltip" demo="wrap-custom-component" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | 提示内容（`0` 合法） | `VNodeChild \| (() => VNodeChild)` | — |
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
- **C8-R2**：`overlay` 与 render-fn `title` 已删除 —— 内容走 `#title` 插槽（slot 优先）。
- **noTitle 抑制**：`title` 与 `overlay` 均未传（`title=0` 除外）⇒ 强制关闭且不发回调。
- **差异**：D77–D82（COMPATIBILITY §9.2）；缺口见 [`README.md`](./README.md) §4。

:::
