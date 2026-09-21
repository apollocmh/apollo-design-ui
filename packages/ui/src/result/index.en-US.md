---
category: Feedback
title: Result
subtitle: Result
---

Used to feed back the results of a series of operations.

## When To Use

- Use when important operations need to inform the user of the result and the feedback is complex.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| status | Result status (exception values render static illustrations) | `'success' \| 'error' \| 'info' \| 'warning' \| '403' \| '404' \| '500'` | `'info'` |
| icon | Custom icon (ignored for exception status; `null`/`false` disables) | `VNodeChild` | — |
| title | Title | `VNodeChild` | — |
| subTitle | Sub title | `VNodeChild` | — |
| extra | Operation area (a **prop**, not a slot) | `VNodeChild` | — |

### Static Exports

- `PRESENTED_IMAGE_403 / 404 / 500`: exception illustration components.
- `IconMap` / `ExceptionMap`: status to icon/illustration maps.

## Design Notes

- Illustrations are static hex (same as antd, theme-independent); Empty's illustrations are token-driven — different sources.
