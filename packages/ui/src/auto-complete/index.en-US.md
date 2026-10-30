---
category: Data Entry
title: AutoComplete
subtitle: AutoComplete
---

A text input with selectable suggestions. The shared Select engine owns options, keyboard interaction, accessibility and theme behavior.

## Examples

See [`demo/`](./demo). The basic example binds three models and demonstrates keyboard backfill; options support live conditional content.

## API

### Props

| Prop | Description | Type | Default |
|---|---|---|---|
| value / defaultValue | Controlled value / initial value; `v-model:value`, with raw values from typing and selection | `SelectValue` | — |
| searchValue | Search text; `v-model:search-value` | `string` | `''` |
| open / defaultOpen | Controlled popup / initial state; `v-model:open` | `boolean` | `false` |
| options | Suggestions; explicit `[]` also takes precedence over option slots | `DefaultOptionType[]` | — |
| dataSource | Deprecated text, `{ value, text? }`, or Option/OptGroup VNodes; existing conversion is retained | `DataSourceItemType[]` | — |
| placeholder | Placeholder text; rich content uses `#placeholder` | `string` | — |
| allowClear | Clear button, icon and accessible label configuration | `SelectProps['allowClear']` | `false` |
| disabled / size / variant / status | Shared Select state and appearance | — | — |
| showSearch | Search algorithms: `filterOption/filterSort/optionFilterProp/autoClearSearchValue` | `boolean \| SelectSearchConfig` | `true` |
| filterOption | Filter receives an actual option; `false` retains all suggestions | `boolean \| (text, option) => boolean` | — |
| defaultActiveFirstOption | Activate the first suggestion; `false` waits for keyboard or pointer activation | `boolean` | `true` |
| backfill | Preview keyboard candidates; Enter/Tab or a click commits, with no value/search notifications during preview | `boolean` | `false` |
| autoFocus / maxLength / id / tabIndex | Focus, text length, ID and Tab order of the actual input | — | — |
| listHeight / listItemHeight / virtual | Option dimensions and virtualization | same as Select | — |
| popupMatchSelectWidth / placement / getPopupContainer | Popup width, placement and container, including ShadowRoot | same as Select | — |
| classNames / styles | Object or `({ props }) => object`; semantic `root/prefix/input/placeholder/content/clear/popup.{root,list,listItem}` | — | — |

Controlled updates are proposals. Rejection retains the accepted value; releasing control retains the last accepted value. Keyboard backfill is a temporary preview. Pointer activation does not backfill. Accepted value changes, typing, actual closure, removing `backfill` or disabling the control clear the preview; reopening does not restore it. Numeric `0` is a valid option value.

Default slots are classified during render, preserving conditional slots, `v-if/v-for`, dynamic groups and existing option caching. Rich `dataSource` content remains data; top-level content extension uses slots. Replacing the input with a custom input/textarea remains unsupported and produces an explicit warning. AutoComplete has no public PurePanel entry.

### Events

| Event | Payload and behavior |
|---|---|
| change / update:value | `(value, option)` / `(value)`; typing, selection or clearing commits a value |
| search / update:searchValue | `(text: string)`; search notification / model proposal; selection synchronizes search, while derived external-value synchronization does not notify twice |
| select / deselect | `(value: string \| number, option)`; option selection; combobox has no multiple-selection removal action |
| openChange / update:open | `(open: boolean)`; notification and model proposal |
| focus / blur | `(event: FocusEvent)`; actual control focus |
| clear | Clear operation |
| popupScroll / inputKeyDown | `(event: Event)` / `(event: KeyboardEvent)` |

Notifications use typed emits. The `onSearch/onChange` fields accepted by `h()` are Vue listeners, not callback Props called manually. Replace `onDropdownVisibleChange` with `@openChange`; replace `showSearch.onSearch/searchValue/searchIcon` with `@search`, the top-level search model and `#searchIcon` respectively.

### Slots

`default` (Option/OptGroup data), `prefix`, `placeholder`, `notFoundContent`, `clearIcon`, `loadingIcon`, `searchIcon`, `labelRender="{ value, label }"`, `optionRender="{ option, index }"`, `popupRender="{ menu }"`, `menuItemSelectedIcon="{ value, disabled, isSelected }"`, and `suffixIcon="{ searchValue, open, focused, showSearch, loading }"`.

Slots forward dynamically. Empty content intentionally hides the result, and numeric `0` remains visible. There is no default arrow; `#searchIcon/#loadingIcon` can customize their corresponding state.

### Attrs, Provider and theme

Native `class/style/data-*` target the selector root; `id/tabindex/role/aria-*` target the actual input. Attrs are read during rendering, classes merge once, and string/array styles and removal remain current. Fallthrough cannot replace the owned combobox mode or notification handlers.

Current `components.autoComplete` classes, styles, semantics and search/clear configuration support replacement and removal. Select and AutoComplete component configuration remain isolated; the shared engine retains global size, direction, Form and Compact contexts. Both root and teleported popup use Select Tokens; AutoComplete has no separate tokens.

### Expose

| Member | Description |
|---|---|
| focus(options?: FocusOptions) / blur() | Operate on the actual input |
| scrollTo(arg?) | Number means a pixel coordinate; items use `{ index?, key?, align? }`; the existing `{ top }` coordinate form remains supported |
| nativeElement | Actual selector root, `HTMLElement \| null` |

Retained style aliases: `dropdownMatchSelectWidth` → `popupMatchSelectWidth`, `popupClassName/dropdownClassName` → `classNames.popup.root`, and `dropdownStyle` → `styles.popup.root`. Content functions use native slots such as `#popupRender`.
