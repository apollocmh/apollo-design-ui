---
category: Data Display
title: QRCode
subtitle: 二维码
---

Encode text or segments using canvas or SVG. The caller controls status; the component has no request manager or v-model.

## Demos

Five real examples: [basic](./demo/basic.vue), [custom](./demo/custom.vue), [status](./demo/status.vue), [svg](./demo/svg.vue), [component-token](./demo/component-token.vue).

## API

| Prop | Description | Type | Default |
|---|---|---|---|
| value | Content; missing or empty strings render nothing and warn in development | string \| string[] | — |
| type | Drawing mode | canvas \| svg | canvas |
| size | Positive finite logical size; invalid values fall back to 160 | number | 160 |
| icon | Center image URL; canvas excavates after loading | string | — |
| iconSize | Positive finite dimensions; missing/invalid axes fall back to 40 | number \| { width?, height? } | 40 |
| color | Neutral image foreground from the default theme | string | default colorText |
| bgColor | Explicit image and host background; when omitted pixels are transparent over a white host. Explicit transparent makes the host transparent | string | — |
| errorLevel | Error correction; L with an icon warns in development | L \| M \| Q \| H | M |
| status | Active has no cover | active \| expired \| loading \| scanned | active |
| bordered | Show border | boolean | true |
| marginSize | Quiet-zone modules, floored and clamped nonnegative; nonfinite values fall back to 0 | number | 0 |
| boostLevel | Permit the encoder to increase correction | boolean | encoder default |
| title | Actual image name in both modes; SVG also renders title | string | QR code |
| prefixCls | Current class prefix; preload matching static CSS | string | apollo-qrcode |
| classNames / styles | Root and cover semantic classes/CSS; native class/style remain on the root and take precedence | { root?, cover? } | — |

### Slots

status receives { status, locale, refresh }. It renders complete native content and is read at render time only while nonactive. An existing empty slot suppresses defaults. refresh is a stable emit action regardless of listener presence.

```vue
<QrCode value="https://apollo.design" status="expired" @refresh="reload">
  <template #status="{ status, locale, refresh }">
    <span>{{ status }}</span>
    <button type="button" @click="refresh">{{ locale.refresh }}</button>
  </template>
</QrCode>
```

### Emits / Expose

refresh has no payload. @refresh, onRefresh, dynamic listeners and .once follow Vue semantics. There is no v-model.

nativeElement is HTMLDivElement or null. Status changes retain the root and same-mode graphic; nonactive states retain native status editors. Changing canvas/SVG replaces only the graphic. Hidden/unmounted roots are null.

### Provider and styling

components.qrcode supports className, style, classNames and styles. Current locale.QRCode supplies default status labels and the slot scope.

QRCodeCoverBackgroundColor is the single Component Token, derived from current colorBgContainer at 96% opacity. Override it through theme.components.QRCode or the higher-priority root CSS variable --apollo-qrcode-cover-background-color. Dark and compact themes affect the UI and cover; default QR images retain neutral contrast. Callers own contrast when supplying explicit backgrounds/foregrounds.

Native string, array and object styles target the root. Graphics fill its inner area while preserving aspect ratio. size controls logical drawing and DPR controls canvas resolution; root dimensions are not copied as graphic inline styles.

The licensed Nayuki engine and existing matrix/path/correction/icon algorithms are retained. Inputs remain subject to standard QR capacity limits; canvas export follows browser cross-origin security rules. This component adds no download, scanner or request API.
