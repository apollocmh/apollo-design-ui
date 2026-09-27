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

See [`demo/`](./demo) (35 demos, one-to-one with antd's user-visible demos).

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
| placeholder | Placeholder | — | — |
| size | Size | `'small' \| 'middle' \| 'large'` | `'middle'` |
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
| optionRender / tagRender / labelRender / popupRender | Custom renderers (same-named scoped slots also provided; prop wins) | `fn` | — |
| notFoundContent | Empty content (not rendered in combobox) | — | `<Empty>` |
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

`prefix` / `suffixIcon` / `clearIcon` / `removeIcon` / `placeholder` / `notFoundContent` /
`optionRender` / `tagRender` / `labelRender` / `popupRender` / `maxTagPlaceholder` /
`default` (`Select.Option` / `Select.OptGroup` children form, deprecated but supported).

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
- **Differences**: D106–D110 (COMPATIBILITY §9.2); gaps see [`README.md`](./README.md) §5.
- ⚠️ Filtering matches by `value` by default — pass
  `showSearch: { optionFilterProp: 'label' }` to match by label.
