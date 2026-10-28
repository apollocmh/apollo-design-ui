---
category: General
title: Typography
subtitle: Typography
---

Titles, paragraphs, inline text and links with copy, edit and ellipsis controls.

## Examples

The 14 demos cover formatting, five heading levels, semantic colours, copying, editing, controlled expansion, middle ellipsis, suffixes, component tokens, semantic styling and a Table consumer.

## API

```ts
import { Typography, Text, Title, Paragraph, Link } from '@apollo-design/ui';
import '@apollo-design/ui/style.css';
```

Named exports are identical to `Typography.Text / Title / Paragraph / Link`. The component stylesheet is `@apollo-design/ui/typography/style.css`; applications also need theme and base styles.

### Components and content

| Component | Native root | Features |
|---|---|---|
| Typography | article; component selects another tag | Container and semantic styling |
| Text | span | Decorations, copy, edit, single-line ellipsis |
| Title | h1…h5; level defaults to 1 | Decorations, copy, edit, ellipsis |
| Paragraph | div | Decorations, copy, edit, multiline ellipsis |
| Link | span containing a native anchor | Link, decorations, copy, edit, boolean ellipsis |

All five accept a default slot containing text, Fragments, conditional nodes, elements and Vue components. The four fixed semantic components exclude component; use Typography for a custom container tag. Title excludes strong.

Link places copy/edit buttons beside its anchor. href, target, rel, link ARIA, tabindex and native events reach the anchor; id, class, style and expose belong to the outer root. A blank target supplies noopener noreferrer unless rel is explicitly provided. Disabled links expose aria-disabled, leave the Tab order and block activation.

### Shared props and native attrs

| Prop | Type / default | Meaning |
|---|---|---|
| prefixCls | string | Current ConfigProvider prefix; apollo-typography by default |
| direction | 'ltr' \| 'rtl' | Current Provider direction |
| classNames | object or ({ props }) => object | root / actions / action / textarea classes |
| styles | object or ({ props }) => object | CSSProperties for the same semantic nodes |
| component | string; article | Typography only |

Root class, style, id and data attributes use native Vue attrs, including replacement and removal. Classes merge; native style overrides styles.root. Semantic callbacks receive BaseTypographyProps. ConfigProvider components.typography supports class, style and semantic configuration; replacing or removing it preserves business slot and editor identity.

### Text / Title / Paragraph / Link props

| Prop | Type / default | Meaning |
|---|---|---|
| type | 'secondary' \| 'success' \| 'warning' \| 'danger' | Semantic text colour |
| disabled | boolean; false | Disabled styling; Link also blocks activation |
| copyable | boolean \| CopyConfig | Copy control |
| editable | boolean \| EditConfig | Inline editor |
| ellipsis | boolean \| EllipsisConfig | Text excludes rows / expandable / onExpand; Link accepts only boolean |
| strong / underline / delete / code / mark / keyboard / italic | boolean; false | Decorations; Title excludes strong |
| actions | { placement?: 'start' \| 'end' } | Operation placement; end by default |
| title | string | Native title and ellipsis title candidate |
| level | 1 \| 2 \| 3 \| 4 \| 5; 1 | Title only |
| target / rel | string | Link only; href is a native attr |

### CopyConfig

| Field | Type / default | Behaviour |
|---|---|---|
| text | string \| (() => string \| Promise<string>) | Content text when absent; an empty string copies empty text |
| onCopy | (event?: MouseEvent) => void | Called only after a successful write |
| icon / tooltips | VNodeChild \| [VNodeChild, VNodeChild] | Exactly two array entries are a before/after pair; other lengths remain complete content |
| format | 'text/plain' \| 'text/html' | Clipboard format |
| tabIndex | number | Copy button Tab order |

False tooltips disable the popup. Defaults use the current locale. Pending requests reject duplicate activation. Failures do not report success, and unmount prevents late state updates and callbacks. Custom icons keep a native button and accessible name.

### EditConfig

| Field | Type / default | Behaviour |
|---|---|---|
| text | string | Initial editor text; otherwise recognisable plain content |
| editing | boolean | Controlled editing state; omit for uncontrolled use |
| onStart / onCancel / onEnd | () => void | Enter editing, cancel, Enter-save completion |
| onChange | (value: string) => void | Save on Enter or blur; trim outer whitespace, preserve internal newlines |
| icon / tooltip / enterIcon | VNodeChild | Edit icon, full tooltip content and confirm icon; false tooltip disables it, null enterIcon hides it |
| triggerType | ('icon' \| 'text')[]; ['icon'] | Text-only mode retains a native keyboard entry |
| autoSize | boolean \| { minRows?: number; maxRows?: number }; true | Resize for content, width and current configuration |
| maxLength / tabIndex | number | Editor limit / edit button Tab order |

Enter saves and Escape cancels. Modified Enter retains native multiline behaviour; IME composition never submits. Controlled callbacks request a transition; the parent decides whether to close. Accepted keyboard completion restores edit-button focus; blur to another control preserves that destination.

aria-label, aria-labelledby and aria-describedby reach the textarea. Without a supplied name, plain content or the current locale supplies one. Root attrs and expose remain available while editing.

### EllipsisConfig

| Field | Type / default | Behaviour |
|---|---|---|
| rows | number; 1 | Floor positive finite values; otherwise use 1 |
| expandable | boolean \| 'collapsible'; false | Enable expansion; collapsible also allows collapse |
| suffix | string | Content after ellipsis |
| symbol | VNodeChild \| ((expanded: boolean) => VNodeChild) | Expand/collapse label |
| expanded / defaultExpanded | boolean | Controlled state / uncontrolled initial state |
| onExpand | (event: MouseEvent, info: { expanded: boolean }) => void | Expansion request |
| onEllipsis | (ellipsis: boolean) => void | Actual ellipsis-state changes |
| tooltip | VNodeChild \| { title?: VNodeChild } | True uses original content; false disables it |

Simple cases use CSS. Operations, suffixes and expansion use actual width measurement. Hidden probes project mounted native content without mounting business Vue components again. Width, rows, content and font changes remeasure; obsolete and unmounted work is cancelled.

### Slots, events, models and expose

The only slot is default. There are no component emits or v-model bindings; edit and expansion use their configuration values and callbacks. The readonly TypographyRef.nativeElement exposes the actual current root or null, including editing; Link exposes its outer root.

### Component tokens

Set theme.components.Typography on ConfigProvider. Numbers become px; zero, replacement and removal work.

| Token | Default | Consumer |
|---|---|---|
| titleMarginTop | 1.2em | Top margin of headings following content |
| titleMarginBottom | 0.5em | Heading bottom margin |

Default semantic and operation text follows the current colour scheme with readable contrast. Native style is an explicit override; custom foregrounds require an appropriate background.
