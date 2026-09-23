---
category: Data Display
title: Collapse
subtitle: 折叠面板
---

A group of collapsible panels.

## When To Use

- Group and hide large content sections (FAQ, settings).
- Accordion (only one panel open).

## API

### Collapse

| Prop | Description | Type | Default |
|---|---|---|---|
| items | Panel list (preferred): `{ key, label, children, collapsible?, extra?, ... }` | — | — |
| activeKey / defaultActiveKey | Controlled / uncontrolled open keys | `string \| number \| (string \| number)[]` | — |
| accordion | Only one panel open | `boolean` | — |
| bordered / ghost / size | Visual variants | — | `true` / — / `'middle'` |
| collapsible | `'header' \| 'icon' \| 'disabled'` | — | — |
| expandIcon | Custom icon `(panelProps) => VNodeChild` | — | — |
| expandIconPlacement | `'start' \| 'end'` | — | `'start'` |
| destroyOnHidden | Destroy hidden content | `boolean` | — |
| onChange | `(key: string[]) => void` | — | — |
| classNames / styles | Semantic slots `{ root, header, title, body, icon }` | — | — |

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme (Component Token)

10 tokens (CSS variables `--apollo-collapse-*`): `headerBg`, `contentBg`,
`headerPadding(SM/LG)`, `contentPadding(SM/LG)`, `borderlessContentPadding`,
`borderlessContentBg`; derived `collapsePanelBorderRadius = borderRadiusLG`.
