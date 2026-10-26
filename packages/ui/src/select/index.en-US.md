---
category: Data Entry
title: Select
subtitle: Select
---

Select component to select a value from options.

## When To Use

- Pick one mutually-exclusive option (single) or several (multiple / tags).
- Use Select instead of Radio when there are more than 7 options or when filtering is needed.
- Large option sets (1000+) are virtualized by default.

## Examples

See [`demo/`](./demo) (36 native Vue demos, including live conditional options, filtering and keyboard interaction).

## Conditional options

Default-slot `SelectOption` / `SelectOptGroup` nodes are normalized during rendering, supporting conditional slots, `v-if`, `v-for` and reactive values/labels/disabled state. Explicit `options` take precedence, including `options=[]`; use `undefined` to restore the slot channel. A temporarily removed selected option keeps its cached label and refreshes when it returns. No component key/remount is required; the input and selection state persist.

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| value / defaultValue | Controlled value (`v-model:value`) / initial value | `SelectValue` | — |
| mode | Mode | `'multiple' \| 'tags'` | single |
| options | Option data (nested groups supported) | `DefaultOptionType[]` | — |
| labelInValue | `onChange` receives `{ label, value }` | `boolean` | `false` |
| showSearch | Searchable; object form configures filtering | `boolean \| SearchConfig` | `false` |
| filterOption | Custom filter (⚠️ defaults to matching by `value`, case-insensitive) | `boolean \| fn` | — |
| optionFilterProp | Filter fields (array for multi-field OR) | `string \| string[]` | `'value'` |
| filterSort | Sort the filtered options | `fn` | — |
| allowClear | Clear button (`{ clearIcon, label }` to customize) | `boolean \| object` | `false` |
| placeholder | Placeholder text (rich content via the `#placeholder` slot) | `string` | — |
| size | Size (= `SizeType`, includes `medium`) | `'small' \| 'medium' \| 'middle' \| 'large'` | `'middle'` |
| variant | Variant | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| status | Validation status | `'error' \| 'warning' \| 'success' \| 'validating'` | — |
| disabled / loading | Disabled / loading | `boolean` | `false` |
| maxCount | Max selected count (multiple / tags only) | `number` | — |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | Tag collapsing | `number` etc. | `+ N ...` |
| tokenSeparators | Token separators (array or function) | `string[] \| fn` | — |
| listHeight / listItemHeight | List max height / estimated item height | `number` | `256 / 32` |
| popupMatchSelectWidth | Popup width follows the trigger | `boolean \| number` | `true` |
| placement | Popup placement | 4 values | `'bottomLeft'` |
| open / defaultOpen | Controlled open (`v-model:open`) | `boolean` | `false` |
| fieldNames / optionLabelProp | Field mapping / backfill field | — | `label` |
| virtual | Virtual scrolling | `boolean` | `true` |
| classNames / styles | Semantic `root/prefix/suffix/input/placeholder/content/item/itemContent/itemRemove/clear/popup.{root,list,listItem}` | — | — |
| dropdownClassName / dropdownStyle / dropdownRender / dropdownMatchSelectWidth / popupClassName / bordered / showArrow / searchValue etc. | ⚠️ Deprecated | — | — |

### Events

| Event | Description | Arguments |
|---|---|---|
| change | Value changed (emitted together with `update:value`) | `(value, option)` |
| select / deselect | An option selected / deselected | `(value, option)` |
| search | Search text changed | `(value)` |
| openChange | Open state changed | `(open)` |
| focus / blur | Focus | `(event)` |
| clear | Clear clicked | — |
| popupScroll | Dropdown scrolled | `(event)` |

### Slots

`prefix` / `suffixIcon` / `loadingIcon` / `clearIcon` / `removeIcon` / `placeholder` /
`notFoundContent` / `optionRender="{ option, index }"` / `tagRender` / `labelRender` /
`popupRender="{ menu }"` / `maxTagPlaceholder="{ omittedValues }"` /
`menuItemSelectedIcon="{ value, disabled, isSelected }"` /
`default` (`Select.Option` / `Select.OptGroup` children form, deprecated but supported).

> ⚠️ antd's ReactNode props (`suffixIcon` / `notFoundContent` / `optionRender` /
> `maxTagPlaceholder` etc.) are **scoped slots only** in this library — no same-named
> props are kept (rule C8-R2).

### Methods

| Method | Description | Arguments | Returns |
|---|---|---|---|
| focus | Focus | `(options?: FocusOptions)` | — |
| blur | Blur | — | — |
| scrollTo | Scroll to an option | `(index \| { index, align, key })` | — |
| nativeElement | Root element | — | `HTMLElement` |

## Design notes

- **Vue-native rebuild of the rc-select 1.10.1 core** (engine/, five layers); no
  `-selector` wrapper in the v6 DOM.
- Known differences from antd are listed in the component README.
- ⚠️ Filtering matches by `value` by default — pass
  `showSearch: { optionFilterProp: 'label' }` to match by label.
