---
category: Data Display
title: QRCode
subtitle: 二维码
---

Encode text/links into a QR code with canvas or svg rendering.

## When To Use

- Scan-able codes for links/text.
- Expired/loading/scanned status overlays with refresh.

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| value | Content (**required**, renders null + warning if missing) | `string \| string[]` | — |
| type | `'canvas' \| 'svg'` | — | `'canvas'` |
| size | Pixel size | `number` | `160` |
| icon | Center icon URL (auto-excavated) | `string` | — |
| color / bgColor | Foreground / background color | `string` | `colorText` / `'transparent'` |
| errorLevel | `'L' \| 'M' \| 'Q' \| 'H'` | — | `'M'` |
| status | `'active' \| 'expired' \| 'loading' \| 'scanned'` | — | `'active'` |
| bordered | Border | `boolean` | `true` |
| statusRender | Custom status overlay | `(info) => VNodeChild` | — |
| classNames / styles | Semantic slots `{ root, cover }` | — | — |

### Event

`refresh` — fired by the expired overlay's refresh button.

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme (Component Token)

1 token: `QRCodeCoverBackgroundColor` (`colorBgContainer` at 0.96 alpha) — CSS
variable `--apollo-qrcode-cover-background-color`.
