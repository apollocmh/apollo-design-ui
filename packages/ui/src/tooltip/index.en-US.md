---
category: Data Display
title: Tooltip
subtitle: Tooltip
---

简单的文字提示气泡框。

## When To Use

- A simple text popup on hover/focus, for lightweight hints.

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| title | Content data (`0` is valid); use `#title` for template content | `VNodeChild` | — |
| — | ~~`overlay`~~ **已移除**（C8-R2）：富内容走 `#title` 插槽 | — | — |
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
| id | Content id referenced by the trigger's aria-describedby | `string` | Generated |
| fresh / forceRender / disabled | Update hidden content / force mounting / disable | `boolean` | `false` |
| classNames / styles | 语义槽 `root / container / arrow`（含函数式） | — | — |
| overlayStyle / overlayInnerStyle / overlayClassName | ⚠️ 已废弃 | — | — |

### Events

| Name | Payload | Description |
|---|---|---|
| update:open | `boolean` | State proposal for v-model:open |
| openChange | `boolean` | Sent with update:open; a controlled parent accepts the value |
| afterOpenChange | `boolean` | The current open/close motion completed |
| popupClick | `MouseEvent` | Original click event from the tooltip content |

These are Vue emits and support modifiers such as `@open-change.once`. In `h()`, use `onOpenChange`, `onAfterOpenChange` and `onPopupClick`. Empty content follows the suppression rules below.

### 插槽

| 名称 | 说明 |
|---|---|
| default | 触发元素（组件也可；事件与 ref 需透传到根元素） |
| title | Content; takes precedence over the title prop, including an empty slot |

`TooltipSlots` is exported. `TooltipPurePanel` accepts the same title data and named slot. Conditional slots are read during each render.

### Native class/style

`Tooltip` applies native class/style to the popup root; `TooltipPurePanel` applies them to the panel root. Styles accept strings, objects and mixed arrays and override Provider and semantic root styles. Removing them restores the current source. Use `styles.container` for the content container; root styles are never copied there. Other native Tooltip attrs and listeners apply to the trigger. Set the trigger's own class/style directly on the default slot element.

### Current theme

`ConfigProvider.theme.components.Tooltip` supports numeric `maxWidth` (default 250px) and `zIndexPopup` (default `zIndexPopupBase + 70`). Theme replacement, removal and nesting update the existing popup. Arrow shape, offsets and placement read the same current Alias Token source. Semantic styles and native CSS variables take priority. PurePanel uses the current colors and arrow values while retaining its natural panel width.

### Expose

`forceAlign()`, `nativeElement: HTMLElement | null` and `popupElement: HTMLDivElement | null` (`TooltipRef`). The latter two are current element properties; popupElement becomes null after the closed popup is destroyed.

### Development migration

Replace `:after-open-change="handler"` with `@after-open-change="handler"`, and the object key `afterOpenChange` with `onAfterOpenChange`. Native class/style now apply only to the popup root; set trigger styles on the default slot element. This development correction has no compatibility branch or deprecation period.

## 设计说明

- **trigger 基建**：`_internal/trigger.ts` 组装 overlay + position + portal +
  motion（见 [`docs/analysis/tooltip.md`](../../../../docs/analysis/tooltip.md) §8）。
- **Empty content**: an uncontrolled tooltip stays closed and sends no open-change notification. Controlled `open` remains authoritative. `0` is valid; an empty title slot never falls back to the prop.
- 与 antd 的已知差异见组件 README。
