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

See [`demo/`](./demo) (20 demos, one-to-one with antd's user-visible demos).

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
| current | Current step (0-based) | `number` | `0` |
| initial | Start index | `number` | `0` |
| status | Override current step status | `'wait' \| 'process' \| 'finish' \| 'error'` | `'process'` |
| percent | Progress ring percent on the current process step | `number` | — |
| maxCount | Max visible steps (≥3, hidden ranges collapse into ellipsis steps) | `number` | — |
| responsive | Auto switch to vertical on narrow screens | `boolean` | `true` |
| ellipsis / offset | Ellipsis mode / inline offset | `boolean` / `number` | — |
| onChange | Step click callback (makes steps clickable + keyboard-accessible) | `(current) => void` | — |
| direction / labelPlacement / progressDot | ⚠️ Deprecated (`orientation` / `titlePlacement` / `type="dot"`) | — | — |

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

## Design notes

- **Vue-native rebuild of the rc-steps 1.2.3 core** (Steps/Step/StepIcon/Rail +
  the useDisplaySteps collapsing algorithm).
- **maxCount collapsing**: first/last/current always kept; remaining slots filled by
  distance priority; non-contiguous ranges render as disabled ellipsis steps.
- **rail semantics**: the connector's status is **nextStatus** (leading to the next step).
- **Differences**: Wave ripple not implemented (no wave infra), `components` injection
  not wired — see `COMPATIBILITY.md` D111 / README §3.
