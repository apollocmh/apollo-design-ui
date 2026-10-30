---
category: 数据展示
title: Watermark
subtitle: 水印
---

给页面区域添加不干扰内容与交互的装饰水印。参见 [`demo/`](./demo) 中的文本、多行、图片、动态配置及 Modal 继承示例。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| content | 水印文本；数组按行绘制，每行可覆盖字体 | `WatermarkContent \| WatermarkContent[]` | — |
| font | 字体，见下表 | `WatermarkFont` | `colorFill`、`fontSizeLG` 及正常无衬线字体 |
| image | 图片地址，优先于文本；加载失败时绘制 `content` | `string` | — |
| width / height | 单个水印单元宽高 | `number` | 文本测量 / 图片 120×64 |
| rotate | 旋转角度（度） | `number` | `-22` |
| gap | 间距 `[x, y]` | `[number, number]` | `[100, 100]` |
| offset | 偏移 `[left, top]`；绘制锚点为 `offset - gap / 2` | `[number, number]` | `gap / 2` |
| zIndex | 装饰层层级，支持 `0` | `number` | `zIndexPopupBase - 1` |
| inherit | 注册的子孙浮层继承本层水印；关闭后转交上层，无上层时不覆盖浮层 | `boolean` | `true` |

`class`、`style`、`id`、`aria-*` 和原生事件落到根 `div`。样式优先级为默认 `position: relative; overflow: hidden` → Provider 样式 → 原生 `style`；支持 Vue 对象、数组、字符串样式。防篡改恢复也遵守当前合法覆盖。

### 字体

| 字段 | 类型 | 默认值 |
|---|---|---|
| color | `string \| CanvasGradient \| CanvasPattern` | `colorFill` |
| fontSize | `number \| string` | `fontSizeLG` |
| fontWeight | `'normal' \| 'lighter' \| 'bold' \| 'bolder' \| number` | `'normal'` |
| fontStyle | `'normal' \| 'italic' \| 'oblique'` | `'normal'` |
| fontFamily | `string` | `'sans-serif'` |
| textAlign | `CanvasTextAlign` | `'center'` |

`fontSize` 的数字与纯数字字符串按像素解释；`16px`、`2rem`、`12pt`、`calc(...)` 等合法字号交给浏览器 canvas 原生解析，再用规范后的像素测量和缩放。相对单位在重绘时求值，不单独观察外部字体加载或页面字号变化。浏览器拒绝的字体在绘制时抛出 `TypeError`，不悄悄沿用旧字体。每行字体字段为 `undefined` 时继承当前有效字体。

### 插槽与事件

| 插槽 | 说明 |
|---|---|
| default | 被水印覆盖的原生内容，无作用域参数；普通配置更新保留子树身份 |

| 事件 | 说明 | 参数 |
|---|---|---|
| remove | 受管理的水印节点被移除或换父并恢复时通知，每次恢复一次；首次绘制、主动切换继承及正常卸载不触发 | 无 |

使用 `<Watermark @remove="notify">`；程序调用的 `onRemove` 是 Vue 事件监听器，支持监听器替换和 `.once`，不再是组件回调 prop。

### Ref

`WatermarkRef.nativeElement: HTMLDivElement | null` 指向当前根元素。SSR 仅渲染根与默认槽，挂载后才开始 canvas、图片和观察器工作；卸载会取消帧、断开图片回调与观察器，并清除所管理的浮层水印。

### Theme

本组件没有样式表或 Component Token。绘制直接读取当前 `zIndexPopupBase`、`colorFill`、`fontSizeLG` alias token，支持 Provider 替换与撤除。

### 迁移

防篡改通知改为 Vue `remove` 事件。`fontStyle: 'none'` 不是有效字体值，请改为 `'normal'`。图片地址变更现在会使同尺寸缓存失效，不需要附带修改宽高。
