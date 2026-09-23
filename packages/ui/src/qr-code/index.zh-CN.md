---
category: 数据展示
title: QRCode
subtitle: 二维码
---

将文本/链接编码为二维码，支持 canvas / svg 两种渲染形态。

## 何时使用

- 需要将链接或文本转成二维码供扫描。
- 需要二维码过期刷新、加载中、已扫描等状态覆盖层。

## 代码演示

见 [`demo/`](./demo)（4 个：basic / custom / status / svg）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 二维码内容（**必填**，缺省渲染 null 并告警） | `string \| string[]` | — |
| type | 渲染形态 | `'canvas' \| 'svg'` | `'canvas'` |
| size | 像素尺寸 | `number` | `160` |
| icon | 中心图标 URL（canvas/svg 均支持，自动挖空中心） | `string` | — |
| iconSize | 图标尺寸 | `number \| { width?, height? }` | `40` |
| color | 前景色 | `string` | `colorText` |
| bgColor | 背景色 | `string` | `'transparent'` |
| errorLevel | 纠错级别（⚠️ `L` 与 `icon` 同用会告警） | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` |
| status | 状态：`active` / `expired` / `loading` / `scanned`（非 active 渲染覆盖层） | — | `'active'` |
| bordered | 边框 | `boolean` | `true` |
| marginSize | 静默区模块数 | `number` | `0` |
| boostLevel | 提升纠错级别以增强容错 | `boolean` | — |
| statusRender | 自定义状态覆盖层 | `(info) => VNodeChild` | — |
| title | 仅 svg：`<title>` | `string` | — |
| classNames / styles | 语义槽 `{ root, cover }` | — | — |

### 事件

| 事件 | 说明 |
|---|---|
| refresh | 点击过期覆盖层的刷新按钮 |

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme（Component Token）

1 个：`QRCodeCoverBackgroundColor`（覆盖层背景 = `colorBgContainer` 透明到 0.96，
CSS 变量 `--apollo-qrcode-cover-background-color`）。

## FAQ

**canvas 与 svg 有区别吗？**

同一编码矩阵：canvas 像素绘制（适合导出图片），svg 矢量（SSR 友好、无损缩放）。
`type="svg"` 支持 `title`。

**二维码引擎是什么？**

Nayuki 的 qrcodegen（MIT，与 antd 链路同源）⇒ 同输入的矩阵/路径与 antd 逐字节一致。
