---
category: 数据展示
title: Watermark
subtitle: 水印
---

给页面的某个区域加上水印。

## 何时使用

- 页面需要标识版权/归属，且不干扰正常阅读与交互时。
- 敏感内容截图溯源（配合 `onRemove` 做防篡改告警）。

## 代码演示

见 [`demo/`](./demo)（4 个：basic / multi-line / image / custom；`portal` 依赖
未落地的 Modal + Drawer，暂缺）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| content | 水印文本（数组即多行，每行可带独立 `font`） | `string \| WatermarkText \| (string \| WatermarkText)[]` | — |
| font | 文本字体（`color` / `fontSize` / `fontWeight` / `fontStyle` / `fontFamily` / `textAlign`） | `WatermarkFont` | `{ color: colorFill, fontSize: fontSizeLG }` |
| image | 图片水印地址（优先级高于 `content`） | `string` | — |
| width / height | 单个水印单元的宽高 | `number` | 文本测量 / 图片 120×64 |
| rotate | 旋转角度（度） | `number` | `-22` |
| gap | 水印间距 `[x, y]` | `[number, number]` | `[100, 100]` |
| offset | 偏移 `[left, top]`（实际 `position = offset - gap / 2`） | `[number, number]` | `gap / 2` |
| zIndex | 层级 | `number` | `zIndexPopupBase - 1`（999） |
| inherit | 子孙浮层是否继承水印 | `boolean` | `true` |
| onRemove | 水印元素被移除/换父时触发（防篡改） | `() => void` | — |
| class / style | **根元素原生 attrs**（不是 Props）；`style` 可覆盖 `position`/`overflow` | — | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | 被水印覆盖的内容 |

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLDivElement \| null` |

## Theme（Component Token）

无 —— 本组件没有样式表（全内联 style + canvas）。运行时消费 `zIndexPopupBase` /
`colorFill` / `fontSizeLG` 三个 alias token 的**实值**。
