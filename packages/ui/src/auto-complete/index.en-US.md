---
category: Data Entry
title: AutoComplete
subtitle: AutoComplete
---

Auto-complete input.

## When To Use

- An input with suggestions based on the typed content (local or remote).
- Custom filtering and rendering of options.

## Examples

See [`demo/`](./demo) (10 demos, one-to-one with antd's user-visible demos;
`custom` (custom input element) is not implemented in v1 — see README §5).

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| value / defaultValue | Current value (`v-model:value`) / default | `string` | — |
| options | Data source | `DefaultOptionType[]` | — |
| dataSource | ⚠️ Deprecated (use `options`); string / `{value,text}` mapped automatically | `DataSourceItemType[]` | — |
| placeholder | Placeholder | `string` | — |
| allowClear | Clear button | `boolean \| object` | `false` |
| disabled / size / variant / status | Same as Select | — | — |
| popupMatchSelectWidth | Popup width alignment (deprecated `dropdownMatchSelectWidth`) | `boolean \| number` | `true` |
| showSearch | `boolean` or `{ onSearch, filterOption, searchIcon }` config | — | `true` |
| filterOption | Filter predicate | `boolean \| fn` | — |
| defaultActiveFirstOption | Highlight the first option by default | `boolean` | `true` |
| backfill | Backfill the active option into the input | `boolean` | `false` |
| autoFocus / defaultOpen / open / id / tabIndex etc. | Forwarded to Select | — | — |
| onChange / onSearch / onSelect / onOpenChange / onFocus / onBlur / onClear etc. | Callbacks (prop-form) | — | — |

> ⚠️ Deprecated: `dropdownClassName` / `popupClassName` → `classNames.popup.root`,
> `dropdownStyle` → `styles.popup.root`, `onDropdownVisibleChange` → `onOpenChange`,
> `dropdownRender` / `popupRender` (fn) → the `#popupRender` slot (C8-R2).

### Slots

| Slot | Description | Props |
|---|---|---|
| #default | `ASelectOption` children form (deprecated; OPTION_MARK data conversion) | — |
| #popupRender | Custom popup content | `{ menu }` |
| #notFoundContent / #optionRender / #placeholder / #clearIcon etc. | Forwarded to Select | — |
| #suffixIcon | User slot wins; **no arrow** when absent (antd's suffixIcon={null}) | same as Select |

### Expose

`focus()` / `blur()` / `scrollTo()` (relayed to Select).

## Design notes

- **A thin wrapper over Select**: `prefixCls` reuses select (root class
  `{prefix}-select-auto-complete`); the core runs the combobox branch.
- **No dedicated styles/tokens** (token count = 0) — fully reuses select styles.
- **suffixIcon={null}**: no arrow by default (restore via your own `#suffixIcon`).
