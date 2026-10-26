---
category: Feedback
title: Result
subtitle: Result
---

Present operation results, explanations and next actions. Use an appropriately ranked heading in `#title` when the content needs heading semantics.

## When To Use

Use for complex feedback with a title, description, body or actions.

## Examples

Ten real demos cover ordinary statuses, the three exception illustrations, complete custom icons, all semantic parts and live component tokens.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| status | Ordinary status or exception code; numeric/string codes are equivalent | `'success' \| 'error' \| 'info' \| 'warning' \| 403 \| 404 \| 500 \| '403' \| '404' \| '500'` | `'info'` |
| icon | Default graphic switch: false/null hides it, true/omitted shows it; an existing icon slot takes priority | `boolean \| null` | — |
| title / subTitle | Text fallback for the corresponding slot | `string` | — |
| prefixCls | Current class prefix; applications supply CSS for arbitrary custom prefixes | `string` | Provider prefix |
| classNames | Six semantic classes or a factory reading current props | `ResultSemanticClassNames \| ((info: { props: ResultProps }) => ResultSemanticClassNames)` | — |
| styles | Six semantic styles or a factory reading current props | `ResultSemanticStyles \| ((info: { props: ResultProps }) => ResultSemanticStyles)` | — |

### Slots

| Slot | Content |
|---|---|
| icon | Complete custom content for every status, including native interactive content |
| title / subTitle | Complete title/description content, overriding the matching text prop |
| extra | Actions |
| default | Body |

All five slots take no arguments. Multiple nodes, fragments, comments and native controls remain intact. A present empty slot suppresses fallback and creates no empty container; removing the slot restores fallback. Zero is valid text. Status/theme changes retain content that remains mounted; conditional removal follows Vue's normal unmount behavior.

### Native attributes, events and refs

Native class, all three Vue style forms, id, aria/data, tabindex and listeners belong to the root div. Classes concatenate; local semantic styles override Provider configuration; native root style wins last. There are no business emits or v-models. Root `@click` receives one native event.

`ResultRef.nativeElement: HTMLElement | null` identifies the root and becomes null after unmount. Result does not move focus or create alert/live announcements. Callers can supply native roles and ARIA attributes.

### Provider, semantic parts and themes

`components.result` accepts current className/style/classNames/styles; replacement, removal and restoration take effect. Configuration className/style remain valid root configuration fields. Nearest Providers, direction and prefix updates remain reactive. The six parts are root/title/subTitle/body/extra/icon; semantic factories receive current effective props, including default status info.

Configure `theme.components.Result`, or override root CSS variables. Source aliases and default/dark/compact/combined algorithms update live and remain scoped.

| Token | Type | Default | CSS variable |
|---|---|---|---|
| titleFontSize | `number \| string` | fontSizeHeading3 | `--apollo-result-title-font-size` |
| subtitleFontSize | `number \| string` | fontSize | `--apollo-result-subtitle-font-size` |
| iconFontSize | `number \| string` | fontSizeHeading3 × 3 | `--apollo-result-icon-font-size` |
| extraMargin | `string` | paddingLG 0 0 0 | `--apollo-result-extra-margin` |

Numeric font sizes use px; zero is valid. Negative/nonfinite numbers and empty strings fall back to current aliases. Strings accept valid CSS lengths, variables or calc expressions. extraMargin uses CSS margin shorthand. Import `@apollo-design/ui/style.css` or `@apollo-design/ui/result/style.css`.

### Static exports and SSR

PRESENTED_IMAGE_403/404/500 are reusable illustration components identical to their ExceptionMap entries; IconMap holds the four ordinary statuses. Default exception illustrations are decorative; ordinary status icons retain their image names. Custom slot content remains accessible. Illustration paths/colors stay static. Direct illustration consumers can supply native SVG names.

Production SSR uses no browser globals; hydrate with matching configuration/content. Types and exports are available from `@apollo-design/ui` or `@apollo-design/ui/result`. See the [development migration](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/migrations/result-contracts.md); no compatibility layer preserves the faulty shapes.
