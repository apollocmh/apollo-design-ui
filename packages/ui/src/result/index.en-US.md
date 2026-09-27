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
| icon | Custom icon switch: `null`/`false` disables; custom icon via the `#icon` slot (C8-R2) | `boolean \| null` | — |
| title | Title text (rich content via the `#title` slot; slot wins) | `string` | — |
| subTitle | Subtitle text (rich content via the `#subTitle` slot; slot wins) | `string` | — |

### Static Exports

- `PRESENTED_IMAGE_403 / 404 / 500`: exception illustration components.
- `IconMap` / `ExceptionMap`: status to icon/illustration maps.

## Design Notes

- Illustrations are static hex (same as antd, theme-independent); Empty's illustrations are token-driven — different sources.
