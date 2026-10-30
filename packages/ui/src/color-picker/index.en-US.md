---
category: Data Entry
title: ColorPicker
subtitle: ColorPicker
---

A color selection component: clicking the trigger opens a picking panel that supports
single colors / gradients, preset palettes and multiple encoding formats.

## When To Use

- When the user needs to pick a color (or a gradient);
- When a preset palette lets the user pick a color quickly;
- When a color value must be maintained in a **controlled** way inside a form.

## Examples

See [`demo/`](./demo) (**16** demos, mirroring antd's user-visible demos).

| demo | Description |
|---|---|
| `base` | The simplest usage (`defaultValue` + trigger) |
| `size` | Trigger sizes `small` / default / `large` (with `showText`) |
| `controlled` | Two controlled rhythms: `value` + `@change` / `@changeComplete` |
| `line-gradient` | `mode` single / gradient (can be an array) |
| `text-render` | Default text and the #showText scoped slot |
| `disabled` | Disabled state |
| `disabled-alpha` | `disabledAlpha` removes transparency |
| `allowClear` | Clear entry and the "cleared" state |
| `trigger` | Custom trigger via the default slot |
| `trigger-event` | `trigger="hover"` |
| `format` | `format` as `hex` / `hsb` / `rgb` |
| `presets` | Grouped preset colors |
| `presets-line-gradient` | Gradient preset colors |
| `panel-render` | `panelRender` takes over the panel |
| `style-class` | `classNames` / `styles` as objects or functions |
| `pure-panel` | Static panel via `ColorPickerPurePanel` |

⚠️ The upstream `_semantic` demo (the "semantic DOM" illustration, `simplify`-only) is
**not ported**; semantic-slot coverage is handled by `semantic.test.ts`.

## API

Native class, id, ARIA and mouse listeners target the trigger. Known Vue event keys such as `@mousedown` retain their Once/Passive/Capture suffixes. Attr-only updates read current values and listener replacement does not duplicate calls.

### Props

| Property | Description | Type | Default | Global config |
|---|---|---|---|---|
| mode | Mode: single / gradient (an array enables both) | `'single' \| 'gradient' \| ModeType[]` | `'single'` | × |
| value | Controlled value (use with `v-model:value`) | `ColorValueType` | — | × |
| defaultValue | Uncontrolled initial value. **Omitting both ⇒ the "cleared" state** | `ColorValueType` | — | × |
| format | Current encoding format (use with `v-model:format`) | `'hex' \| 'rgb' \| 'hsb'` | `'hex'` | × |
| defaultFormat | Uncontrolled initial format | `'hex' \| 'rgb' \| 'hsb'` | — | × |
| disabledFormat | Disable the format dropdown (the dropdown is gone, the input remains) | `boolean` | `false` | × |
| open | Controlled open state (use with `v-model:open`) | `boolean` | — | × |
| trigger | Trigger mode | `'click' \| 'hover'` | `'click'` | × |
| placement | Popup placement | `TriggerPlacement` | `'bottomLeft'` | × |
| arrow | Whether to show the arrow | `boolean \| { pointAtCenter?: boolean }` | from ConfigProvider | ✅ |
| getPopupContainer | Container to mount the popup into | `(triggerNode: HTMLElement) => HTMLElement` | — | × |
| autoAdjustOverflow | Auto-adjust on overflow | `boolean` | `true` | × |
| destroyTooltipOnHide | ⚠️ **Deprecated**, use `destroyOnHidden` | `boolean \| { keepParent?: boolean }` | `false` | × |
| destroyOnHidden | Unmount the popup after closing | `boolean` | `false` | × |
| allowClear | Whether clearing is allowed | `boolean` | `false` | × |
| disabledAlpha | Disable alpha (the panel drops the alpha slider and input; a semi-transparent color is forced opaque) | `boolean` | `false` | × |
| presets | Preset panel (only an **array** renders it, plus an extra `Divider`) | `PresetsItem[]` | — | × |
| showText | Show default text; customize it with #showText | `boolean` | `false` | × |
| size | Size | `'small' \| 'middle' \| 'large' \| string` | from ConfigProvider | ✅ |
| disabled | Disabled | `boolean` | from ConfigProvider | ✅ |

| classNames | Semantic class names (`root` / `body` / `content` / `description` / `popup`); function form supported | `ColorPickerSemanticClassNames \| ((info) => …)` | — | ✅ |
| styles | Semantic styles (6 slots — one more than `classNames`: `popupOverlayInner`); function form supported | `ColorPickerSemanticStyles \| ((info) => …)` | — | ✅ |
| prefixCls | Class name prefix | `string` | from ConfigProvider, fallback `apollo-color-picker` | × |
| class / style | Native attrs target the actual trigger; use popup.root for the popup | Vue class / StyleValue | — | × |

#### ColorValueType

```ts
type SingleValueType = AggregationColor | string;
type LineGradientType = { color: SingleValueType; percent: number }[];
type ColorValueType = SingleValueType | null | LineGradientType;
```

⚠️ **"Cleared" is not `null`** — it is a color instance with alpha=0 and
`cleared = true`. The trigger switches between `ColorClear` (transparent checkerboard)
and `ColorBlock` (a color swatch) based on it.

Color instance numeric inputs are unsigned 24-bit RGB integers. Object channels accept finite numbers and numeric strings; HSB s/b use 0–1. Invalid numeric inputs throw instead of becoming a default color.

#### PresetsItem

| Property | Description | Type | Default |
|---|---|---|---|
| label | Group title | `VNodeChild` | — |
| colors | Colors of this group (strings / color instances / **gradients**) | `(string \| AggregationColor \| LineGradientType)[]` | — |
| defaultOpen | Whether the group is expanded initially | `boolean` | `true` |
| key | Group key (falls back to the index) | `string \| number` | — |

### Events

| Event | Description | Parameters |
|---|---|---|
| update:value | The update channel of `v-model:value` (**emitted together with** `change`) | `(value: Color)` |
| change | Value change. ⚠️ The second argument is the CSS string from `toCssString()` | `(value: Color, css: string)` |
| changeComplete | Value change **complete**. ⚠️ **Not emitted while dragging** | `(value: Color)` |
| clear | Clear | — |
| update:open | The update channel of `v-model:open` (**emitted together with** `openChange`) | `(open: boolean)` |
| openChange | Open state change | `(open: boolean)` |
| update:format | The update channel of `v-model:format` (**emitted together with** `formatChange`) | `(format?: ColorFormatType)` |
| formatChange | Format change. ⚠️ **Not emitted for an identical value** | `(format?: ColorFormatType)` |

### Slots

| Slot | Description | Parameters |
|---|---|---|
| default | Trigger content (equivalent to upstream `children`). Providing it **completely replaces** the built-in trigger | — |
| panelRender | Custom panel; panel is a stable Vue component reference | `{ panel: Component; extra: ColorPickerPanelRenderExtra }` |
| showText | Complete trigger text from the current slot | `{ color: Color }` |

`extra.components` provides two component references `{ Picker, Presets }` so a custom
panel can lay them out freely:

```vue
<script setup lang="ts">
import { ColorPicker } from '@apollo-design/ui';
</script>

<template>
  <ColorPicker default-value="#1677ff">
    <template #panelRender="{ panel }">
      <section>
        <p>Color Picker</p>
        <component :is="panel" />
      </section>
    </template>
    <template #showText="{ color }">{{ color.toHexString() }}</template>
  </ColorPicker>
</template>
```

### Methods

This round adds no methods or Expose API.

### Design Token

**Component Tokens users can override: 0** (same as antd).

This port declares upstream's 9 `mergeToken` derived values as
`--apollo-color-picker-*` (**not user-overridable**; an intentional difference, see
`README.md` §2 / §4):

| Variable | Value |
|---|---|
| `--apollo-color-picker-width` | `234px` |
| `--apollo-color-picker-handler-size` | `16px` |
| `--apollo-color-picker-handler-size-sm` | `12px` |
| `--apollo-color-picker-alpha-input-width` | `44px` |
| `--apollo-color-picker-input-number-handle-width` | `16px` |
| `--apollo-color-picker-preset-color-size` | `24px` |
| `--apollo-color-picker-inset-shadow` | `inset 0 0 1px 0 var(--apollo-color-text-quaternary)` |
| `--apollo-color-picker-slider-height` | `8px` |
| `--apollo-color-picker-preview-size` | `calc(var(--apollo-color-picker-slider-height) * 2 + var(--apollo-margin-sm))` |

### Semantic DOM

| Slot | Lands on |
|---|---|
| `root` | The native trigger button, or the custom trigger host |
| `body` | The swatch / transparent checkerboard inside the trigger |
| `content` | The **inner** layer of the swatch (`ColorBlock`'s inner) |
| `description` | The text container next to the trigger |
| `popup.root` | The popup root (**nested slot**) |
| `popupOverlayInner` | ⚠️ **`styles` only**, mapped to Popover's `styles.container` |

⚠️ `classNames` has 5 slots while `styles` has 6 — **intentionally asymmetric**
(matching upstream).

## FAQ

### Why is the trigger a transparent checkerboard when `defaultValue` is omitted?

Because upstream's default value is literally "cleared": `useModeColor` receives
`undefined`, so `AggregationColor` takes the `cleared` branch (alpha=0). Pass an explicit
`defaultValue` to see a color.

### Why does `disabledAlpha` rewrite a semi-transparent color?

Upstream behavior: under `disabledAlpha`, if the current color has `alpha < 100`, the
value received by `change` / `changeComplete` is rewritten to opaque by `genAlphaColor`
(and a dev-time warning is emitted).

### Development migration

- Replace the panelRender function prop with #panelRender. Its panel value is now a stable Vue component reference, rendered with <component :is="panel" />.
- showText accepts boolean. Use #showText for custom content; its scope contains the current color, including conditional and empty slots.
- Default triggers, preset choices and clear actions use native buttons. The cleared trigger graphic is decorative. The original reference remains intact; semantic tests derive only these reviewed differences.
- size uses the shared SizeType. Native class/style target the trigger; customize popup.root and popupOverlayInner for popup targets.
- Rejected controlled open/format requests do not leak into uncontrolled state. disabledAlpha normalizes each incoming gradient stop while preserving the cleared action.
- PurePanel presents the actual panel in normal flow, forwarding native host attrs, its panelRender slot and Vue events without size polling.
