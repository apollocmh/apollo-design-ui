---
category: Other
title: ConfigProvider
subtitle: Global Configuration
---

Unified runtime configuration for the whole subtree: **theme**, **locale**, **size**, **disabled**, and **prefixCls**.

## When to use

- Wrap once at the app root (or at a major feature boundary) so every descendant component follows.
- Switching language, dark theme, compact mode, or the global class prefix all starts here.
- Override defaults for any component (`Empty.description`, `Spin.indicator`, …) via the `components.xxx` field.

## Demos

See [`demo/`](./demo) — 5 demos: prefix-cls / locale / component-config / size-disabled / theme.

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| prefixCls | Global class-name prefix | `string` | `'apollo'` |
| iconPrefixCls | Icon class-name prefix | `string` | `'anticon'` (aligned with antd) |
| getPopupContainer | Parent for floating UI (popovers, tooltips, …) | `(trigger?: HTMLElement) => HTMLElement \| ShadowRoot` | — |
| getTargetContainer | Resolver for "screen-aware" containers (notification, message, …) | `() => HTMLElement \| Window \| ShadowRoot` | — |
| renderEmpty | Custom empty-state renderer. Called by Table / List / Select etc. when there's nothing to show | `(componentName?: 'Table' \| 'Table.filter' \| 'List' \| 'Select' \| 'TreeSelect' \| 'Cascader' \| 'Transfer' \| 'Mentions') => unknown` | `defaultRenderEmpty` |
| componentSize | Unified size for descendant components | `'small' \| 'medium' \| 'middle' \| 'large'` | — |
| componentDisabled | Unified disabled flag for descendants | `boolean` | — |
| direction | Text direction | `'ltr' \| 'rtl'` | — |
| locale | Language pack | `Locale` (from `@apollo-design/locale`) | — |
| theme | Theme config | `{ token?: Record<string, any>; components?: Record<string, any>; algorithm?: MappingAlgorithm; cssVarPrefix?: string; prefixCls?: string; inherit?: boolean }` | — |
| csp | CSP nonce | `{ nonce?: string }` | — |
| variant | Component variant | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | — |
| virtual | Enable virtual scrolling | `boolean` | `true` |
| popupMatchSelectWidth | Make dropdown match trigger width | `boolean` | — |
| popupOverflow | Behavior when popups overflow viewport | `'viewport' \| 'scroll'` | — |
| wave | Wave (ripple) effect | `{ disabled?: boolean; triggerType?: 'click' \| 'pointerdown' \| ... }` | — |
| warning | Dev-warning toggle | `{ strict?: boolean; false?: boolean; ... }` | `{}` |
| form | Form config | `{ validateMessages?: ValidateMessages \| ((values) => ValidateMessages); requiredMark?: boolean; colon?: boolean }` | — |
| divider | Default props for `Divider` | `Partial<DividerProps>` | — |
| empty | Default props for `Empty` | `Partial<EmptyProps>` | — |
| spin | Default props for `Spin` | `Partial<SpinProps>` | — |
| components | Escape hatch (loosely typed) for the other 53 components' default props | `Record<string, any>` | — |

### Deprecated

| Old | New |
|---|---|
| `autoInsertSpaceInButton` | `components.button.autoInsertSpace` |
| `dropdownMatchSelectWidth` | `popupMatchSelectWidth` |

### Static / Named exports

| Name | Description |
|---|---|
| `ConfigProvider.ConfigContext` | `useContext`-shaped context. Prefer `useConfig` in most cases |
| `ConfigProvider.config` | `getConfig()`: returns the current `ConfigContext` |
| `ConfigProvider.useConfig` | `useConfig()`: returns `{ componentDisabled, componentSize }` |

## Differences from antd

Full list in [`docs/analysis/config-provider.md` §9](../../../../../../../docs/analysis/config-provider.md). Highlights:

- **`components` is progressive-typed**: precise props for the three landed components (`divider` / `empty` / `spin`); the other 53 go through a loosely-typed `Record<string, any>` escape hatch until they land.
- **`theme` inserts a `display: contents` scope element to carry the CSS variables**. Zero layout impact, but in Chromium's `#stage` inline container this adds 1px to the stage height (D32, not fixed).
- **`direction` must be read via `useDirection()`**: `inject` resolves only once during setup; destructuring from `useComponentConfig()` gives you a stale snapshot.
- **No** `tooltip` / `popover` / `popconfirm` prop (depends on the unimplemented `UniqueProvider`).