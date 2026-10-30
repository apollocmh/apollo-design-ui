---
category: Navigation
title: Steps
subtitle: Steps
---

A navigation bar that guides users through the steps of a task.

## When To Use

- The task is divided into sequential steps.
- Show the user where they are in the process.

## Examples

See [`demo/`](./demo) (21 demos, including native scoped slots).

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| items | Step data (`title/subTitle/content/icon/status/disabled/onClick`; VNodes via programmatic `h()`) | `StepItem[]` | — |
| type | Type | `'default' \| 'navigation' \| 'inline' \| 'panel' \| 'dot'` | `'default'` |
| variant | Variant | `'filled' \| 'outlined'` | `'filled'` |
| size | Size (`default` deprecated ⇒ `medium`) | `'small' \| 'medium' \| 'middle' \| 'default'` | `'middle'` |
| orientation | Orientation | `'horizontal' \| 'vertical'` | `'horizontal'` |
| titlePlacement | Title placement (auto-derived for dot/vertical) | `'horizontal' \| 'vertical'` | `'horizontal'` |
| current | Current step (0-based); supports `v-model:current` | `number` | `0` |
| initial | Start index | `number` | `0` |
| status | Override current step status | `'wait' \| 'process' \| 'finish' \| 'error'` | `'process'` |
| percent | Progress ring percent on the current process step | `number` | — |
| maxCount | Max visible steps (≥3, hidden ranges collapse into ellipsis steps) | `number` | — |
| responsive | Auto switch to vertical on narrow screens | `boolean` | `true` |
| ellipsis / offset | Ellipsis mode / inline offset | `boolean` / `number` | — |
| prefixCls | DOM class prefix; custom prefixes require matching static CSS | `string` | `'apollo-steps'` |
| classNames / styles | Classes/styles for ten semantic regions; functions receive current resolved props | `StepsProps['classNames']` / `StepsProps['styles']` | — |
| direction / labelPlacement / progressDot | ⚠️ Deprecated (`orientation` / `titlePlacement` / `type="dot"`) | — | — |

### Events

| Event | Description | Parameters |
|---|---|---|
| change | Requests a different step; a listener enables click and Enter/Space actions on enabled items | `(current: number)` |
| update:current | Model update request; also enables click and keyboard actions on enabled items | `(current: number)` |

The parent controls current; an event only proposes a change. The active step stays unchanged until the parent updates current. Use `v-model:current` directly or listen to `@change`, including `.once` or listener arrays. Native root change events do not invoke this business event. Root `@click` and the data-item `items.onClick` callback receive MouseEvent; disabled items do not invoke their callback.

### Slots

| Slot | Description | Props |
|---|---|---|
| #iconRender | Custom icon rendering (replaces the default icon node) | `{ iconNode, index, active, item }` |
| #itemRender | Wrap the whole step node | `{ itemNode, index, active, item }` |
| #itemWrapperRender | Wrap the wrapper layer | `{ itemNode }` |
| #progressDot | Custom dot rendering (successor of the deprecated `progressDot` function) | `{ iconNode, index, status, title, description, content }` |

> ⚠️ C8-R2: antd's `iconRender` / `itemRender` / `itemWrapperRender` / `progressDot(fn)`
> are **scoped slots only** in this library. `items` fields (`icon` etc.) are the data
> API — programmatic VNodes via `h()` are fine.

All four slots receive one named object with precise inference in native Vue templates and return VNodeChild. A present empty slot overrides the matching node; removing it restores the default. Items supply data; there is no default content slot, and the unused StepsSlots.default declaration has been removed directly. Inline content has its default Tooltip even without itemRender; custom itemRender can safely render itemNode. See the [native slot notes](../../../../docs/migrations/steps-native-slots.md).

## Design notes

- **Vue-native rebuild of the rc-steps 1.2.3 core** (Steps/Step/StepIcon/Rail +
  the useDisplaySteps collapsing algorithm).
- **maxCount collapsing**: first/last/current always kept; remaining slots filled by
  distance priority; non-contiguous ranges render as disabled ellipsis steps.
- **rail semantics**: the connector's status is **nextStatus** (leading to the next step).
- **Differences**: Wave ripple not implemented (no wave infra), `components` injection
  not wired — see the component README.

## Reactivity

Visible items, folding and active status update with items/current/initial/maxCount; click actions use the current index mapping. Native class/style are read during render and accept Vue string/object/array styles; matching styles.root values retain their existing priority. Documented classNames/styles functions receive current resolved props. Steps has no large variant, so a global large default resolves to medium.

responsive can change from false to true after mount and immediately uses the current viewport, without waiting for a resize. Disabling it restores the explicit/default orientation.

## Theme tokens

`ConfigProvider.theme.components.Steps` consumes nine fields: `descriptionMaxWidth`, `customIconFontSize`, `iconSize`, `iconFontSize`, `dotSize`, `dotCurrentSize`, `navArrowColor`, `navContentMaxWidth` and `iconSizeSM`. Current theme values are scoped to the component root and support replacement, removal and nesting. Deprecated descriptionMaxWidth retains its existing behavior. Explicit native style and styles.root override matching theme variables, with styles.root retaining the final priority. Icon data 0 renders zero; false/empty-string icons intentionally render no content. Omitting icon restores the default number.

Development version `0.0.0` removes the ineffective historical tokens `customIconSize`, `customIconTop`, `iconTop` and `titleLineHeight`. Their settings were never consumed by CSS. Use iconSize/customIconFontSize or existing semantic styles for supported customization. There is no compatibility layer or deprecation period. Vue change emits now owns notification; programmatic `h(Steps, { onChange })` and its numeric payload remain supported. Templates use `@change`.
