---
title: Slider
subtitle: Slider
titleTemplate: '%s - @apollo-design/ui'
description: A slider input for selecting a value or a range of values.
---

# Slider

A slider input for selecting a value or a range of values.

## When To Use

- Selecting one or several numbers within a bounded range.
- Letting users perceive where the current value sits inside the range.
- Needing instant feedback (value updates while dragging).

## Import

```ts
import { Slider } from '@apollo-design/ui';
```

## Examples

### Basic

<code src="./demo/basic.vue"></code>

### With marks

<code src="./demo/mark.vue"></code>

### Vertical

<code src="./demo/vertical.vue"></code>

### Reverse

<code src="./demo/reverse.vue"></code>

### Disabled handle

<code src="./demo/disabled-handle.vue"></code>

### Editable

<code src="./demo/editable.vue"></code>

### Draggable track

<code src="./demo/draggable-track.vue"></code>

### Events

<code src="./demo/event.vue"></code>

### Tip formatter

<code src="./demo/tip-formatter.vue"></code>

### Show tooltip

<code src="./demo/show-tooltip.vue"></code>

### Icon slider

<code src="./demo/icon-slider.vue"></code>

### Multiple handles

<code src="./demo/multiple.vue"></code>

### With input number

<code src="./demo/input-number.vue"></code>

## API

### Slider

| Property | Description | Type | Default |
| --- | --- | --- | --- |
| value（`v-model:value`） | Current scalar/range value; null clears handles | `number \| number[] \| null` | —— |
| defaultValue | Local initial value, including null to clear | `number \| number[] \| null` | —— |
| min | 最小值 | `number` | `0` |
| max | 最大值 | `number` | `100` |
| step | 步长；`null` 表示只按 `marks` 取值 | `number \| null` | `1` |
| range | 双（多）把手；对象形态可开 `editable` / `draggableTrack` / `minCount` / `maxCount` | `boolean \| SliderRangeConfig` | `false` |
| count | Fixed interval count (count + 1 handles); editing bounds are separate | `number` | —— |
| marks | 刻度标记，值可以是 `string` / 数字 / `{ label, style }` | `SliderMarks` | —— |
| dots | 是否显示刻度点（与 `step` 联用） | `boolean` | `false` |
| included | 是否显示已选轨道 | `boolean` | `true` |
| startPoint | 已选轨道的起点值 | `number` | `min` |
| track | `false` 时不渲染已选轨道 | `boolean` | `true` |
| disabled | 整体禁用，或**逐把手**禁用（数组） | `boolean \| boolean[]` | `false` |
| keyboard | 是否响应键盘 | `boolean` | `true` |
| autoFocus | 挂载后聚焦第一个把手 | `boolean` | `false` |
| reverse | 反向（横向自右向左；纵向时自上向下） | `boolean` | `false` |
| vertical | ⚠️ 已废弃，请用 `orientation` | `boolean` | `false` |
| orientation | 朝向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| allowCross | 允许把手交叉 | `boolean` | `true` |
| pushable | 推挤间距：`true` = 一个 `step`；数字 = 该间距 | `boolean \| number` | `false` |
| formatter | tooltip 文案；`null` 表示永不显示 | `((value?: number) => VNodeChild) \| null` | 数字转字符串 |
| tooltip | tooltip 配置（`open` / `placement` / `getPopupContainer` …） | `SliderTooltipProps` | —— |
| tabIndex | 把手的 tabIndex（可传数组逐把手） | `number \| number[]` | `0` |
| ariaLabelForHandle | 把手的可访问名（可传数组） | `string \| string[]` | —— |
| ariaLabelledByForHandle | 把手的 `aria-labelledby`（可传数组） | `string \| string[]` | —— |
| ariaRequired | `aria-required` | `boolean` | —— |
| ariaValueTextFormatterForHandle | 把手的值文案（可传数组） | `(value: number) => string \| 数组` | —— |
| classNames | 语义化类名：`root` / `tracks` / `track` / `rail` / `handle` | `SliderSemanticClassNames` | —— |
| styles | 语义化样式：同上 5 槽 | `SliderSemanticStyles` | —— |
| dotStyle / activeDotStyle | 刻度点样式（可传函数按值求值） | `SliderDotStyle` | —— |
| handleStyle / trackStyle / railStyle | ⚠️ 已废弃，请用 `styles.handle` / `styles.track` / `styles.rail` | —— | —— |

### Events

| Event | Description | Arguments |
| --- | --- | --- |
| `update:value` | 值变化（`v-model:value`） | `(value: number \| number[])` |
| `change` | 值变化（与 `update:value` 同时发出） | `(value: number \| number[])` |
| `beforeChange` | First effective proposal, once per interaction | `(value: number \| number[])` |
| `changeComplete` | Final proposal when the interaction ends | `(value: number \| number[])` |
| `focus` / `blur` | Native handle focus / blur | `(event: FocusEvent, index: number)` |
| `keydown` / `keyup` | Native keyboard notification; keydown runs before internal actions | `(event: KeyboardEvent, index: number)` |

### Slots

| Slot | Description | Arguments |
| --- | --- | --- |
| `handle` | Real native handle replacement, retaining nodeProps/ref | `{ index, prefixCls, value, dragging, draggingDelete, nodeProps, className, style }` |
| `activeHandle` | Decorative active range anchor, wrapped in the default Tooltip while active | Same complete scope |

### Methods (ref)

| Method | Description |
| --- | --- |
| `focus()` | Focus the first enabled real handle |
| `blur()` | Blur the active element within Slider |

### Keyboard

| Key | Behavior |
| --- | --- |
| ← / → | −1 / +1（反向或 RTL 时翻号） |
| ↑ / ↓ | +1 / −1（纵向 `reverse` 时翻号） |
| Home / End | 到 `min` / `max` |
| PageUp / PageDown | ±2 个「候选步」（候选集合 = `step` 网格 ∪ `marks`） |
| Backspace / Delete | 删除该节点（仅 `range.editable`，且受 `minCount` 限制） |

> ⚠️ **给把手的可访问名是使用方的责任**：`role="slider"` 需要一个可访问名，组件不会替你猜
> （`0..100` 的量在业务里可能叫音量 / 进度 / 评分）。不传 `ariaLabelForHandle` 时
> axe 会报 `aria-input-field-name` —— 与 antd 一致（见 `COMPATIBILITY.md` 的 U13）。

## Design Token

| Token | Default (light) | Description |
| --- | --- | --- |
| `controlSize` | `10` | 把手与轨道的基准尺寸（`controlHeightLG / 4`） |
| `railSize` | `4` | 底轨高度 |
| `handleSize` | `10` | 把手直径 |
| `handleSizeHover` | `12` | hover 时把手直径 |
| `dotSize` | `8` | 刻度点直径 |
| `handleLineWidth` | `2` | 把手描边宽度 |
| `handleLineWidthHover` | `2.5` | hover 时描边宽度 |
| `railBg` / `railHoverBg` | `rgba(0,0,0,0.04)` / `rgba(0,0,0,0.06)` | 底轨底色 / hover |
| `trackBg` / `trackHoverBg` | `#91caff` / `#69b1ff` | 已选轨道底色 / hover |
| `handleColor` / `handleActiveColor` | `#91caff` / `#1677ff` | 把手边框 / 激活 |
| `handleActiveOutlineColor` | `rgba(22,119,255,0.2)` | 把手激活外发光 |
| `handleColorDisabled` | `#bfbfbf` | 禁用把手 |
| `dotBorderColor` / `dotActiveBorderColor` | `#f0f0f0` / `#91caff` | 刻度点边框 / 选中 |
| `trackBgDisabled` | `rgba(0,0,0,0.04)` | 禁用时的已选轨道 |

Switch themes through `ConfigProvider`'s `theme`; component styles are static CSS + CSS variables (zero runtime).

## Current native contract

value/defaultValue accept number, number[] or null (clear). Single mode emits a number and range mode emits an array. min/max/step are declared on SliderProps. count is the fixed number of intervals (count + 1 handles); range.minCount/maxCount constrain editing and do not replace that responsibility.

Updates are proposals. Rejection preserves accepted DOM/ARIA state, and withdrawal retains the last accepted value. beforeChange receives the first effective proposal once per interaction; change/update:value follow. changeComplete receives that interaction's final proposal even if the controller refused it. Unchanged keys, bare keyup, IME, native cancellation, touchcancel, invalidated gestures and teardown do not emit fabricated completion.

keydown/keyup are owned native notifications `(event: KeyboardEvent, index: number)`. keydown runs before internal actions and respects preventDefault(). Use onKeydown/onKeyup with h(), or @keydown/@keyup in templates.

handle and activeHandle receive the complete public SliderHandleInfo: required index/value/prefixCls/dragging/draggingDelete/nodeProps/className/style. nodeProps provides native HTML attributes, single native event functions and the actual element ref. Bind it to the real handle to retain focus and keyboard/ARIA behavior. activeHandle receives the actual current index and remains a decorative anchor without a slider role or keyboard events. It is wrapped by the default range Tooltip while hovered, focused or dragged, unless tooltip.open locks presentation.

The existing ref methods remain focus()/blur(); focus selects the first enabled real handle, including a custom slot node. Surviving handles retain identity through mode and Tooltip configuration changes. No nativeElement member is added.

Native class/style, data/title and ordinary listeners target the root. Style accepts Vue strings, objects and arrays. aria-* and native tabindex target actual handles; explicit tabIndex and per-handle ARIA props take precedence, while role and value metadata remain owned by Slider.

tooltip.formatter takes priority over the top-level numeric formatter; null hides tips. Tooltip prefix, placement, semantic options and explicit containers are consumed by Tooltip; its current Provider owns the default container. Slider owns visibility through native focus/hover/drag and tooltip.open. Unsupported tooltip.defaultOpen/trigger/onOpenChange/onUpdate:open and unused internal value/draggingDelete declarations are removed; draggingDelete remains on the actual handle scope.

Current components.slider className/style/classNames/styles, direction and disabled values remain reactive. All eighteen current theme.components.Slider tokens and current theme aliases project to actual root variables, with numeric lengths in px. Native root style has final priority. Custom DOM prefixes require matching static CSS.
